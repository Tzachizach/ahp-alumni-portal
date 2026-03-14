'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [saving, setSaving] = useState(false);

  function toggle(field: 'current' | 'new' | 'confirm') {
    setShow((s) => ({ ...s, [field]: !s[field] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (form.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (form.currentPassword === form.newPassword) {
      toast.error('New password must be different from current password');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Failed to change password');
      } else {
        toast.success('Password changed successfully!');
        router.push('/profile/me');
      }
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="mb-6">
        <Link
          href="/profile/me"
          className="inline-flex items-center gap-2 text-sm text-ohio-gray hover:text-scarlet transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Profile
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-ohio-gray-medium shadow-sm p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-scarlet/10 rounded-lg flex items-center justify-center">
            <Lock size={20} className="text-scarlet" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-ohio-gray-dark">Change Password</h1>
            <p className="text-sm text-ohio-gray">Update your login password</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-ohio-gray-dark mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                type={show.current ? 'text' : 'password'}
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                required
                className="w-full border border-ohio-gray-medium rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-scarlet focus:border-transparent"
                placeholder="Enter your current password"
              />
              <button
                type="button"
                onClick={() => toggle('current')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ohio-gray hover:text-ohio-gray-dark"
              >
                {show.current ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-ohio-gray-dark mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={show.new ? 'text' : 'password'}
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                required
                minLength={8}
                className="w-full border border-ohio-gray-medium rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-scarlet focus:border-transparent"
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                onClick={() => toggle('new')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ohio-gray hover:text-ohio-gray-dark"
              >
                {show.new ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-sm font-medium text-ohio-gray-dark mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                type={show.confirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
                className="w-full border border-ohio-gray-medium rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-scarlet focus:border-transparent"
                placeholder="Re-enter your new password"
              />
              <button
                type="button"
                onClick={() => toggle('confirm')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ohio-gray hover:text-ohio-gray-dark"
              >
                {show.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Password strength hint */}
          {form.newPassword && (
            <p className={`text-xs ${form.newPassword.length >= 8 ? 'text-green-600' : 'text-ohio-gray'}`}>
              {form.newPassword.length >= 8 ? '✓ Password meets minimum length' : `${8 - form.newPassword.length} more characters needed`}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-scarlet text-white py-2.5 rounded-lg text-sm font-medium hover:bg-scarlet/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {saving ? 'Saving…' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
