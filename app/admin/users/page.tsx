'use client';
import { useEffect, useState } from 'react';
import { Alumni } from '@/lib/types';
import { UserPlus, Trash2, KeyRound, Shield, User } from 'lucide-react';
import toast from 'react-hot-toast';

interface AuthRecord {
  id: string;
  email: string;
  name: string;
  role: 'alumni' | 'admin';
  alumniRecordId: string;
  alumniName: string;
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<AuthRecord[]>([]);
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New user form
  const [form, setForm] = useState({
    alumniRecordId: '',
    email: '',
    password: '',
    role: 'alumni' as 'alumni' | 'admin',
  });

  // Password reset
  const [resetTarget, setResetTarget] = useState<AuthRecord | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then(({ authRecords, alumni: alums }) => {
        setUsers(authRecords || []);
        setAlumni(alums || []);
        setLoading(false);
      });
  }, []);

  // When an alumni is selected, auto-fill their email
  function handleAlumniSelect(recordId: string) {
    const a = alumni.find((al) => al.id === recordId);
    setForm((f) => ({ ...f, alumniRecordId: recordId, email: a?.email || f.email }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email || !form.password) return;
    setSubmitting(true);
    try {
      const selected = alumni.find((a) => a.id === form.alumniRecordId);
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, name: selected?.fullName || form.email }),
      });
      if (!res.ok) throw new Error();
      const record = await res.json();
      setUsers((prev) => [...prev, { ...record, alumniName: selected?.fullName || form.email }]);
      setForm({ alumniRecordId: '', email: '', password: '', role: 'alumni' });
      setShowForm(false);
      toast.success('Account created!');
    } catch {
      toast.error('Failed to create account.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(user: AuthRecord) {
    if (!confirm(`Remove portal access for ${user.alumniName || user.email}?`)) return;
    try {
      await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authId: user.id }),
      });
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      toast.success('Account removed.');
    } catch {
      toast.error('Failed to remove account.');
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetTarget || newPassword.length < 8) return;
    setResetting(true);
    try {
      const res = await fetch('/api/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authId: resetTarget.id, newPassword }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Password reset for ${resetTarget.alumniName}`);
      setResetTarget(null);
      setNewPassword('');
    } catch {
      toast.error('Failed to reset password.');
    } finally {
      setResetting(false);
    }
  }

  // Alumni without accounts
  const existingIds = new Set(users.map((u) => u.alumniRecordId));
  const alumniWithoutAccounts = alumni.filter((a) => !existingIds.has(a.id));

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ohio-gray-dark">User Accounts</h1>
          <p className="text-ohio-gray mt-1">{users.length} accounts · {alumniWithoutAccounts.length} alumni without portal access</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <UserPlus size={16} /> Add Account
        </button>
      </div>

      {/* Create account form */}
      {showForm && (
        <div className="card mb-6">
          <h2 className="font-bold text-ohio-gray-dark mb-4">Create Portal Account</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Link to Alumni Record</label>
                <select
                  className="input"
                  value={form.alumniRecordId}
                  onChange={(e) => handleAlumniSelect(e.target.value)}
                >
                  <option value="">Select alumni…</option>
                  {alumni
                    .filter((a) => !existingIds.has(a.id))
                    .sort((a, b) => a.fullName.localeCompare(b.fullName))
                    .map((a) => (
                      <option key={a.id} value={a.id}>{a.fullName} ({a.email})</option>
                    ))}
                </select>
              </div>
              <div>
                <label className="label">Login Email</label>
                <input type="email" className="input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <label className="label">Temporary Password</label>
                <input type="text" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Min. 8 characters" minLength={8} required />
              </div>
              <div>
                <label className="label">Role</label>
                <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'alumni' | 'admin' })}>
                  <option value="alumni">Alumni</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={submitting} className="btn-primary">{submitting ? 'Creating…' : 'Create Account'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Password reset modal */}
      {resetTarget && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-bold text-ohio-gray-dark mb-1">Reset Password</h2>
            <p className="text-sm text-ohio-gray mb-4">For: {resetTarget.alumniName}</p>
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="label">New Password</label>
                <input type="text" className="input" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 8 characters" minLength={8} required />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={resetting} className="btn-primary">{resetting ? 'Resetting…' : 'Reset Password'}</button>
                <button type="button" onClick={() => { setResetTarget(null); setNewPassword(''); }} className="btn-ghost">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users table */}
      {loading ? (
        <div className="card animate-pulse h-40" />
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-ohio-gray-medium bg-ohio-gray-light">
                <th className="text-left px-4 py-3 font-semibold text-ohio-gray">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-ohio-gray">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-ohio-gray">Role</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-ohio-gray">No accounts yet</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b border-ohio-gray-medium last:border-0 hover:bg-ohio-gray-light transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-scarlet flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {(user.alumniName || user.email).charAt(0)}
                        </div>
                        <span className="font-medium text-ohio-gray-dark">{user.alumniName || user.name || '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ohio-gray">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${user.role === 'admin' ? 'bg-scarlet text-white' : 'bg-ohio-gray-light text-ohio-gray'} flex items-center gap-1 w-fit`}>
                        {user.role === 'admin' ? <Shield size={10} /> : <User size={10} />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => setResetTarget(user)}
                          className="flex items-center gap-1 text-xs text-ohio-gray hover:text-scarlet transition-colors px-2 py-1 rounded hover:bg-ohio-gray-light"
                          title="Reset password"
                        >
                          <KeyRound size={13} /> Reset PW
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="flex items-center gap-1 text-xs text-ohio-gray hover:text-scarlet transition-colors px-2 py-1 rounded hover:bg-red-50"
                          title="Remove account"
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Alumni without accounts */}
      {alumniWithoutAccounts.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-ohio-gray uppercase tracking-wide mb-3">
            Alumni Without Portal Access ({alumniWithoutAccounts.length})
          </h2>
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ohio-gray-medium bg-ohio-gray-light">
                  <th className="text-left px-4 py-3 font-semibold text-ohio-gray">Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-ohio-gray">Email</th>
                  <th className="text-left px-4 py-3 font-semibold text-ohio-gray">Year</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {alumniWithoutAccounts
                  .sort((a, b) => a.fullName.localeCompare(b.fullName))
                  .map((a) => (
                    <tr key={a.id} className="border-b border-ohio-gray-medium last:border-0 hover:bg-ohio-gray-light">
                      <td className="px-4 py-3 font-medium text-ohio-gray-dark">{a.fullName}</td>
                      <td className="px-4 py-3 text-ohio-gray">{a.email}</td>
                      <td className="px-4 py-3 text-ohio-gray">{a.graduationYear}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            handleAlumniSelect(a.id);
                            setShowForm(true);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="text-xs text-scarlet hover:underline flex items-center gap-1"
                        >
                          <UserPlus size={12} /> Grant Access
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
