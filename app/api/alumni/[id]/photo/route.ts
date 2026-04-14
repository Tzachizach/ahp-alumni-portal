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

  // Capture the newly uploaded attachment's ID directly from the
  // uploadAttachment response. The response may key fields by name or by
  // field ID, so scan for the attachment array and take the last item
  // (uploadAttachment appends to the end).
  let newAttachmentId: string | null = null;
  try {
    const payload = await airtableRes.json();
    const fields = payload?.fields as Record<string, unknown> | undefined;
    if (fields) {
      for (const value of Object.values(fields)) {
        if (Array.isArray(value) && value.length > 0) {
          const last = value[value.length - 1] as { id?: string; url?: string };
          if (last?.id && last?.url) {
            newAttachmentId = last.id;
            break;
          }
        }
      }
    }
    console.log('[Photo upload] new attachment ID from response:', newAttachmentId);
  } catch (err) {
    console.warn('[Photo upload] Could not parse upload response:', err);
  }

  // The uploadAttachment endpoint APPENDS, so the field now has the new
  // photo plus all previous ones. Overwrite the field to keep only the
  // new one — Airtable garbage-collects the orphaned older attachments.
  try {
    const fetchRes = await fetch(
      `https://api.airtable.com/v0/${baseId}/Alumni/${params.id}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    if (fetchRes.ok) {
      const recordData = await fetchRes.json();
      const attachments = recordData?.fields?.['Profile Photo'] as
        | { id: string; url: string }[]
        | undefined;

      console.log(
        '[Photo upload] current Profile Photo count:',
        attachments?.length ?? 0
      );

      if (attachments && attachments.length > 1) {
        // Prefer the ID from the upload response; fall back to the last
        // attachment in the array (uploadAttachment appends to the end).
        const keepId = newAttachmentId ?? attachments[attachments.length - 1].id;
        console.log('[Photo upload] pruning to keep only:', keepId);
        await updateAlumni(params.id, {
          'Profile Photo': [{ id: keepId }],
        });
      } else if (attachments && attachments.length === 1 && newAttachmentId && attachments[0].id !== newAttachmentId) {
        // Weird case: refetch shows only one attachment but it's not the new one.
        // Means the new one didn't make it in. Log for diagnosis.
        console.warn(
          '[Photo upload] single attachment does not match uploaded ID — newAttachmentId=',
          newAttachmentId,
          'present=',
          attachments[0].id
        );
      }
    } else {
      const errText = await fetchRes.text();
      console.warn(
        '[Photo upload] Could not fetch record for prune:',
        fetchRes.status,
        errText.slice(0, 200)
      );
    }
  } catch (err) {
    // Non-fatal — the upload itself succeeded.
    console.warn('[Photo upload] Could not prune old attachments:', err);
  }

  // Return the refreshed alumni record so the client can update the UI
  const updated = await getAlumniById(params.id);
  return NextResponse.json(updated);
}
