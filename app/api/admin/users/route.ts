import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getAllAuthRecords, createAuthRecord, deleteAuthRecord, getAllAlumni,
} from '@/lib/airtable';
import bcrypt from 'bcryptjs';

function requireAdmin(session: ReturnType<typeof getServerSession> extends Promise<infer T> ? T : never) {
  return (session?.user as { role?: string })?.role === 'admin';
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !requireAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const [authRecords, alumni] = await Promise.all([getAllAuthRecords(), getAllAlumni()]);
    const alumniMap = new Map(alumni.map((a) => [a.id, a]));
    const combined = authRecords.map((auth) => ({
      ...auth,
      alumniName: alumniMap.get(auth.alumniRecordId)?.fullName || auth.name,
      alumniEmail: alumniMap.get(auth.alumniRecordId)?.email || auth.email,
    }));
    return NextResponse.json({ authRecords: combined, alumni });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !requireAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { email, password, role, alumniRecordId, name } = await req.json();
    if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });

    const passwordHash = await bcrypt.hash(password, 12);
    const record = await createAuthRecord({ email: email.toLowerCase(), passwordHash, role: role || 'alumni', alumniRecordId, name });
    return NextResponse.json(record);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !requireAdmin(session)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { authId } = await req.json();
    await deleteAuthRecord(authId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
