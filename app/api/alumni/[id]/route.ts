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
    // Strip AI-computed fields — Airtable rejects writes to them
    const AI_FIELDS = new Set([
      'Summary of Career Progression (AI)',
      'Networking Category (AI)',
      'Standardized Location',
    ]);
    const filtered: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (AI_FIELDS.has(key) || key.includes('(AI)')) continue;
      filtered[key] = value;
    }
    const updated = await updateAlumni(params.id, filtered);
    return NextResponse.json(updated);
  } catch (err) {
    console.error('[PATCH /api/alumni] Airtable error:', err);
    const message = err instanceof Error ? err.message : 'Failed to update alumni';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
