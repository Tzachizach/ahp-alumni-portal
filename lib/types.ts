export interface Alumni {
  id: string; // Airtable record ID
  fullName: string;
  profilePhoto: string | null;
  email: string;
  phone: string;
  graduationYear: string;
  degreeEarned: string;
  currentJobTitle: string;
  currentEmployer: string;
  previousJobTitle: string;
  previousEmployer: string;
  location: string;
  linkedIn: string;
  // Career
  careerMilestones: string;
  summaryOfCareerProgression: string;
  professionalAchievements: string;
  professionalAreasOfExpertise: string;
  // Networking
  networkingPreferences: string;
  networkingCategory: string;
  // Personal
  favoriteMemory: string;
  favoriteAHPMemory: string;
  personalAchievements: string;
  // Community
  summarizedInterestGroup: string;
  areasOfInterestForEngagement: string;
  adviceForCurrentStudents: string;
  // Social / Events
  alumniEvents: string[];
}

export interface AuthUser {
  id: string; // Airtable Auth record ID
  email: string;
  role: 'alumni' | 'admin';
  alumniRecordId: string;
  name: string;
}

export interface Message {
  id: string;
  fromEmail: string;
  fromName: string;
  toEmail: string;
  toName: string;
  subject: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export interface AlumniEvent {
  id: string;
  title: string;
  description: string;
  eventDate: string;
  location: string;
  createdBy: string;
  rsvpList: string[];
}

export interface InterestGroup {
  name: string;
  members: Alumni[];
}
