import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAuthByEmail, updateAuthPassword } from '@/lib/airtable';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Both current and new password are required' }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
    }

    // Look up the user's auth record
    const authRecord = await getAuthByEmail(session.user.email);
    if (!authRecord) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Verify current password
    const valid = await bcrypt.compare(currentPassword, authRecord.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    // Hash and save new password
    const newHash = await bcrypt.hash(newPassword, 12);
    await updateAuthPassword(authRecord.id, newHash);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[Change Password Error]', err);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
}
