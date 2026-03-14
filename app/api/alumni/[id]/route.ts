import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAlumniById, updateAlumni } from '@/lib/airtable';

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const alumni = await getAlumniById(params.id);
    if (!alumni) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(alumni);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch alumni' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Ensure user can only edit their own profile (unless admin)
  const userAlumniId = (session.user as { alumniRecordId?: string }).alumniRecordId;
  const isAdmin = (session.user as { role?: string }).role === 'admin';
  if (!isAdmin && userAlumniId !== params.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const updated = await updateAlumni(params.id, body);
    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update alumni' }, { status: 500 });
  }
}
