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
    // Strip AI-computed and known read-only fields — Airtable rejects writes to them
    const AI_FIELDS = new Set([
      'Summary of Career Progression (AI)',
      'Networking Category (AI)',
      'Standardized Location',
      'Summarized Interest Group', // AI agent field (no "(AI)" suffix but still computed)
    ]);
    const filtered: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(body)) {
      if (AI_FIELDS.has(key) || key.includes('(AI)')) continue;
      filtered[key] = value;
    }

    try {
      const updated = await updateAlumni(params.id, filtered);
      return NextResponse.json(updated);
    } catch (airtableErr) {
      // Bulk update failed — try per-field to identify which one(s) are bad
      console.error('[PATCH /api/alumni] bulk update failed, falling back to per-field:', airtableErr);
      const failed: { field: string; error: string }[] = [];
      const succeeded: string[] = [];
      for (const [key, value] of Object.entries(filtered)) {
        try {
          await updateAlumni(params.id, { [key]: value });
          succeeded.push(key);
        } catch (perFieldErr) {
          const msg = perFieldErr instanceof Error ? perFieldErr.message : String(perFieldErr);
          failed.push({ field: key, error: msg });
          console.error(`[PATCH /api/alumni] failed field "${key}":`, msg);
        }
      }
      if (failed.length === 0) {
        // All per-field writes succeeded — return success
        const refreshed = await (await import('@/lib/airtable')).getAlumniById(params.id);
        return NextResponse.json(refreshed);
      }
      const summary = failed.map((f) => `${f.field}: ${f.error}`).join(' | ');
      return NextResponse.json(
        {
          error: `Some fields failed to save. ${summary}`,
          failed,
          succeeded,
        },
        { status: 500 }
      );
    }
  } catch (err) {
    console.error('[PATCH /api/alumni] unexpected error:', err);
    const message = err instanceof Error ? err.message : 'Failed to update alumni';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
