'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { Alumni } from '@/lib/types';
import {
  MapPin, Briefcase, GraduationCap, Mail, Phone, Linkedin,
  MessageCircle, ArrowLeft, Star, Award, BookOpen, Heart, Building2,
  Microscope, Users as UsersIcon,
} from 'lucide-react';

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [alumni, setAlumni] = useState<Alumni | null>(null);
  const [loading, setLoading] = useState(true);

  const myAlumniId = (session?.user as { alumniRecordId?: string })?.alumniRecordId;
  const viewerRole = (session?.user as { role?: string })?.role;
  const isOwnProfile = myAlumniId === id;
  const isAdmin = viewerRole === 'admin';

  useEffect(() => {
    fetch(`/api/alumni/${id}`)
      .then((r) => r.json())
      .then((data) => { setAlumni(data); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [id]);

  if (loading) return (
    <div className="animate-pulse space-y-4">
      <div className="h-48 bg-ohio-gray-medium rounded-xl" />
      <div className="h-8 bg-ohio-gray-medium rounded w-1/3" />
    </div>
  );

  if (!alumni) return (
    <div className="text-center py-20 text-ohio-gray">
      <p className="text-lg font-medium">Profile not found</p>
      <button onClick={() => router.back()} className="btn-secondary mt-4">Go Back</button>
    </div>
  );

  // Students can opt out of having their email visible to alumni. Self and
  // admin always see the email; faculty / other students bypass the gate too.
  const canSeeEmail =
    isOwnProfile ||
    isAdmin ||
    alumni.type !== 'Student' ||
    alumni.showEmailToAlumni;

  function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
    return (
      <div className="card">
        <h2 className="flex items-center gap-2 font-bold text-ohio-gray-dark mb-4">
          <Icon size={18} className="text-scarlet" />
          {title}
        </h2>
        {children}
      </div>
    );
  }

  function Field({ label, value }: { label: string; value: string }) {
    if (!value) return null;
    return (
      <div className="mb-3">
        <p className="text-xs font-semibold text-ohio-gray uppercase tracking-wide mb-0.5">{label}</p>
        <p className="text-sm text-ohio-gray-dark">{value}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Back */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-ohio-gray hover:text-scarlet mb-4 transition-colors">
        <ArrowLeft size={16} /> Back to Directory
      </button>

      {/* Hero card */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Photo */}
          <div className="w-28 h-28 rounded-full overflow-hidden bg-ohio-gray-medium flex-shrink-0 flex items-center justify-center border-4 border-scarlet">
            {alumni.profilePhoto ? (
              <Image src={alumni.profilePhoto} alt={alumni.fullName} width={112} height={112} className="object-cover object-top w-full h-full" />
            ) : (
              <span className="text-4xl font-bold text-ohio-gray">{alumni.fullName.charAt(0)}</span>
            )}
          </div>

          {/* Basic info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-ohio-gray-dark">{alumni.fullName}</h1>
                <div className="flex flex-wrap gap-2 items-center mt-1">
                  {/* Type badge — every record has one; alumni still get "Class of YYYY". */}
                  {alumni.type === 'Faculty' && (
                    <span className="badge bg-blue-100 text-blue-800">Faculty</span>
                  )}
                  {alumni.type === 'Student' && (
                    <span className="badge bg-green-100 text-green-800">Student</span>
                  )}
                  {alumni.type === 'Alumni' && alumni.graduationYear && (
                    <Link
                      href={`/directory?year=${alumni.graduationYear}`}
                      className="badge bg-scarlet text-white hover:bg-scarlet/80 transition-colors"
                    >
                      Class of {alumni.graduationYear}
                    </Link>
                  )}
                  {/* Students show expected grad year + year in program inline. */}
                  {alumni.type === 'Student' && alumni.expectedGraduationYear && (
                    <span className="badge bg-ohio-gray-light text-ohio-gray-dark">
                      Expected {alumni.expectedGraduationYear}
                    </span>
                  )}
                  {alumni.type === 'Student' && alumni.yearInProgram && (
                    <span className="badge bg-ohio-gray-light text-ohio-gray-dark">
                      {alumni.yearInProgram}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {isOwnProfile && (
                  <Link href="/profile/me" className="btn-primary text-sm py-1.5 px-3">Edit My Profile</Link>
                )}
                {!isOwnProfile && alumni.email && canSeeEmail && (
                  <Link
                    href={`/messages?to=${alumni.email}&name=${encodeURIComponent(alumni.fullName)}`}
                    className="btn-secondary text-sm py-1.5 px-3 flex items-center gap-1.5"
                  >
                    <MessageCircle size={15} aria-hidden="true" /> Message
                  </Link>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ohio-gray">
              {/* Career / role line — alumni show current role; faculty show
                  title + department; students show major. */}
              {alumni.type === 'Alumni' && (alumni.currentJobTitle || alumni.currentEmployer) && (
                <span className="flex items-center gap-1.5">
                  <Briefcase size={14} className="text-scarlet" aria-hidden="true" />
                  {[alumni.currentJobTitle, alumni.currentEmployer].filter(Boolean).join(' · ')}
                </span>
              )}
              {alumni.type === 'Faculty' && (alumni.facultyTitle || alumni.department) && (
                <span className="flex items-center gap-1.5">
                  <Briefcase size={14} className="text-scarlet" aria-hidden="true" />
                  {[alumni.facultyTitle, alumni.department].filter(Boolean).join(' · ')}
                </span>
              )}
              {alumni.type === 'Student' && alumni.major && (
                <span className="flex items-center gap-1.5">
                  <Briefcase size={14} className="text-scarlet" aria-hidden="true" />
                  {alumni.major}
                </span>
              )}
              {alumni.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} className="text-scarlet" aria-hidden="true" />
                  {alumni.location}
                </span>
              )}
              {alumni.standardizedMetropolitanArea && (
                <span className="flex items-center gap-1.5 text-ohio-gray" title="Metropolitan area">
                  <Building2 size={14} className="text-scarlet" aria-hidden="true" />
                  {alumni.standardizedMetropolitanArea}
                </span>
              )}
              {/* Faculty office location surfaces here. */}
              {alumni.type === 'Faculty' && alumni.officeLocation && (
                <span className="flex items-center gap-1.5">
                  <Building2 size={14} className="text-scarlet" aria-hidden="true" />
                  {alumni.officeLocation}
                </span>
              )}
              {alumni.type === 'Alumni' && alumni.degreeEarned && (
                <span className="flex items-center gap-1.5">
                  <GraduationCap size={14} className="text-scarlet" aria-hidden="true" />
                  {alumni.degreeEarned}
                </span>
              )}
            </div>

            {/* Contact links */}
            <div className="mt-3 flex flex-wrap gap-3">
              {alumni.email && canSeeEmail && (
                <a href={`mailto:${alumni.email}`} className="flex items-center gap-1.5 text-sm text-scarlet hover:underline">
                  <Mail size={14} aria-hidden="true" /> {alumni.email}
                </a>
              )}
              {alumni.email && !canSeeEmail && (
                <span className="flex items-center gap-1.5 text-sm text-ohio-gray italic" title="This student has chosen not to share their email">
                  <Mail size={14} aria-hidden="true" /> Email hidden by student
                </span>
              )}
              {(alumni.adjustedPhoneNumber || alumni.phone) && (
                <a
                  href={`tel:${(alumni.adjustedPhoneNumber || alumni.phone).replace(/[^+\d]/g, '')}`}
                  className="flex items-center gap-1.5 text-sm text-scarlet hover:underline"
                >
                  <Phone size={14} aria-hidden="true" />
                  {alumni.adjustedPhoneNumber || alumni.phone}
                </a>
              )}
              {alumni.linkedIn && (
                <a href={alumni.linkedIn.startsWith('http') ? alumni.linkedIn : `https://${alumni.linkedIn}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-scarlet hover:underline">
                  <Linkedin size={14} /> LinkedIn
                </a>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Content grid — sections shown depend on Type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Faculty Info — only for Type: Faculty */}
        {alumni.type === 'Faculty' && (alumni.department || alumni.facultyTitle || alumni.officeLocation || alumni.researchAreas) && (
          <Section title="Faculty Information" icon={Microscope}>
            <Field label="Department" value={alumni.department} />
            <Field label="Title" value={alumni.facultyTitle} />
            <Field label="Office" value={alumni.officeLocation} />
            <Field label="Research Areas" value={alumni.researchAreas} />
          </Section>
        )}

        {/* Student Info — only for Type: Student */}
        {alumni.type === 'Student' && (alumni.major || alumni.yearInProgram || alumni.expectedGraduationYear) && (
          <Section title="Student Information" icon={UsersIcon}>
            <Field label="Major" value={alumni.major} />
            <Field label="Year in Program" value={alumni.yearInProgram} />
            <Field label="Expected Graduation Year" value={alumni.expectedGraduationYear} />
          </Section>
        )}

        {/* Career — alumni only */}
        {alumni.type === 'Alumni' && (alumni.currentJobTitle || alumni.currentEmployer || alumni.previousJobTitle || alumni.previousEmployer || alumni.summaryOfCareerProgression || alumni.careerMilestones) && (
          <Section title="Career" icon={Briefcase}>
            <Field label="Current Role" value={[alumni.currentJobTitle, alumni.currentEmployer].filter(Boolean).join(' at ')} />
            <Field label="Previous Job Title" value={alumni.previousJobTitle} />
            <Field label="Previous Employer" value={alumni.previousEmployer} />
            <Field label="Career Summary" value={alumni.summaryOfCareerProgression} />
            <Field label="Career Milestones" value={alumni.careerMilestones} />
          </Section>
        )}

        {/* Professional — alumni only */}
        {alumni.type === 'Alumni' && (alumni.professionalAchievements || alumni.professionalAreasOfExpertise) && (
          <Section title="Professional Profile" icon={Award}>
            <Field label="Achievements" value={alumni.professionalAchievements} />
            <Field label="Areas of Expertise" value={alumni.professionalAreasOfExpertise} />
          </Section>
        )}

        {/* Networking — shown for everyone if any field is set */}
        {(alumni.networkingPreferences || alumni.networkingCategory || alumni.areasOfInterestForEngagement) && (
          <Section title="Networking" icon={Star}>
            <Field label="Networking Style" value={alumni.networkingCategory} />
            <Field label="Open To" value={alumni.networkingPreferences} />
            <Field label="Areas of Interest" value={alumni.areasOfInterestForEngagement} />
          </Section>
        )}

        {/* Personal — alumni only (memories of AHP / Prof Young) */}
        {alumni.type === 'Alumni' && (alumni.favoriteMemory || alumni.favoriteAHPMemory || alumni.personalAchievements) && (
          <Section title="Personal" icon={Heart}>
            <Field label="Favorite AHP Memory" value={alumni.favoriteAHPMemory} />
            <Field label="Favorite Professor / Memory" value={alumni.favoriteMemory} />
            <Field label="Personal Achievements" value={alumni.personalAchievements} />
          </Section>
        )}

        {/* Advice — alumni only */}
        {alumni.type === 'Alumni' && alumni.adviceForCurrentStudents && (
          <Section title="Advice for Current Students" icon={BookOpen}>
            <p className="text-sm text-ohio-gray-dark italic">&ldquo;{alumni.adviceForCurrentStudents}&rdquo;</p>
          </Section>
        )}
      </div>
    </div>
  );
}
