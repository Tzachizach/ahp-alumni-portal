import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAllAlumni } from '@/lib/airtable';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const alumni = await getAllAlumni();
    return NextResponse.json(alumni);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Failed to fetch alumni' }, { status: 500 });
  }
}
