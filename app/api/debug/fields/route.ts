import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Airtable from 'airtable';

export async function GET() {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as { role?: string })?.role === 'admin';
  if (!session || !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);
  const records = await base('Alumni').select({ maxRecords: 1 }).all();
  if (records.length === 0) return NextResponse.json({ fields: [] });

  const fieldNames = Object.keys(records[0].fields).sort();
  return NextResponse.json({ fieldNames });
}
