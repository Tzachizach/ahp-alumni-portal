import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAlumniById, updateAlumni } from '@/lib/airtable';

// Airtable attachment limits
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Only the profile owner or an admin can change the photo
  const userAlumniId = (session.user as { alumniRecordId?: string }).alumniRecordId;
  const isAdmin = (session.user as { role?: string }).role === 'admin';
  if (!isAdmin && userAlumniId !== params.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let file: File | null = null;
  try {
    const formData = await req.formData();
    file = formData.get('photo') as File | null;
  } catch (err) {
    console.error('[Photo upload] formData parse failed:', err);
    return NextResponse.json(
      { error: 'Could not read uploaded file' },
      { status: 400 }
    );
  }

  if (!file) {
    return NextResponse.json({ error: 'No photo provided' }, { status: 400 });
  }
  if (!file.type.startsWith('image/')) {
    return NextResponse.json(
      { error: 'File must be an image (JPEG, PNG, etc.)' },
      { status: 400 }
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: 'Image must be under 5 MB' },
      { status: 413 }
    );
  }

  // Encode to base64 for Airtable's uploadAttachment endpoint
  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString('base64');

  const baseId = process.env.AIRTABLE_BASE_ID;
  const apiKey = process.env.AIRTABLE_API_KEY;
  if (!baseId || !apiKey) {
    return NextResponse.json(
      { error: 'Server misconfigured (missing Airtable credentials)' },
      { status: 500 }
    );
  }

  const filename = file.name && file.name.length > 0
    ? file.name
    : `profile-${Date.now()}.jpg`;

  const airtableRes = await fetch(
    `https://content.airtable.com/v0/${baseId}/${params.id}/${encodeURIComponent('Profile Photo')}/uploadAttachment`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contentType: file.type,
        file: base64,
        filename,
      }),
    }
  );

  if (!airtableRes.ok) {
    const errText = await airtableRes.text();
    console.error('[Photo upload] Airtable error:', airtableRes.status, errText);
    return NextResponse.json(
      { error: `Airtable rejected the upload (${airtableRes.status}): ${errText.slice(0, 300)}` },
      { status: 500 }
    );
  }

  // The uploadAttachment endpoint APPENDS to the attachment field, so we now
  // have the new photo plus all previous ones. Parse the response, find the
  // newly uploaded attachment, and overwrite the field to keep only that one —
  // Airtable will then garbage-collect the orphaned older attachments.
  try {
    const payload = await airtableRes.json();
    const attachments = payload?.fields?.['Profile Photo'] as
      | { id: string; url: string; createdTime?: string }[]
      | undefined;

    if (attachments && attachments.length > 0) {
      // The uploadAttachment endpoint pushes the new attachment to the end of
      // the array, so the last item is the one we just uploaded.
      const newest = attachments[attachments.length - 1];
      if (attachments.length > 1) {
        await updateAlumni(params.id, {
          'Profile Photo': [{ id: newest.id }],
        });
      }
    }
  } catch (err) {
    // Non-fatal — the upload itself succeeded. Worst case: old photos linger
    // and we can clean them up later.
    console.warn('[Photo upload] Could not prune old attachments:', err);
  }

  // Return the refreshed alumni record so the client can update the UI
  const updated = await getAlumniById(params.id);
  return NextResponse.json(updated);
}
