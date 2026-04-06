import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createAuthRecord, getAllAlumni } from '@/lib/airtable';
import bcrypt from 'bcryptjs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function requireAdmin(session: any) {
  return session?.user?.role === 'admin';
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !requireAdmin(session))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { alumniIds, password } = await req.json() as {
      alumniIds: string[];
      password: string;
    };

    if (!alumniIds?.length || !password || password.length < 8) {
      return NextResponse.json(
        { error: 'Alumni IDs and password (min 8 chars) required' },
        { status: 400 }
      );
    }

    const alumni = await getAllAlumni();
    const alumniMap = new Map(alumni.map((a) => [a.id, a]));
    const passwordHash = await bcrypt.hash(password, 12);

    const results: { id: string; email: string; name: string; success: boolean; error?: string }[] = [];

    for (const id of alumniIds) {
      const alum = alumniMap.get(id);
      if (!alum) {
        results.push({ id, email: '', name: '', success: false, error: 'Alumni not found' });
        continue;
      }
      if (!alum.email) {
        results.push({ id, email: '', name: alum.fullName, success: false, error: 'No email address' });
        continue;
      }
      try {
        await createAuthRecord({
          email: alum.email.toLowerCase(),
          passwordHash,
          role: 'alumni',
          alumniRecordId: id,
          name: alum.fullName,
          mustChangePassword: true,
        });
        results.push({ id, email: alum.email, name: alum.fullName, success: true });
      } catch (err) {
        results.push({ id, email: alum.email, name: alum.fullName, success: false, error: String(err) });
      }
    }

    const succeeded = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({ succeeded, failed, results });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Bulk grant failed' }, { status: 500 });
  }
}
