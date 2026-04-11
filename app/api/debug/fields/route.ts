import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Airtable from 'airtable';

export async function GET() {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as { role?: string })?.role === 'admin';
  if (!session || !isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID!);
  // Pull several records so we see all fields (a single record may have empty fields omitted)
  const records = await base('Alumni').select({ maxRecords: 10 }).all();
  if (records.length === 0) return NextResponse.json({ fields: [] });

  // Combine all field names seen across these records
  const fieldInfo: Record<string, { type: string; sample: unknown }> = {};
  for (const rec of records) {
    const f = rec.fields as Record<string, unknown>;
    for (const [key, value] of Object.entries(f)) {
      if (!fieldInfo[key]) {
        fieldInfo[key] = {
          type: Array.isArray(value) ? 'array' : typeof value,
          sample: Array.isArray(value) ? value.slice(0, 3) : value,
        };
      }
    }
  }

  const allFields = Object.keys(fieldInfo).sort();

  // Highlight the fields we care about right now
  const focus = [
    'LinkedIn',
    'LinkedIn URL',
    'LinkedIn Profile',
    'Professional achievements and accomplishments',
    'Professional Achievements and Accomplishments',
    'Summarized Interest Group',
    'Areas of Interest for Engagement',
  ];
  const focusInfo: Record<string, unknown> = {};
  for (const name of focus) {
    focusInfo[name] = fieldInfo[name] ?? '(not found)';
  }

  return NextResponse.json({
    allFields,
    focusInfo,
    allFieldsWithTypes: fieldInfo,
  });
}
