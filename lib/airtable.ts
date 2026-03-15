import Airtable from 'airtable';
import { Alumni, Message, AlumniEvent } from './types';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID!
);

// ─── Safely convert any Airtable field value to a string ─────────────────────
function str(value: unknown): string {
  if (!value) return '';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

// ─── Helper: map raw Airtable record → Alumni ────────────────────────────────
function mapAlumni(record: Airtable.Record<Airtable.FieldSet>): Alumni {
  const f = record.fields as Record<string, unknown>;

  const photoArr = f['Profile Photo'] as { url: string }[] | undefined;
  const photo = photoArr && photoArr.length > 0 ? photoArr[0].url : null;

  return {
    id: record.id,
    fullName: str(f['Full Name']),
    profilePhoto: photo,
    email: str(f['Email Address']),
    phone: str(f['Phone Number']),
    graduationYear: f['Graduation Year'] ? String(f['Graduation Year']) : '',
    degreeEarned: str(f['Degree Earned']),
    currentJobTitle: str(f['Current Job Title']),
    currentEmployer: str(f['Current Employer']),
    previousJobTitle: str(f['Previous Job Title (s)']),
    previousEmployer: str(f['Previous Employer (s)']),
    location: (typeof f['Standardized Location'] === 'string' && f['Standardized Location'].trim())
      ? f['Standardized Location'].trim()
      : str(f['Location']),
    linkedIn: str(f['LinkedIn']),
    careerMilestones: str(f['Career Milestones']),
    summaryOfCareerProgression: str(f['Summary of Career Progression (AI)']),
    professionalAchievements: str(f['Professional achievements and accomplishments']),
    professionalAreasOfExpertise: str(f['Professional areas of expertise']),
    networkingPreferences: str(f['Networking Preferences']),
    networkingCategory: str(f['Networking Category (AI)']),
    favoriteMemory: str(f['Favorite Professor Young Memory']),
    favoriteAHPMemory: str(f['Favorite Accounting Honors Memory']),
    personalAchievements: str(f['Personal Achievements Beyond Work']),
    summarizedInterestGroup: str(f['Summarized Interest Group']),
    areasOfInterestForEngagement: str(f['Areas of Interest for Engagement']),
    adviceForCurrentStudents: str(f['Advice for Current Students']),
    alumniEvents: Array.isArray(f['Alumni Events']) ? f['Alumni Events'] as string[] : [],
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
    'Previous Job Title (s)': string;
    'Previous Employer (s)': string;
    'Summary of Career Progression (AI)': string;
    'Professional achievements and accomplishments': string;
    'Professional areas of expertise': string;
    'Networking Preferences': string;
    'Favorite Professor Young Memory': string;
    'Favorite Accounting Honors Memory': string;
    'Personal Achievements Beyond Work': string;
    'Summarized Interest Group': string;
    'Areas of Interest for Engagement': string;
    'Advice for Current Students': string;
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
    const records = await base('Auth')
      .select({
        filterByFormula: `LOWER({Email}) = '${email.toLowerCase()}'`,
        maxRecords: 1,
      })
      .all();

    if (records.length === 0) {
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
