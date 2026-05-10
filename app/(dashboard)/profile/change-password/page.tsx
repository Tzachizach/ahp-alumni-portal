'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type FieldErrors = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  form?: string;
};

export default function ChangePasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  function toggle(field: 'current' | 'new' | 'confirm') {
    setShow((s) => ({ ...s, [field]: !s[field] }));
  }

  // Clear a field-specific error as the user types (no stale error
  // messages stuck under fields the user is fixing).
  function setField(key: 'currentPassword' | 'newPassword' | 'confirmPassword', value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key] || errors.form) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        delete next.form;
        return next;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validate up front and surface inline errors per field
    // (WCAG 3.3.1 Error identification, 3.3.3 Error suggestion).
    const next: FieldErrors = {};
    if (form.newPassword.length < 8) {
      next.newPassword = 'New password must be at least 8 characters.';
    }
    if (form.newPassword !== form.confirmPassword) {
      next.confirmPassword = 'Passwords do not match.';
    }
    if (form.currentPassword && form.currentPassword === form.newPassword) {
      next.newPassword = 'New password must be different from current password.';
    }
    if (Object.keys(next).length > 0) {
      setErrors(next);
      // Toast still announces, but the error is also tied to the offending field.
      toast.error('Please fix the highlighted fields.');
      return;
    }

    setErrors({});
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
        const msg = data.error || 'Failed to change password.';
        // Server-side errors usually relate to the current password.
        if (/current/i.test(msg)) {
          setErrors({ currentPassword: msg });
        } else {
          setErrors({ form: msg });
        }
        toast.error(msg);
      } else {
        toast.success('Password changed successfully!');
        router.push('/profile/me');
      }
    } catch {
      const msg = 'Something went wrong. Please try again.';
      setErrors({ form: msg });
      toast.error(msg);
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

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Form-level error */}
          {errors.form && (
            <div role="alert" className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
              {errors.form}
            </div>
          )}

          {/* Current Password */}
          <div>
            <label htmlFor="current-password" className="block text-sm font-medium text-ohio-gray-dark mb-1">
              Current Password
            </label>
            <div className="relative">
              <input
                id="current-password"
                type={show.current ? 'text' : 'password'}
                value={form.currentPassword}
                onChange={(e) => setField('currentPassword', e.target.value)}
                required
                autoComplete="current-password"
                aria-invalid={!!errors.currentPassword}
                aria-describedby={errors.currentPassword ? 'current-password-error' : undefined}
                className={`w-full border rounded-lg px-3 py-2 pr-10 text-sm placeholder:text-ohio-gray focus:outline-none focus:ring-2 focus:ring-scarlet focus:border-transparent ${errors.currentPassword ? 'border-red-500' : 'border-ohio-gray-medium'}`}
                placeholder="Enter your current password"
              />
              <button
                type="button"
                onClick={() => toggle('current')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ohio-gray hover:text-ohio-gray-dark"
                aria-label={show.current ? 'Hide current password' : 'Show current password'}
                aria-pressed={show.current}
              >
                {show.current ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p id="current-password-error" role="alert" className="mt-1 text-xs text-red-700">
                {errors.currentPassword}
              </p>
            )}
          </div>

          {/* New Password */}
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-ohio-gray-dark mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                id="new-password"
                type={show.new ? 'text' : 'password'}
                value={form.newPassword}
                onChange={(e) => setField('newPassword', e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                aria-invalid={!!errors.newPassword}
                aria-describedby={errors.newPassword ? 'new-password-error' : 'new-password-hint'}
                className={`w-full border rounded-lg px-3 py-2 pr-10 text-sm placeholder:text-ohio-gray focus:outline-none focus:ring-2 focus:ring-scarlet focus:border-transparent ${errors.newPassword ? 'border-red-500' : 'border-ohio-gray-medium'}`}
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                onClick={() => toggle('new')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ohio-gray hover:text-ohio-gray-dark"
                aria-label={show.new ? 'Hide new password' : 'Show new password'}
                aria-pressed={show.new}
              >
                {show.new ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              </button>
            </div>
            {errors.newPassword ? (
              <p id="new-password-error" role="alert" className="mt-1 text-xs text-red-700">
                {errors.newPassword}
              </p>
            ) : (
              <p id="new-password-hint" className="mt-1 text-xs text-ohio-gray">
                Minimum 8 characters.
              </p>
            )}
          </div>

          {/* Confirm New Password */}
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-ohio-gray-dark mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <input
                id="confirm-password"
                type={show.confirm ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(e) => setField('confirmPassword', e.target.value)}
                required
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
                className={`w-full border rounded-lg px-3 py-2 pr-10 text-sm placeholder:text-ohio-gray focus:outline-none focus:ring-2 focus:ring-scarlet focus:border-transparent ${errors.confirmPassword ? 'border-red-500' : 'border-ohio-gray-medium'}`}
                placeholder="Re-enter your new password"
              />
              <button
                type="button"
                onClick={() => toggle('confirm')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ohio-gray hover:text-ohio-gray-dark"
                aria-label={show.confirm ? 'Hide confirmation password' : 'Show confirmation password'}
                aria-pressed={show.confirm}
              >
                {show.confirm ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p id="confirm-password-error" role="alert" className="mt-1 text-xs text-red-700">
                {errors.confirmPassword}
              </p>
            )}
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
