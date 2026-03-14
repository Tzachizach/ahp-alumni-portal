import Airtable from 'airtable';
import { Alumni, Message, AlumniEvent } from './types';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID!
);

// ─── Helper: map raw Airtable record → Alumni ────────────────────────────────
function mapAlumni(record: Airtable.Record<Airtable.FieldSet>): Alumni {
  const f = record.fields as Record<string, unknown>;

  const photoArr = f['Profile Photo'] as { url: string }[] | undefined;
  const photo = photoArr && photoArr.length > 0 ? photoArr[0].url : null;

  return {
    id: record.id,
    fullName: (f['Full Name'] as string) || '',
    profilePhoto: photo,
    email: (f['Email Address'] as string) || '',
    phone: (f['Phone Number'] as string) || '',
    graduationYear: f['Graduation Year'] ? String(f['Graduation Year']) : '',
    degreeEarned: (f['Degree Earned'] as string) || '',
    currentJobTitle: (f['Current Job Title'] as string) || '',
    currentEmployer: (f['Current Employer'] as string) || '',
    previousJobTitle: (f['Previous Job Title'] as string) || '',
    previousEmployer: (f['Previous employer'] as string) || '',
    location: (f['Location'] as string) || '',
    linkedIn: (f['LinkedIn'] as string) || '',
    careerMilestones: (f['Career Milestones'] as string) || '',
    summaryOfCareerProgression: (f['Summary of Career Progression'] as string) || '',
    professionalAchievements: (f['Professional achievements and accomplishments'] as string) || '',
    professionalAreasOfExpertise: (f['Professional areas of expertise'] as string) || '',
    networkingPreferences: (f['Networking Preferences'] as string) || '',
    networkingCategory: (f['Networking Category'] as string) || '',
    favoriteMemory: (f['Favorite Professor/Young Memory'] as string) || '',
    favoriteAHPMemory: (f['Favorite accounting honors memory'] as string) || '',
    personalAchievements: (f['Personal achievements beyond work'] as string) || '',
    summarizedInterestGroup: (f['Summarized Interest Group'] as string) || '',
    areasOfInterestForEngagement: (f['Areas of interest for engagement'] as string) || '',
    adviceForCurrentStudents: (f['Advice for current students'] as string) || '',
    alumniEvents: (f['Alumni Events'] as string[]) || [],
  };
}

// ─── Alumni CRUD ──────────────────────────────────────────────────────────────
export async function getAllAlumni(): Promise<Alumni[]> {
  // Fetch all fields — avoids errors if some fields don't exist in the base
  const records = await base('Alumni').select().all();
  return records.map(mapAlumni);
}

export async function getAlumniById(recordId: string): Promise<Alumni | null> {
  try {
    const record = await base('Alumni').find(recordId);
    return mapAlumni(record);
  } catch {
    return null;
  }
}

export async function getAlumniByEmail(email: string): Promise<Alumni | null> {
  const records = await base('Alumni')
    .select({
      filterByFormula: `{Email Address} = '${email}'`,
      maxRecords: 1,
    })
    .all();

  if (records.length === 0) return null;
  return mapAlumni(records[0]);
}

export async function updateAlumni(
  recordId: string,
  fields: Partial<{
    'Phone Number': string;
    'Location': string;
    'LinkedIn': string;
    'Current Job Title': string;
    'Current Employer': string;
    'Previous Job Title': string;
    'Previous employer': string;
    'Summary of Career Progression': string;
    'Professional achievements and accomplishments': string;
    'Professional areas of expertise': string;
    'Networking Preferences': string;
    'Favorite Professor/Young Memory': string;
    'Favorite accounting honors memory': string;
    'Personal achievements beyond work': string;
    'Summarized Interest Group': string;
    'Areas of interest for engagement': string;
    'Advice for current students': string;
  }>
): Promise<Alumni> {
  const record = await base('Alumni').update(recordId, fields);
  return mapAlumni(record);
}

// ─── Auth Table ───────────────────────────────────────────────────────────────
export interface AuthRecord {
  id: string;
  email: string;
  passwordHash: string;
  role: 'alumni' | 'admin';
  alumniRecordId: string;
  name: string;
  mustChangePassword: boolean;
}

export async function getAuthByEmail(email: string): Promise<AuthRecord | null> {
  try {
    console.log('[Auth] Looking up email:', email);
    const records = await base('Auth')
      .select({
        filterByFormula: `LOWER({Email}) = '${email.toLowerCase()}'`,
        maxRecords: 1,
      })
      .all();

    console.log('[Auth] Records found:', records.length);
    if (records.length === 0) {
      console.log('[Auth] No user found for email:', email);
      return null;
    }
    const f = records[0].fields as Record<string, unknown>;
    return {
      id: records[0].id,
      email: (f['Email'] as string) || '',
      passwordHash: (f['Password Hash'] as string) || '',
      role: ((f['Role'] as string) || 'alumni') as 'alumni' | 'admin',
      alumniRecordId: (f['Alumni Record ID'] as string) || '',
      name: (f['Name'] as string) || '',
      mustChangePassword: (f['Must Change Password'] as boolean) || false,
    };
  } catch (err) {
    console.error('[Auth] Error looking up user:', err);
    return null;
  }
}

