'use client';
import { useMemo } from 'react';
import Link from 'next/link';
import { BarChart3 } from 'lucide-react';
import { Alumni } from '@/lib/types';

interface Props {
  alumni: Alumni[];
  /** Optional override for the heading text. */
  title?: string;
  /** Show a "Loading…" caption when alumni is empty AND loading is true. */
  loading?: boolean;
  /** Max height of the scroll area (Tailwind size class) — default `max-h-96`. */
  maxHeightClass?: string;
}

/**
 * Horizontal-bar breakdown of alumni by graduation year. Each row links
 * to /directory?year=YYYY so admins or alumni can jump straight to a
 * cohort. Years are sorted newest-first; alumni with no recorded year
 * are summarized in the caption.
 */
export default function YearBreakdownChart({
  alumni,
  title = 'Alumni by graduation year',
  loading = false,
  maxHeightClass = 'max-h-96',
}: Props) {
  const breakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    let unknown = 0;
    for (const a of alumni) {
      const y = a.graduationYear?.trim();
      if (!y) unknown += 1;
      else counts[y] = (counts[y] || 0) + 1;
    }
    const rows = Object.entries(counts)
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => Number(b.year) - Number(a.year));
    const max = rows.reduce((m, r) => Math.max(m, r.count), 0);
    return { rows, max, unknown };
  }, [alumni]);

  return (
    <div className="card">
      <h2 className="font-semibold text-ohio-gray-dark mb-1 flex items-center gap-2">
        <BarChart3 size={16} className="text-scarlet" aria-hidden="true" />
        {title}
      </h2>
      <p className="text-xs text-ohio-gray mb-4">
        {loading
          ? 'Loading…'
          : `${breakdown.rows.length} ${breakdown.rows.length === 1 ? 'cohort' : 'cohorts'} represented${
              breakdown.unknown ? ` · ${breakdown.unknown} alumni with no year recorded` : ''
            }.`}
      </p>
      {!loading && breakdown.rows.length === 0 ? (
        <p className="text-sm text-ohio-gray italic">No graduation years recorded yet.</p>
      ) : (
        <ul className={`space-y-1.5 ${maxHeightClass} overflow-y-auto pr-2`}>
          {breakdown.rows.map(({ year, count }) => (
            <li key={year}>
              <Link
                href={`/directory?year=${year}`}
                className="flex items-center gap-3 text-sm rounded px-1 py-0.5 hover:bg-ohio-gray-light transition-colors"
                title={`View Class of ${year} in the directory`}
              >
                <span className="w-14 text-ohio-gray-dark font-medium text-right tabular-nums">
                  {year}
                </span>
                <div className="flex-1 h-5 bg-ohio-gray-light rounded overflow-hidden">
                  <div
                    className="h-full bg-scarlet transition-all duration-500"
                    style={{
                      width: `${breakdown.max > 0 ? (count / breakdown.max) * 100 : 0}%`,
                    }}
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={breakdown.max}
                    aria-valuenow={count}
                    aria-label={`Class of ${year}: ${count} ${count === 1 ? 'alum' : 'alumni'}`}
                  />
                </div>
                <span className="w-12 text-ohio-gray text-xs tabular-nums">{count}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
