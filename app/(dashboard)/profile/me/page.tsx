'use client';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { Alumni } from '@/lib/types';
import toast from 'react-hot-toast';
import { Save, User, Camera, Loader2 } from 'lucide-react';
import ProfileCompletenessBar from '@/components/ProfileCompletenessBar';

const INTERESTS_FIELD = 'In the website, we can create community spaces for alums with similar interests to communicate. What are professional and personal interests you have?';

type EditableFields = {
  'Phone Number': string;
  'Location': string;
  'LinkedIn': string;
  'Current Job Title': string;
  'Current Employer': string;
  'Previous Job Title (s)': string;
  'Previous Employer (s)': string;
  'Favorite Professor Young Memory': string;
  'Favorite Accounting Honors Memory': string;
  'Personal Achievements Beyond Work': string;
  'Advice for Current Students': string;
  [INTERESTS_FIELD]: string;
};

type FieldKey = keyof EditableFields;

export default function MyProfilePage() {
  const { data: session, status } = useSession();
  const alumniId = (session?.user as { alumniRecordId?: string })?.alumniRecordId;

  const [alumni, setAlumni] = useState<Alumni | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [form, setForm] = useState<Partial<EditableFields>>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!alumniId) return;
    fetch(`/api/alumni/${alumniId}`)
      .then((r) => r.json())
      .then((data: Alumni) => {
        setAlumni(data);
        setForm({
          'Phone Number': data.phone,
          'Location': data.location,
          'LinkedIn': data.linkedIn,
          'Current Job Title': data.currentJobTitle,
          'Current Employer': data.currentEmployer,
          'Previous Job Title (s)': data.previousJobTitle,
          'Previous Employer (s)': data.previousEmployer,
          'Favorite Professor Young Memory': data.favoriteMemory,
          'Favorite Accounting Honors Memory': data.favoriteAHPMemory,
          'Personal Achievements Beyond Work': data.personalAchievements,
          'Advice for Current Students': data.adviceForCurrentStudents,
          [INTERESTS_FIELD]: data.personalProfessionalInterests,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [alumniId]);

  function set(field: FieldKey, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Reset the input so selecting the same file again re-triggers change
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file || !alumniId) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5 MB.');
      return;
    }

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);
      const res = await fetch(`/api/alumni/${alumniId}/photo`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || `HTTP ${res.status}`;
        console.error('[Photo upload] server error:', data);
        toast.error(`Upload failed: ${msg}`, { duration: 8000 });
        return;
      }
      setAlumni(data as Alumni);
      toast.success('Profile photo updated!');
    } catch (err) {
      console.error('[Photo upload] network error:', err);
      toast.error('Network error — could not upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!alumniId) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/alumni/${alumniId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errMsg = data?.error || `HTTP ${res.status}`;
        console.error('[Profile save] server error:', data);
        setSaveError(errMsg);
        toast.error(`Save failed: ${errMsg}`, { duration: 8000 });
        return;
      }
      toast.success('Profile saved!');
    } catch (err) {
      console.error('[Profile save] network error:', err);
      const msg = 'Network error — could not save.';
      setSaveError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  // Convert a field key into a stable DOM-safe id for label/input association.
  const idFor = (field: string) =>
    'profile-' + field.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const renderInput = (
    label: string,
    field: FieldKey,
    type = 'text',
    autoComplete?: string,
  ) => {
    const id = idFor(field);
    return (
      <div>
        <label htmlFor={id} className="label">{label}</label>
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          className="input"
          value={form[field] || ''}
          onChange={(e) => set(field, e.target.value)}
        />
      </div>
    );
  };

  const renderTextarea = (label: string, field: FieldKey, rows = 3) => {
    const id = idFor(field);
    return (
      <div>
        <label htmlFor={id} className="label">{label}</label>
        <textarea
          id={id}
          className="input resize-none"
          rows={rows}
          value={form[field] || ''}
          onChange={(e) => set(field, e.target.value)}
        />
      </div>
    );
  };

  const renderReadOnly = (label: string, value: string | undefined, hint?: string) => {
    const id = `readonly-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    return (
      <div>
        <span id={id} className="label">{label}</span>
        <div
          aria-labelledby={id}
          className="input bg-ohio-gray-light text-ohio-gray whitespace-pre-wrap min-h-[2.5rem]"
        >
          {value || <span className="italic text-ohio-gray">—</span>}
        </div>
        {hint && <p className="text-xs text-ohio-gray mt-1">{hint}</p>}
      </div>
    );
  };

  // Staff/admin accounts that aren't directory members have no personal
  // profile to edit. (The nav hides this link for them; this covers a direct
  // visit so the page doesn't spin forever.)
  if (status !== 'loading' && !alumniId) {
    return (
      <div className="max-w-2xl mx-auto py-6">
        <div className="card text-center">
          <h1 className="text-xl font-bold text-ohio-gray-dark mb-2">No directory profile</h1>
          <p className="text-ohio-gray">
            Your account has admin access but isn&apos;t listed in the alumni directory,
            so there&apos;s no personal profile to edit. Use the Admin Panel to manage the network.
          </p>
        </div>
      </div>
    );
  }

  if (loading) return (
    <div className="animate-pulse space-y-6">
      <div className="h-32 bg-ohio-gray-medium rounded-xl" />
      <div className="h-64 bg-ohio-gray-medium rounded-xl" />
    </div>
  );

  // Faculty and students aren't expected to use the alumni edit form. They
  // get a read-only view of their info and a note pointing them to the
  // appropriate program contact for changes. Proper role-specific edit
  // forms can come in a later iteration.
  if (alumni && alumni.type !== 'Alumni') {
    return (
      <div className="max-w-2xl mx-auto py-6">
        <h1 className="text-2xl font-bold text-ohio-gray-dark mb-1">My Profile</h1>
        <p className="text-sm text-ohio-gray mb-6">
          Signed in as {alumni.fullName} ({alumni.type})
        </p>

        <div className="card bg-scarlet-light/30 border-scarlet-light mb-6">
          <h2 className="font-semibold text-ohio-gray-dark mb-2">
            Your {alumni.type.toLowerCase()} profile is managed by the program
          </h2>
          <p className="text-sm text-ohio-gray-dark mb-3">
            {alumni.type === 'Faculty'
              ? 'Faculty profiles are maintained through the program office. To update your department, title, office location, or research areas, please contact the program director.'
              : 'Student profiles are maintained through the program. To update your major, expected graduation year, or year in program, please contact your program advisor. You can change whether your email is visible to alumni by contacting the program too.'}
          </p>
          <p className="text-sm">
            <a
              href="mailto:tzachi.zach@gmail.com"
              className="text-scarlet font-medium hover:underline"
            >
              Email the program director →
            </a>
          </p>
        </div>

        <div className="card">
          <h2 className="font-semibold text-ohio-gray-dark mb-3">Your information on file</h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs uppercase tracking-wide text-ohio-gray font-semibold">Email</p>
              <p className="text-ohio-gray-dark">{alumni.email || '—'}</p>
            </div>
            {alumni.adjustedPhoneNumber || alumni.phone ? (
              <div>
                <p className="text-xs uppercase tracking-wide text-ohio-gray font-semibold">Phone</p>
                <p className="text-ohio-gray-dark">{alumni.adjustedPhoneNumber || alumni.phone}</p>
              </div>
            ) : null}
            {alumni.location && (
              <div>
                <p className="text-xs uppercase tracking-wide text-ohio-gray font-semibold">Location</p>
                <p className="text-ohio-gray-dark">{alumni.location}</p>
              </div>
            )}
            {alumni.type === 'Faculty' && (
              <>
                {alumni.department && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-ohio-gray font-semibold">Department</p>
                    <p className="text-ohio-gray-dark">{alumni.department}</p>
                  </div>
                )}
                {alumni.facultyTitle && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-ohio-gray font-semibold">Title</p>
                    <p className="text-ohio-gray-dark">{alumni.facultyTitle}</p>
                  </div>
                )}
                {alumni.officeLocation && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-ohio-gray font-semibold">Office</p>
                    <p className="text-ohio-gray-dark">{alumni.officeLocation}</p>
                  </div>
                )}
              </>
            )}
            {alumni.type === 'Student' && (
              <>
                {alumni.major && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-ohio-gray font-semibold">Major</p>
                    <p className="text-ohio-gray-dark">{alumni.major}</p>
                  </div>
                )}
                {alumni.yearInProgram && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-ohio-gray font-semibold">Year in Program</p>
                    <p className="text-ohio-gray-dark">{alumni.yearInProgram}</p>
                  </div>
                )}
                {alumni.expectedGraduationYear && (
                  <div>
                    <p className="text-xs uppercase tracking-wide text-ohio-gray font-semibold">Expected Graduation</p>
                    <p className="text-ohio-gray-dark">{alumni.expectedGraduationYear}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs uppercase tracking-wide text-ohio-gray font-semibold">
                    Email visible to alumni
                  </p>
                  <p className="text-ohio-gray-dark">{alumni.showEmailToAlumni ? 'Yes' : 'No'}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ohio-gray-dark">Edit My Profile</h1>
      </div>

      {/* Completeness bar — shown only on the user's own profile */}
      {alumni && <ProfileCompletenessBar alumni={alumni} />}

      {/* Read-only header */}
      <div className="card mb-6 flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="group w-20 h-20 rounded-full overflow-hidden bg-ohio-gray-medium flex items-center justify-center border-4 border-scarlet relative disabled:cursor-wait"
            title="Click to change profile photo"
            aria-label="Change profile photo"
          >
            {alumni?.profilePhoto ? (
              <Image
                src={alumni.profilePhoto}
                alt={alumni.fullName}
                width={80}
                height={80}
                className="object-cover object-top w-full h-full"
              />
            ) : (
              <User size={32} className="text-ohio-gray" />
            )}
            {/* Hover/focus overlay — also triggers on keyboard focus (WCAG 1.4.13) */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity flex items-center justify-center">
              {uploadingPhoto ? (
                <Loader2 size={20} className="text-white animate-spin" aria-hidden="true" />
              ) : (
                <Camera size={20} className="text-white" aria-hidden="true" />
              )}
            </div>
            {/* Uploading spinner (always visible while uploading) */}
            {uploadingPhoto && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 size={20} className="text-white animate-spin" aria-hidden="true" />
              </div>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>
        <div>
          <h2 className="text-xl font-bold text-ohio-gray-dark">{alumni?.fullName}</h2>
          <p className="text-ohio-gray text-sm">{alumni?.email}</p>
          <div className="flex gap-2 mt-1 flex-wrap">
            {alumni?.graduationYear && <span className="badge bg-scarlet text-white">Class of {alumni.graduationYear}</span>}
            {alumni?.degreeEarned && <span className="badge bg-ohio-gray-light text-ohio-gray">{alumni.degreeEarned}</span>}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
            className="text-xs text-scarlet hover:underline mt-2 flex items-center gap-1 disabled:opacity-50"
          >
            <Camera size={12} />
            {uploadingPhoto ? 'Uploading…' : (alumni?.profilePhoto ? 'Change photo' : 'Upload photo')}
          </button>
          <p className="text-xs text-ohio-gray mt-1">Name, graduation year, and degree are managed by your administrator.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6" noValidate>
        {/* Server-side save error (announced via role=alert; toast still fires) */}
        {saveError && (
          <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
            <strong className="font-semibold">Couldn&apos;t save your profile.</strong>{' '}
            {saveError}
          </div>
        )}

        {/* Contact */}
        <div className="card">
          <h2 className="font-bold text-ohio-gray-dark mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderInput('Phone Number', 'Phone Number', 'tel', 'tel')}
            {renderInput('Location (City, State)', 'Location', 'text', 'address-level2')}
            <div className="sm:col-span-2">
              {renderInput('LinkedIn URL', 'LinkedIn', 'url', 'url')}
            </div>
            {alumni?.adjustedPhoneNumber &&
              renderReadOnly(
                'Phone Number (auto-formatted)',
                alumni.adjustedPhoneNumber,
                'This is how your phone number is displayed to other alumni — auto-formatted from what you typed above.'
              )}
            {alumni?.standardizedMetropolitanArea &&
              renderReadOnly(
                'Metropolitan Area (auto-detected)',
                alumni.standardizedMetropolitanArea,
                'Computed automatically from your Location above.'
              )}
          </div>
        </div>

        {/* Career */}
        <div className="card">
          <h2 className="font-bold text-ohio-gray-dark mb-4">Career</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderInput('Current Job Title', 'Current Job Title', 'text', 'organization-title')}
            {renderInput('Current Employer', 'Current Employer', 'text', 'organization')}
            {renderInput('Previous Job Title', 'Previous Job Title (s)')}
            {renderInput('Previous Employer', 'Previous Employer (s)')}
          </div>
          {alumni?.summaryOfCareerProgression && (
            <div className="mt-4">
              {renderReadOnly(
                'Career Summary (auto-generated)',
                alumni.summaryOfCareerProgression,
                'This summary is generated automatically from your career information.'
              )}
            </div>
          )}
        </div>

        {/* Interests & Engagement */}
        <div className="card">
          <h2 className="font-bold text-ohio-gray-dark mb-4">Interests & Engagement</h2>
          <div className="space-y-4">
            {renderTextarea(
              'Professional & Personal Interests',
              INTERESTS_FIELD,
              4
            )}
            {alumni?.areasOfInterestForEngagement &&
              renderReadOnly(
                'Areas of Interest for Engagement',
                alumni.areasOfInterestForEngagement,
                'This field uses predefined options — please contact your administrator to update it.'
              )}
          </div>
        </div>

        {/* Personal */}
        <div className="card">
          <h2 className="font-bold text-ohio-gray-dark mb-4">Personal</h2>
          <div className="space-y-4">
            {renderTextarea('Favorite Professor / Young Memory', 'Favorite Professor Young Memory', 2)}
            {renderTextarea('Favorite AHP Memory', 'Favorite Accounting Honors Memory', 2)}
            {renderTextarea('Personal Achievements Beyond Work', 'Personal Achievements Beyond Work', 2)}
            {renderTextarea('Advice for Current Students', 'Advice for Current Students', 3)}
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end pb-4">
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 px-6 py-2.5">
            <Save size={16} />
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