export async function createAuthRecord(data: {
  email: string;
  passwordHash: string;
  role: 'alumni' | 'admin';
  alumniRecordId: string;
  name: string;
}): Promise<AuthRecord> {
  const record = await base('Auth').create({
    Email: data.email,
    'Password Hash': data.passwordHash,
    Role: data.role,
    'Alumni Record ID': data.alumniRecordId,
    Name: data.name,
    'Must Change Password': false,
  });
  const f = record.fields as Record<string, unknown>;
  return {
    id: record.id,
    email: (f['Email'] as string) || '',
    passwordHash: (f['Password Hash'] as string) || '',
    role: ((f['Role'] as string) || 'alumni') as 'alumni' | 'admin',
    alumniRecordId: (f['Alumni Record ID'] as string) || '',
    name: (f['Name'] as string) || '',
    mustChangePassword: (f['Must Change Password'] as boolean) || false,
  };
}

export async function updateAuthPassword(authId: string, newHash: string): Promise<void> {
  await base('Auth').update(authId, { 'Password Hash': newHash, 'Must Change Password': false });
}

export async function getAllAuthRecords(): Promise<AuthRecord[]> {
  const records = await base('Auth').select().all();
  return records.map((r) => {
    const f = r.fields as Record<string, unknown>;
    return {
      id: r.id,
      email: (f['Email'] as string) || '',
      passwordHash: (f['Password Hash'] as string) || '',
      role: ((f['Role'] as string) || 'alumni') as 'alumni' | 'admin',
      alumniRecordId: (f['Alumni Record ID'] as string) || '',
      name: (f['Name'] as string) || '',
      mustChangePassword: (f['Must Change Password'] as boolean) || false,
    };
  });
}

export async function deleteAuthRecord(authId: string): Promise<void> {
  await base('Auth').destroy(authId);
}

// ─── Messages Table ───────────────────────────────────────────────────────────
export async function getMessagesByEmail(email: string): Promise<Message[]> {
  const records = await base('Messages')
    .select({
      filterByFormula: `OR({To Email} = '${email}', {From Email} = '${email}')`,
      sort: [{ field: 'Created At', direction: 'desc' }],
    })
    .all();

  return records.map((r) => {
    const f = r.fields as Record<string, unknown>;
    return {
      id: r.id,
      fromEmail: (f['From Email'] as string) || '',
      fromName: (f['From Name'] as string) || '',
      toEmail: (f['To Email'] as string) || '',
      toName: (f['To Name'] as string) || '',
      subject: (f['Subject'] as string) || '',
      body: (f['Body'] as string) || '',
      createdAt: (f['Created At'] as string) || '',
      read: (f['Read'] as boolean) || false,
    };
  });
}

export async function createMessage(data: {
  fromEmail: string;
  fromName: string;
  toEmail: string;
  toName: string;
  subject: string;
  body: string;
}): Promise<Message> {
  const record = await base('Messages').create({
    'From Email': data.fromEmail,
    'From Name': data.fromName,
    'To Email': data.toEmail,
    'To Name': data.toName,
    Subject: data.subject,
    Body: data.body,
    'Created At': new Date().toISOString(),
    Read: false,
  });
  const f = record.fields as Record<string, unknown>;
  return {
    id: record.id,
    fromEmail: (f['From Email'] as string) || '',
    fromName: (f['From Name'] as string) || '',
    toEmail: (f['To Email'] as string) || '',
    toName: (f['To Name'] as string) || '',
    subject: (f['Subject'] as string) || '',
    body: (f['Body'] as string) || '',
    createdAt: (f['Created At'] as string) || '',
    read: false,
  };
}

export async function markMessageRead(messageId: string): Promise<void> {
  await base('Messages').update(messageId, { Read: true });
}

// ─── Events Table ─────────────────────────────────────────────────────────────
export async function getAllEvents(): Promise<AlumniEvent[]> {
  const records = await base('Events')
    .select({ sort: [{ field: 'Event Date', direction: 'asc' }] })
    .all();

  return records.map((r) => {
    const f = r.fields as Record<string, unknown>;
    return {
      id: r.id,
      title: (f['Title'] as string) || '',
      description: (f['Description'] as string) || '',
      eventDate: (f['Event Date'] as string) || '',
      location: (f['Location'] as string) || '',
      createdBy: (f['Created By'] as string) || '',
      rsvpList: ((f['RSVP List'] as string) || '').split(',').filter(Boolean),
    };
  });
}

export async function createEvent(data: {
  title: string;
  description: string;
  eventDate: string;
  location: string;
  createdBy: string;
}): Promise<AlumniEvent> {
  const record = await base('Events').create({
    Title: data.title,
    Description: data.description,
    'Event Date': data.eventDate,
    Location: data.location,
    'Created By': data.createdBy,
    'RSVP List': '',
  });
  const f = record.fields as Record<string, unknown>;
  return {
    id: record.id,
    title: (f['Title'] as string) || '',
    description: (f['Description'] as string) || '',
    eventDate: (f['Event Date'] as string) || '',
    location: (f['Location'] as string) || '',
    createdBy: (f['Created By'] as string) || '',
    rsvpList: [],
  };
}

export async function rsvpEvent(eventId: string, email: string, currentList: string[]): Promise<void> {
  const updated = [...new Set([...currentList, email])].join(',');
  await base('Events').update(eventId, { 'RSVP List': updated });
}

export async function deleteEvent(eventId: string): Promise<void> {
  await base('Events').destroy(eventId);
}
