import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import Airtable from 'airtable';

// ONE-TIME SETUP ENDPOINT — sets password for an auth record using bcryptjs
// DELETE THIS FILE after first use

export async function POST(req: Request) {
  const { email, password, secret } = await req.json();

  // Simple guard so random people can't use this
  if (secret !== 'ahp-setup-2024') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
    process.env.AIRTABLE_BASE_ID!
  );

  // Find the auth record
  const records = await base('Auth')
    .select({ filterByFormula: `LOWER({Email}) = '${email.toLowerCase()}'`, maxRecords: 1 })
    .all();

  if (records.length === 0) {
    return NextResponse.json({ error: 'No auth record found for that email' }, { status: 404 });
  }

  // Generate hash with bcryptjs (same library the app uses to verify)
  const hash = await bcrypt.hash(password, 12);

  // Update the record
  await base('Auth').update(records[0].id, { 'Password Hash': hash });

  return NextResponse.json({ ok: true, message: 'Password set successfully. You can now log in.' });
}
