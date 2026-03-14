import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getMessagesByEmail, createMessage, markMessageRead, getAllAlumni } from '@/lib/airtable';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const messages = await getMessagesByEmail(session.user.email);
    return NextResponse.json(messages);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { toEmail, toName, subject, body } = await req.json();
    if (!toEmail || !body) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const message = await createMessage({
      fromEmail: session.user.email,
      fromName: session.user.name || '',
      toEmail,
      toName: toName || '',
      subject: subject || '(no subject)',
      body,
    });
    return NextResponse.json(message);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { messageId } = await req.json();
    await markMessageRead(messageId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
}
