import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createMessage, getAllAuthRecords } from '@/lib/airtable';

const VALID_CATEGORIES = new Set(['Suggestion', 'Comment', 'Bug', 'Compliment']);

/**
 * Receives feedback from any signed-in alum and fans it out to every
 * admin user as an in-site Message.
 *
 * Designed so that adding email-on-arrival later is a one-line edit:
 * just call `sendEmail()` alongside the existing `createMessage()` loop.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { category?: string; subject?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const category = VALID_CATEGORIES.has(body.category || '') ? body.category : 'Comment';
  const subject = (body.subject || '').trim();
  const message = (body.message || '').trim();

  if (!message) {
    return NextResponse.json({ error: 'Please write a message before sending.' }, { status: 400 });
  }
  if (message.length > 5000) {
    return NextResponse.json({ error: 'Message is too long (5,000 characters max).' }, { status: 400 });
  }

  let admins;
  try {
    const allAuth = await getAllAuthRecords();
    admins = allAuth.filter((a) => a.role === 'admin' && a.email);
  } catch (err) {
    console.error('[Feedback] Failed to load admins:', err);
    return NextResponse.json(
      { error: 'Could not reach the admin list. Please try again in a moment.' },
      { status: 500 }
    );
  }

  if (admins.length === 0) {
    console.error('[Feedback] No admins configured');
    return NextResponse.json(
      { error: 'No program administrators are configured yet. Please email the program directly.' },
      { status: 500 }
    );
  }

  const fromEmail = session.user.email;
  const fromName = session.user.name || fromEmail;
  const subjectLine = `[Feedback: ${category}] ${subject || '(no subject)'}`;

  // Fan out one Message per admin. Partial successes still count as a win;
  // we only fail the request if every delivery fails.
  const results = await Promise.allSettled(
    admins.map((admin) =>
      createMessage({
        fromEmail,
        fromName,
        toEmail: admin.email,
        toName: admin.name || admin.email,
        subject: subjectLine,
        body: message,
      })
    )
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  if (succeeded === 0) {
    console.error('[Feedback] All deliveries failed:', results);
    return NextResponse.json(
      { error: 'Could not deliver feedback right now. Please try again later.' },
      { status: 500 }
    );
  }

  // TODO when OSU email infra is set up: send a copy via Resend / SendGrid
  // here so feedback also lands in the admins' actual inbox.

  return NextResponse.json({
    success: true,
    deliveredTo: succeeded,
    totalAdmins: admins.length,
  });
}
