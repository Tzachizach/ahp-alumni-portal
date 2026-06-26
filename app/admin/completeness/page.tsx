'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Search, CheckCircle2, AlertCircle, Mail, ChevronUp, ChevronDown, Users,
} from 'lucide-react';
import { Alumni } from '@/lib/types';
import {
  ESSENTIAL_FIELDS,
  computeCompleteness,
} from '@/lib/profileCompleteness';

type SortKey = 'completeness-asc' | 'completeness-desc' | 'name' | 'year';

interface Row {
  alumni: Alumni;
  filled: number;
  total: number;
  missing: string[];
  pct: number;
  isComplete: boolean;
}

export default function CompletenessReportPage() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showOnlyIncomplete, setShowOnlyIncomplete] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('completeness-asc');

  useEffect(() => {
    fetch('/api/alumni')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // The completeness essentials are alumni-shaped (LinkedIn, current
          // employer, etc.) — exclude faculty and students from this report.
          setAlumni(data.filter((a: Alumni) => a.type === 'Alumni'));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Compute one row per alum.
  const rows: Row[] = useMemo(
    () =>
      alumni.map((a) => {
        const c = computeCompleteness(a);
        return { alumni: a, ...c };
      }),
    [alumni]
  );

  // Aggregate stats — across ALL alumni, not the filtered view.
  const stats = useMemo(() => {
    if (rows.length === 0) {
      return { total: 0, complete: 0, avg: 0, fieldFilledPct: [] as Array<{ label: string; pct: number; filled: number }> };
    }
    const total = rows.length;
    const complete = rows.filter((r) => r.isComplete).length;
    const sumPct = rows.reduce((s, r) => s + r.pct, 0);
    const avg = Math.round(sumPct / total);

    const fieldFilledPct = ESSENTIAL_FIELDS.map((f) => {
      const filled = alumni.filter((a) => f.isFilled(a)).length;
      return { label: f.label, filled, pct: Math.round((filled / total) * 100) };
    }).sort((a, b) => a.pct - b.pct); // lowest first — most-missing on top

    return { total, complete, avg, fieldFilledPct };
  }, [rows, alumni]);

  // Apply filters + sort to derive the displayed rows.
  const displayed = useMemo(() => {
    const q = search.trim().toLowerCase();
    let r = rows;
    if (showOnlyIncomplete) r = r.filter((row) => !row.isComplete);
    if (q) {
      r = r.filter((row) => {
        const a = row.alumni;
        return (
          a.fullName.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          (a.graduationYear || '').toLowerCase().includes(q)
        );
      });
    }
    const sorted = [...r];
    sorted.sort((a, b) => {
      switch (sortKey) {
        case 'completeness-asc':
          return a.filled - b.filled || a.alumni.fullName.localeCompare(b.alumni.fullName);
        case 'completeness-desc':
          return b.filled - a.filled || a.alumni.fullName.localeCompare(b.alumni.fullName);
        case 'name':
          return a.alumni.fullName.localeCompare(b.alumni.fullName);
        case 'year':
          // Newest grads first; alumni with no year sink to the bottom.
          return (Number(b.alumni.graduationYear) || 0) - (Number(a.alumni.graduationYear) || 0);
        default:
          return 0;
      }
    });
    return sorted;
  }, [rows, search, showOnlyIncomplete, sortKey]);

  function toggleSort(target: 'completeness') {
    if (target === 'completeness') {
      setSortKey((prev) => (prev === 'completeness-asc' ? 'completeness-desc' : 'completeness-asc'));
    }
  }

  return (
    <div>
      {/* Back */}
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-sm text-ohio-gray hover:text-scarlet mb-4 transition-colors"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to Admin
      </Link>

      <h1 className="text-2xl font-bold text-ohio-gray-dark mb-1">Profile Completeness</h1>
      <p className="text-sm text-ohio-gray mb-6">
        Which alumni still need to fill in their essential profile fields. The six essentials
        are: photo, phone, location, LinkedIn, current job title, and current employer.
      </p>

      {loading ? (
        <div className="card animate-pulse h-40" />
      ) : (
        <>
          {/* Top stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="card">
              <p className="text-xs uppercase tracking-wide text-ohio-gray font-semibold">Total alumni</p>
              <p className="text-2xl font-bold text-ohio-gray-dark mt-1">{stats.total}</p>
            </div>
            <div className="card">
              <p className="text-xs uppercase tracking-wide text-ohio-gray font-semibold">Complete</p>
              <p className="text-2xl font-bold text-green-700 mt-1 flex items-baseline gap-2">
                {stats.complete}
                <span className="text-sm font-medium text-ohio-gray">
                  ({stats.total ? Math.round((stats.complete / stats.total) * 100) : 0}%)
                </span>
              </p>
            </div>
            <div className="card">
              <p className="text-xs uppercase tracking-wide text-ohio-gray font-semibold">Avg. completeness</p>
              <p className="text-2xl font-bold text-ohio-gray-dark mt-1">{stats.avg}%</p>
            </div>
            <div className="card">
              <p className="text-xs uppercase tracking-wide text-ohio-gray font-semibold">Missing at least one</p>
              <p className="text-2xl font-bold text-scarlet mt-1">
                {stats.total - stats.complete}
              </p>
            </div>
          </div>

          {/* Per-field breakdown */}
          <div className="card mb-6">
            <h2 className="font-semibold text-ohio-gray-dark mb-3 flex items-center gap-2">
              <Users size={16} className="text-scarlet" aria-hidden="true" />
              How well each field is filled
            </h2>
            <p className="text-xs text-ohio-gray mb-4">
              Sorted lowest-first, so the fields you most need to nudge people on are at the top.
            </p>
            <ul className="space-y-3">
              {stats.fieldFilledPct.map((f) => (
                <li key={f.label}>
                  <div className="flex items-center justify-between mb-1 text-sm">
                    <span className="font-medium text-ohio-gray-dark">{f.label}</span>
                    <span className="text-ohio-gray">
                      {f.filled} / {stats.total}{' '}
                      <span className="text-xs">({f.pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2 bg-ohio-gray-light rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        f.pct >= 80
                          ? 'bg-green-600'
                          : f.pct >= 50
                          ? 'bg-amber-500'
                          : 'bg-scarlet'
                      }`}
                      style={{ width: `${f.pct}%` }}
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={f.pct}
                      aria-label={`${f.label}: ${f.pct}% filled`}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-3 items-stretch sm:items-center">
            <div className="relative flex-1">
              <label htmlFor="completeness-search" className="sr-only">
                Search alumni by name, email, or year
              </label>
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ohio-gray" aria-hidden="true" />
              <input
                id="completeness-search"
                type="search"
                className="input pl-9"
                placeholder="Search by name, email, or class year…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-ohio-gray-dark cursor-pointer sm:whitespace-nowrap">
              <input
                type="checkbox"
                checked={showOnlyIncomplete}
                onChange={(e) => setShowOnlyIncomplete(e.target.checked)}
                className="w-4 h-4 accent-scarlet"
              />
              Show only incomplete profiles
            </label>
            <div className="sm:w-48">
              <label htmlFor="completeness-sort" className="sr-only">Sort by</label>
              <select
                id="completeness-sort"
                className="input"
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
              >
                <option value="completeness-asc">Least complete first</option>
                <option value="completeness-desc">Most complete first</option>
                <option value="name">Name (A–Z)</option>
                <option value="year">Class year (newest)</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-ohio-gray mb-3">
            Showing {displayed.length} of {stats.total} alumni
            {showOnlyIncomplete && ' (incomplete only)'}.
          </p>

          {/* Table */}
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ohio-gray-medium bg-ohio-gray-light">
                    <th className="text-left px-4 py-3 font-semibold text-ohio-gray">Name</th>
                    <th className="text-left px-4 py-3 font-semibold text-ohio-gray">Year</th>
                    <th className="text-left px-4 py-3 font-semibold text-ohio-gray hidden md:table-cell">Email</th>
                    <th className="text-left px-4 py-3 font-semibold text-ohio-gray">
                      <button
                        type="button"
                        onClick={() => toggleSort('completeness')}
                        className="inline-flex items-center gap-1 hover:text-scarlet transition-colors"
                      >
                        Completeness
                        {sortKey === 'completeness-asc' && <ChevronUp size={14} aria-hidden="true" />}
                        {sortKey === 'completeness-desc' && <ChevronDown size={14} aria-hidden="true" />}
                      </button>
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-ohio-gray hidden lg:table-cell">Missing</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-ohio-gray">
                        {showOnlyIncomplete && rows.length > 0
                          ? 'Every alum has a complete profile! 🎉'
                          : 'No alumni match the current filter.'}
                      </td>
                    </tr>
                  ) : (
                    displayed.map(({ alumni: a, filled, total, missing, pct, isComplete }) => (
                      <tr
                        key={a.id}
                        className="border-b border-ohio-gray-medium last:border-0 hover:bg-ohio-gray-light transition-colors"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/profile/${a.id}`}
                            className="font-medium text-ohio-gray-dark hover:text-scarlet"
                          >
                            {a.fullName}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-ohio-gray">{a.graduationYear || '—'}</td>
                        <td className="px-4 py-3 text-ohio-gray hidden md:table-cell">
                          {a.email ? (
                            <a
                              href={`mailto:${a.email}`}
                              className="inline-flex items-center gap-1 hover:text-scarlet"
                              title={`Email ${a.fullName}`}
                            >
                              <Mail size={12} aria-hidden="true" />
                              <span className="truncate">{a.email}</span>
                            </a>
                          ) : (
                            <span className="italic">no email</span>
                          )}
                        </td>
                        <td className="px-4 py-3 min-w-[160px]">
                          <div className="flex items-center gap-2">
                            {isComplete ? (
                              <CheckCircle2 size={14} className="text-green-600 flex-shrink-0" aria-hidden="true" />
                            ) : (
                              <AlertCircle size={14} className="text-scarlet flex-shrink-0" aria-hidden="true" />
                            )}
                            <span className="text-ohio-gray-dark whitespace-nowrap font-medium">
                              {filled} / {total}
                            </span>
                            <div
                              className="flex-1 h-1.5 bg-ohio-gray-light rounded-full overflow-hidden min-w-[60px]"
                              role="progressbar"
                              aria-valuemin={0}
                              aria-valuemax={total}
                              aria-valuenow={filled}
                              aria-label={`${a.fullName}: ${filled} of ${total} essentials`}
                            >
                              <div
                                className={`h-full transition-all ${isComplete ? 'bg-green-600' : 'bg-scarlet'}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-ohio-gray hidden lg:table-cell">
                          {missing.length === 0 ? (
                            <span className="text-green-700">—</span>
                          ) : (
                            <span className="text-xs">{missing.join(', ')}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
