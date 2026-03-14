import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateAuthPassword } from '@/lib/airtable';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as { role?: string })?.role === 'admin';
  if (!session || !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  try {
    const { authId, newPassword } = await req.json();
    if (!authId || !newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: 'authId and newPassword (min 8 chars) required' }, { status: 400 });
    }
    const hash = await bcrypt.hash(newPassword, 12);
    await updateAuthPassword(authId, hash);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
