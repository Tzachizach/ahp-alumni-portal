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
  'Previous Job Title': string;
  'Previous employer': string;
  'Summary of Career Progression': string;
  'Professional achievements and accomplishments': string;
  'Professional areas of expertise': string;
  'Networking Preferences': string;
  'Favorite Professor Young Memory': string;
  'Favorite accounting honors memory': string;
  'Personal achievements beyond work': string;
  'Summarized Interest Group': string;
  'Areas of interest for engagement': string;
  'Advice for current students': string;
};

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
          'Previous Job Title': data.previousJobTitle,
          'Previous employer': data.previousEmployer,
          'Summary of Career Progression': data.summaryOfCareerProgression,
          'Professional achievements and accomplishments': data.professionalAchievements,
          'Professional areas of expertise': data.professionalAreasOfExpertise,
          'Networking Preferences': data.networkingPreferences,
          'Favorite Professor Young Memory': data.favoriteMemory,
          'Favorite accounting honors memory': data.favoriteAHPMemory,
          'Personal achievements beyond work': data.personalAchievements,
          'Summarized Interest Group': data.summarizedInterestGroup,
          'Areas of interest for engagement': data.areasOfInterestForEngagement,
          'Advice for current students': data.adviceForCurrentStudents,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [alumniId]);

  function set(field: keyof EditableFields, value: string) {
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
      if (!res.ok) throw new Error();
      toast.success('Profile saved!');
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function Input({ label, field, type = 'text' }: { label: string; field: keyof EditableFields; type?: string }) {
    return (
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
  }

  function Textarea({ label, field, rows = 3 }: { label: string; field: keyof EditableFields; rows?: number }) {
    return (
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
  }

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
            <Image src={alumni.profilePhoto} alt={alumni.fullName} width={80} height={80} className="object-cover w-full h-full" />
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
            <Input label="Phone Number" field="Phone Number" type="tel" />
            <Input label="Location (City, State)" field="Location" />
            <Input label="LinkedIn URL" field="LinkedIn" type="url" />
          </div>
        </div>

        {/* Career */}
        <div className="card">
          <h2 className="font-bold text-ohio-gray-dark mb-4">Career</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Current Job Title" field="Current Job Title" />
            <Input label="Current Employer" field="Current Employer" />
            <Input label="Previous Job Title" field="Previous Job Title" />
            <Input label="Previous Employer" field="Previous employer" />
          </div>
          <div className="mt-4 space-y-4">
            <Textarea label="Career Summary" field="Summary of Career Progression" rows={4} />
            <Textarea label="Professional Achievements" field="Professional achievements and accomplishments" rows={3} />
            <Textarea label="Areas of Expertise" field="Professional areas of expertise" rows={2} />
          </div>
        </div>

        {/* Networking */}
        <div className="card">
          <h2 className="font-bold text-ohio-gray-dark mb-4">Networking</h2>
          <div className="space-y-4">
            <Textarea label="Networking Preferences (what you're open to)" field="Networking Preferences" rows={2} />
            <Textarea label="Areas of Interest for Engagement" field="Areas of interest for engagement" rows={2} />
            <Input label="Interest Group Tags (comma-separated)" field="Summarized Interest Group" />
          </div>
        </div>

        {/* Personal */}
        <div className="card">
          <h2 className="font-bold text-ohio-gray-dark mb-4">Personal</h2>
          <div className="space-y-4">
            <Textarea label="Favorite Professor / Young Memory" field="Favorite Professor Young Memory" rows={2} />
            <Textarea label="Favorite AHP Memory" field="Favorite accounting honors memory" rows={2} />
            <Textarea label="Personal Achievements Beyond Work" field="Personal achievements beyond work" rows={2} />
            <Textarea label="Advice for Current Students" field="Advice for current students" rows={3} />
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
