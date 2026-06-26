'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  Home, ClipboardCheck, MessageCircle, Users, MapPin, Building2,
  TrendingUp, ArrowRight, AlertCircle, CheckCircle2,
} from 'lucide-react';
import { Alumni, Message } from '@/lib/types';
import { parseStateCode, STATE_CODE_TO_NAME } from '@/lib/usStates';
import { computeCompleteness } from '@/lib/profileCompleteness';
import YearBreakdownChart from '@/components/YearBreakdownChart';

/**
 * "Network at a Glance" landing dashboard, visible to every signed-in alum.
 *
 * Combines four views:
 *   1. Personal snapshot (welcome + completeness + inbox + cohort + nearby)
 *   2. Class breakdown chart (shared with /admin)
 *   3. Geographic snapshot (top states + top metros, link to full map)
 *   4. Program impact (top employers + total network size)
 *
 * All computation is client-side over the existing /api/alumni and
 * /api/messages endpoints. No admin-only data leaks here.
 */
export default function DashboardPage() {
  const { data: session } = useSession();
  const myAlumniId = (session?.user as { alumniRecordId?: string })?.alumniRecordId;
  const myEmail = session?.user?.email || '';

  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/alumni').then((r) => r.json()),
      fetch('/api/messages').then((r) => r.json()),
    ])
      .then(([al, ms]) => {
        if (Array.isArray(al)) setAlumni(al);
        if (Array.isArray(ms)) setMessages(ms);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const me = useMemo(
    () => alumni.find((a) => a.id === myAlumniId) || null,
    [alumni, myAlumniId]
  );

  const unreadCount = useMemo(
    () => messages.filter((m) => !m.read && m.toEmail === myEmail).length,
    [messages, myEmail]
  );

  // Slice the network: alumni-only for views that don't make sense for
  // faculty/students (cohort, year chart, top employers).
  const alumniOnly = useMemo(() => alumni.filter((a) => a.type === 'Alumni'), [alumni]);

  // Personal: cohort + nearby
  const cohortCount = useMemo(() => {
    if (!me || me.type !== 'Alumni' || !me.graduationYear) return 0;
    return alumniOnly.filter(
      (a) => a.graduationYear === me.graduationYear && a.id !== me.id
    ).length;
  }, [alumniOnly, me]);

  const myStateCode = useMemo(() => (me ? parseStateCode(me.location) : null), [me]);
  const nearbyCount = useMemo(() => {
    if (!myStateCode) return 0;
    return alumni.filter(
      (a) => a.id !== me?.id && parseStateCode(a.location) === myStateCode
    ).length;
  }, [alumni, me, myStateCode]);

  // Completeness only applies to alumni (the 6 essentials are alumni-shaped).
  const completeness = useMemo(
    () => (me && me.type === 'Alumni' ? computeCompleteness(me) : null),
    [me]
  );

  // Geographic snapshot: top states + top metros
  const { topStates, totalStates, topMetros } = useMemo(() => {
    const byState: Record<string, number> = {};
    const byMetro: Record<string, number> = {};
    for (const a of alumni) {
      const code = parseStateCode(a.location);
      if (code) byState[code] = (byState[code] || 0) + 1;
      const metro = a.standardizedMetropolitanArea?.trim();
      if (metro) byMetro[metro] = (byMetro[metro] || 0) + 1;
    }
    const topStates = Object.entries(byState)
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    const topMetros = Object.entries(byMetro)
      .map(([metro, count]) => ({ metro, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    return { topStates, totalStates: Object.keys(byState).length, topMetros };
  }, [alumni]);

  // Program impact: top employers — alumni only (faculty work at OSU; students
  // don't have employers in the same sense).
  const { topEmployers, distinctEmployers } = useMemo(() => {
    const groups: Record<string, { label: string; count: number; variants: Record<string, number> }> = {};
    for (const a of alumniOnly) {
      const raw = a.currentEmployer?.trim();
      if (!raw) continue;
      const key = raw.toLowerCase();
      if (!groups[key]) groups[key] = { label: raw, count: 0, variants: {} };
      groups[key].count += 1;
      groups[key].variants[raw] = (groups[key].variants[raw] || 0) + 1;
    }
    // Pick the most-used capitalization as the label.
    for (const g of Object.values(groups)) {
      g.label = Object.entries(g.variants).sort((a, b) => b[1] - a[1])[0][0];
    }
    const topEmployers = Object.values(groups)
      .map((g) => ({ label: g.label, count: g.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    return { topEmployers, distinctEmployers: Object.keys(groups).length };
  }, [alumniOnly]);

  const totalNetwork = alumni.length;
  const totalAlumniOnly = alumniOnly.length;
  const maxMetroCount = topMetros[0]?.count || 0;
  const maxStateCount = topStates[0]?.count || 0;
  const maxEmployerCount = topEmployers[0]?.count || 0;

  return (
    <div>
      {/* Welcome header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-scarlet/10 rounded-lg flex items-center justify-center">
            <Home size={20} className="text-scarlet" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-ohio-gray-dark">
            {loading || !me ? 'Welcome' : `Welcome, ${me.fullName.split(' ')[0]}`}
          </h1>
        </div>
        <p className="text-ohio-gray text-sm">
          {loading
            ? 'Loading your snapshot…'
            : `${totalNetwork} people in the AHP network${
                me?.type === 'Alumni' && me.graduationYear
                  ? ` · You're in the Class of ${me.graduationYear}`
                  : me?.type === 'Faculty'
                  ? ` · You're on the faculty`
                  : me?.type === 'Student'
                  ? ` · You're a current student${me.expectedGraduationYear ? ` (expected ${me.expectedGraduationYear})` : ''}`
                  : ''
              }.`}
        </p>
      </div>

      {/* 1. Personal snapshot — cards conditionally render based on role.
          Alumni see all 4 cards. Faculty / students see only Inbox + Near you
          (completeness and cohort are alumni-specific). */}
      {me && (
        <div className="card mb-6">
          <h2 className="font-semibold text-ohio-gray-dark text-sm uppercase tracking-wide mb-4">
            Your snapshot
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Completeness — alumni only */}
            {completeness && (
              <Link
                href="/profile/me"
                className="border border-ohio-gray-medium rounded-lg p-3 hover:border-scarlet hover:bg-scarlet-light/30 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-1">
                  {completeness.isComplete ? (
                    <CheckCircle2 size={14} className="text-green-600" aria-hidden="true" />
                  ) : (
                    <AlertCircle size={14} className="text-scarlet" aria-hidden="true" />
                  )}
                  <p className="text-xs uppercase tracking-wide text-ohio-gray font-semibold">
                    Profile
                  </p>
                </div>
                <p className="text-lg font-bold text-ohio-gray-dark">
                  {completeness.filled} / {completeness.total} essentials
                </p>
                <p className="text-xs text-ohio-gray group-hover:text-scarlet transition-colors mt-1">
                  {completeness.isComplete ? 'Profile complete' : 'Edit profile →'}
                </p>
              </Link>
            )}

            {/* Inbox — everyone */}
            <Link
              href="/messages"
              className="border border-ohio-gray-medium rounded-lg p-3 hover:border-scarlet hover:bg-scarlet-light/30 transition-colors group"
            >
              <div className="flex items-center gap-2 mb-1">
                <MessageCircle size={14} className="text-scarlet" aria-hidden="true" />
                <p className="text-xs uppercase tracking-wide text-ohio-gray font-semibold">
                  Inbox
                </p>
              </div>
              <p className="text-lg font-bold text-ohio-gray-dark">
                {unreadCount} unread
              </p>
              <p className="text-xs text-ohio-gray group-hover:text-scarlet transition-colors mt-1">
                Open inbox →
              </p>
            </Link>

            {/* Your cohort — alumni only */}
            {me.type === 'Alumni' && (
              <Link
                href={me.graduationYear ? `/directory?year=${me.graduationYear}` : '/directory'}
                className="border border-ohio-gray-medium rounded-lg p-3 hover:border-scarlet hover:bg-scarlet-light/30 transition-colors group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Users size={14} className="text-scarlet" aria-hidden="true" />
                  <p className="text-xs uppercase tracking-wide text-ohio-gray font-semibold">
                    Your cohort
                  </p>
                </div>
                <p className="text-lg font-bold text-ohio-gray-dark">
                  {cohortCount} classmate{cohortCount === 1 ? '' : 's'}
                </p>
                <p className="text-xs text-ohio-gray group-hover:text-scarlet transition-colors mt-1">
                  {me.graduationYear ? `Class of ${me.graduationYear} →` : 'Browse directory →'}
                </p>
              </Link>
            )}

            {/* Near you — everyone */}
            <Link
              href={myStateCode ? `/directory?location=${encodeURIComponent(me.location)}` : '/locations'}
              className="border border-ohio-gray-medium rounded-lg p-3 hover:border-scarlet hover:bg-scarlet-light/30 transition-colors group"
            >
              <div className="flex items-center gap-2 mb-1">
                <MapPin size={14} className="text-scarlet" aria-hidden="true" />
                <p className="text-xs uppercase tracking-wide text-ohio-gray font-semibold">
                  Near you
                </p>
              </div>
              <p className="text-lg font-bold text-ohio-gray-dark">
                {myStateCode
                  ? `${nearbyCount} in ${STATE_CODE_TO_NAME[myStateCode]}`
                  : 'Add your location'}
              </p>
              <p className="text-xs text-ohio-gray group-hover:text-scarlet transition-colors mt-1">
                {myStateCode ? 'See nearby people →' : 'Edit profile →'}
              </p>
            </Link>
          </div>
        </div>
      )}

      {/* Two-column: class breakdown + geographic */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 2. Class breakdown — alumni only (faculty/students don't have grad years that count) */}
        <YearBreakdownChart alumni={alumniOnly} loading={loading} />

        {/* 3. Geographic snapshot */}
        <div className="card flex flex-col">
          <h2 className="font-semibold text-ohio-gray-dark mb-1 flex items-center gap-2">
            <MapPin size={16} className="text-scarlet" aria-hidden="true" />
            Where alumni live
          </h2>
          <p className="text-xs text-ohio-gray mb-4">
            {loading
              ? 'Loading…'
              : `${totalNetwork - (totalNetwork - topStates.reduce((s, t) => s + t.count, 0) > 0 ? totalNetwork - topStates.reduce((s, t) => s + t.count, 0) : 0)}+ across ${totalStates} states.`}
          </p>

          <div className="mb-4">
            <p className="text-xs uppercase tracking-wide text-ohio-gray font-semibold mb-2">
              Top states
            </p>
            {topStates.length === 0 && !loading ? (
              <p className="text-sm text-ohio-gray italic">No US locations recorded yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {topStates.map(({ code, count }) => (
                  <li key={code}>
                    <Link
                      href={`/directory?location=${encodeURIComponent(STATE_CODE_TO_NAME[code] || code)}`}
                      className="flex items-center gap-3 text-sm rounded px-1 py-0.5 hover:bg-ohio-gray-light transition-colors"
                    >
                      <span className="w-32 text-ohio-gray-dark font-medium truncate">
                        {STATE_CODE_TO_NAME[code] || code}
                      </span>
                      <div className="flex-1 h-4 bg-ohio-gray-light rounded overflow-hidden">
                        <div
                          className="h-full bg-scarlet"
                          style={{ width: `${maxStateCount > 0 ? (count / maxStateCount) * 100 : 0}%` }}
                          role="progressbar"
                          aria-valuemin={0}
                          aria-valuemax={maxStateCount}
                          aria-valuenow={count}
                          aria-label={`${STATE_CODE_TO_NAME[code] || code}: ${count} alumni`}
                        />
                      </div>
                      <span className="w-10 text-ohio-gray text-xs tabular-nums text-right">
                        {count}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {topMetros.length > 0 && (
            <div className="mb-4">
              <p className="text-xs uppercase tracking-wide text-ohio-gray font-semibold mb-2">
                Top metropolitan areas
              </p>
              <ul className="space-y-1.5">
                {topMetros.map(({ metro, count }) => (
                  <li key={metro}>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="w-32 text-ohio-gray-dark font-medium truncate" title={metro}>
                        {metro}
                      </span>
                      <div className="flex-1 h-4 bg-ohio-gray-light rounded overflow-hidden">
                        <div
                          className="h-full bg-scarlet/70"
                          style={{ width: `${maxMetroCount > 0 ? (count / maxMetroCount) * 100 : 0}%` }}
                          role="progressbar"
                          aria-valuemin={0}
                          aria-valuemax={maxMetroCount}
                          aria-valuenow={count}
                          aria-label={`${metro}: ${count} alumni`}
                        />
                      </div>
                      <span className="w-10 text-ohio-gray text-xs tabular-nums text-right">
                        {count}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-auto pt-2">
            <Link
              href="/locations"
              className="inline-flex items-center gap-1.5 text-sm text-scarlet hover:underline font-medium"
            >
              View full map
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      {/* 4. Program impact: top employers */}
      <div className="card mb-6">
        <h2 className="font-semibold text-ohio-gray-dark mb-1 flex items-center gap-2">
          <Building2 size={16} className="text-scarlet" aria-hidden="true" />
          Top employers
        </h2>
        <p className="text-xs text-ohio-gray mb-4">
          {loading
            ? 'Loading…'
            : `${distinctEmployers} distinct employers across our alumni.`}
        </p>
        {topEmployers.length === 0 && !loading ? (
          <p className="text-sm text-ohio-gray italic">No employer information recorded yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {topEmployers.map(({ label, count }) => (
              <li key={label}>
                <div className="flex items-center gap-3 text-sm">
                  <span className="w-48 sm:w-64 text-ohio-gray-dark font-medium truncate" title={label}>
                    {label}
                  </span>
                  <div className="flex-1 h-4 bg-ohio-gray-light rounded overflow-hidden">
                    <div
                      className="h-full bg-scarlet"
                      style={{ width: `${maxEmployerCount > 0 ? (count / maxEmployerCount) * 100 : 0}%` }}
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={maxEmployerCount}
                      aria-valuenow={count}
                      aria-label={`${label}: ${count} alumni`}
                    />
                  </div>
                  <span className="w-10 text-ohio-gray text-xs tabular-nums text-right">
                    {count}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Footer growth chip */}
      <div className="text-center text-xs text-ohio-gray flex items-center justify-center gap-1.5">
        <TrendingUp size={12} className="text-scarlet" aria-hidden="true" />
        The network includes {totalAlumniOnly} alumni, plus faculty and current students, across {totalStates} states and {distinctEmployers} employers.
      </div>
    </div>
  );
}
