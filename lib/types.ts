export type PersonType = 'Alumni' | 'Faculty' | 'Student';

export interface Alumni {
  id: string; // Airtable record ID
  type: PersonType; // Alumni / Faculty / Student — drives conditional rendering
  fullName: string;
  profilePhoto: string | null;
  email: string;
  phone: string;                       // raw, as the user typed it
  adjustedPhoneNumber: string;         // AI-cleaned format; display preference
  graduationYear: string;              // Alumni only — empty for Faculty/Student
  degreeEarned: string;
  currentJobTitle: string;             // Alumni-specific (faculty use facultyTitle/department)
  currentEmployer: string;
  previousJobTitle: string;
  previousEmployer: string;
  location: string;
  standardizedMetropolitanArea: string; // AI-computed MSA from location
  linkedIn: string;

  // Faculty-only fields (empty for non-Faculty)
  department: string;
  facultyTitle: string;
  officeLocation: string;
  researchAreas: string;

  // Student-only fields (empty for non-Student)
  major: string;
  expectedGraduationYear: string;
  yearInProgram: string;
  showEmailToAlumni: boolean;          // student privacy toggle
  // Career
  careerMilestones: string;
  summaryOfCareerProgression: string;
  professionalAchievements: string;
  professionalAreasOfExpertise: string;
  // Networking
  networkingPreferences: string;
  networkingCategory: string;
  personalProfessionalInterests: string;
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
