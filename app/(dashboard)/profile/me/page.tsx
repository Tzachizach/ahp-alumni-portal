'use client';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { Alumni } from '@/lib/types';
import toast from 'react-hot-toast';
import { Save, User } from 'lucide-react';

type EditableFields = {
  'Phone Number': string;
  'Location': string;
  'LinkedIn': string;
  'Current Job Title': string;
  'Current Employer': string;
  'Previous Job Title (s)': string;
  'Previous Employer (s)': string;
  'Professional achievements and accomplishments': string;
  'Professional areas of expertise': string;
  'Networking Preferences': string;
  'Favorite Professor Young Memory': string;
  'Favorite Accounting Honors Memory': string;
  'Personal Achievements Beyond Work': string;
  'Summarized Interest Group': string;
  'Areas of Interest for Engagement': string;
  'Advice for Current Students': string;
};

type FieldKey = keyof EditableFields;

export default function MyProfilePage() {
  const { data: session } = useSession();
  const alumniId = (session?.user as { alumniRecordId?: string })?.alumniRecordId;

  const [alumni, setAlumni] = useState<Alumni | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<EditableFields>>({});

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
          'Professional achievements and accomplishments': data.professionalAchievements,
          'Professional areas of expertise': data.professionalAreasOfExpertise,
          'Networking Preferences': data.networkingPreferences,
          'Favorite Professor Young Memory': data.favoriteMemory,
          'Favorite Accounting Honors Memory': data.favoriteAHPMemory,
          'Personal Achievements Beyond Work': data.personalAchievements,
          'Summarized Interest Group': data.summarizedInterestGroup,
          'Areas of Interest for Engagement': data.areasOfInterestForEngagement,
          'Advice for Current Students': data.adviceForCurrentStudents,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [alumniId]);

  function set(field: FieldKey, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!alumniId) return;
    setSaving(true);
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
        toast.error(`Save failed: ${errMsg}`, { duration: 6000 });
        return;
      }
      toast.success('Profile saved!');
    } catch (err) {
      console.error('[Profile save] network error:', err);
      toast.error('Network error — could not save.');
    } finally {
      setSaving(false);
    }
  }

  // Inline field renderers — defined outside JSX-tree rerenders by being plain helpers
  // that don't introduce new component identities on each render.
  const renderInput = (label: string, field: FieldKey, type = 'text') => (
    <div>
      <label className="label">{label}</label>
      <input
        type={type}
        className="input"
        value={form[field] || ''}
        onChange={(e) => set(field, e.target.value)}
      />
    </div>
  );

  const renderTextarea = (label: string, field: FieldKey, rows = 3) => (
    <div>
      <label className="label">{label}</label>
      <textarea
        className="input resize-none"
        rows={rows}
        value={form[field] || ''}
        onChange={(e) => set(field, e.target.value)}
      />
    </div>
  );

  if (loading) return (
    <div className="animate-pulse space-y-6">
      <div className="h-32 bg-ohio-gray-medium rounded-xl" />
      <div className="h-64 bg-ohio-gray-medium rounded-xl" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ohio-gray-dark">Edit My Profile</h1>
      </div>

      {/* Read-only header */}
      <div className="card mb-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-ohio-gray-medium flex-shrink-0 flex items-center justify-center border-4 border-scarlet">
          {alumni?.profilePhoto ? (
            <Image src={alumni.profilePhoto} alt={alumni.fullName} width={80} height={80} className="object-cover object-top w-full h-full" />
          ) : (
            <User size={32} className="text-ohio-gray" />
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold text-ohio-gray-dark">{alumni?.fullName}</h2>
          <p className="text-ohio-gray text-sm">{alumni?.email}</p>
          <div className="flex gap-2 mt-1 flex-wrap">
            {alumni?.graduationYear && <span className="badge bg-scarlet text-white">Class of {alumni.graduationYear}</span>}
            {alumni?.degreeEarned && <span className="badge bg-ohio-gray-light text-ohio-gray">{alumni.degreeEarned}</span>}
          </div>
          <p className="text-xs text-ohio-gray mt-2">Name, graduation year, and degree are managed by your administrator.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Contact */}
        <div className="card">
          <h2 className="font-bold text-ohio-gray-dark mb-4">Contact Information</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderInput('Phone Number', 'Phone Number', 'tel')}
            {renderInput('Location (City, State)', 'Location')}
            {renderInput('LinkedIn URL', 'LinkedIn', 'url')}
          </div>
        </div>

        {/* Career */}
        <div className="card">
          <h2 className="font-bold text-ohio-gray-dark mb-4">Career</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {renderInput('Current Job Title', 'Current Job Title')}
            {renderInput('Current Employer', 'Current Employer')}
            {renderInput('Previous Job Title', 'Previous Job Title (s)')}
            {renderInput('Previous Employer', 'Previous Employer (s)')}
          </div>
          <div className="mt-4 space-y-4">
            {alumni?.summaryOfCareerProgression && (
              <div>
                <label className="label">Career Summary (auto-generated)</label>
                <div className="input bg-ohio-gray-light/50 text-ohio-gray whitespace-pre-wrap">
                  {alumni.summaryOfCareerProgression}
                </div>
                <p className="text-xs text-ohio-gray mt-1">This summary is generated automatically from your career information.</p>
              </div>
            )}
            {renderTextarea('Professional Achievements', 'Professional achievements and accomplishments', 3)}
            {renderTextarea('Areas of Expertise', 'Professional areas of expertise', 2)}
          </div>
        </div>

        {/* Networking */}
        <div className="card">
          <h2 className="font-bold text-ohio-gray-dark mb-4">Networking</h2>
          <div className="space-y-4">
            {renderTextarea("Networking Preferences (what you're open to)", 'Networking Preferences', 2)}
            {renderTextarea('Areas of Interest for Engagement', 'Areas of Interest for Engagement', 2)}
            {renderInput('Interest Group Tags (comma-separated)', 'Summarized Interest Group')}
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
