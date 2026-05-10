'use client';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { Alumni } from '@/lib/types';
import { parseStateCode, STATE_CODE_TO_NAME } from '@/lib/usStates';
import { MapPin, User, Users as UsersIcon, X } from 'lucide-react';

// react-simple-maps reaches for `window` during init — load on the client only.
const UsLocationMap = dynamic(() => import('@/components/UsLocationMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[975/610] animate-pulse bg-ohio-gray-light rounded-lg" />
  ),
});

export default function LocationsPage() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/alumni')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAlumni(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Group alumni by parsed state code.
  const { byState, countsByState, unknownCount } = useMemo(() => {
    const byState: Record<string, Alumni[]> = {};
    let unknownCount = 0;
    for (const a of alumni) {
      const code = parseStateCode(a.location);
      if (!code) {
        unknownCount += 1;
        continue;
      }
      if (!byState[code]) byState[code] = [];
      byState[code].push(a);
    }
    // Sort each state's list alphabetically.
    Object.values(byState).forEach((list) =>
      list.sort((a, b) => a.fullName.localeCompare(b.fullName))
    );
    const countsByState: Record<string, number> = {};
    for (const [code, list] of Object.entries(byState)) {
      countsByState[code] = list.length;
    }
    return { byState, countsByState, unknownCount };
  }, [alumni]);

  // The state shown in the side panel: clicked > hovered > none.
  const focusState = selectedState ?? hoveredState;
  const focusList = focusState ? byState[focusState] || [] : [];
  const focusName = focusState ? STATE_CODE_TO_NAME[focusState] : '';

  const totalMapped = Object.values(countsByState).reduce((a, b) => a + b, 0);
  const topStates = useMemo(
    () =>
      Object.entries(countsByState)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5),
    [countsByState]
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-scarlet/10 rounded-lg flex items-center justify-center">
            <MapPin size={20} className="text-scarlet" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-ohio-gray-dark">Alumni Locations</h1>
        </div>
        <p className="text-ohio-gray text-sm">
          {loading
            ? 'Loading alumni…'
            : `Where our network lives. ${totalMapped} alumni across ${
                Object.keys(countsByState).length
              } states${unknownCount ? ` · ${unknownCount} without a recognized US location` : ''}.`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="card">
            <UsLocationMap
              countsByState={countsByState}
              hoveredState={hoveredState}
              selectedState={selectedState}
              onHover={setHoveredState}
              onSelect={(s) =>
                setSelectedState((prev) => (prev === s ? null : s))
              }
            />
            {/* Legend */}
            <div className="mt-4 flex items-center gap-4 text-xs text-ohio-gray flex-wrap">
              <span className="font-medium text-ohio-gray-dark">Density:</span>
              <div className="flex items-center gap-1">
                <span className="inline-block w-5 h-3 rounded-sm" style={{ backgroundColor: '#F5F5F5' }} aria-hidden="true" />
                <span>0</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-5 h-3 rounded-sm" style={{ backgroundColor: '#FCE7E7' }} aria-hidden="true" />
                <span>1</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-5 h-3 rounded-sm" style={{ backgroundColor: '#E89999' }} aria-hidden="true" />
                <span>few</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="inline-block w-5 h-3 rounded-sm" style={{ backgroundColor: '#BB0000' }} aria-hidden="true" />
                <span>many</span>
              </div>
              <span className="ml-auto text-ohio-gray italic">
                Hover a state to preview · click to lock the list
              </span>
            </div>
          </div>

          {/* Top states */}
          {topStates.length > 0 && (
            <div className="mt-4 card">
              <h2 className="font-semibold text-ohio-gray-dark text-sm mb-3 flex items-center gap-2">
                <UsersIcon size={16} className="text-scarlet" aria-hidden="true" />
                Top 5 states
              </h2>
              <ol className="space-y-1">
                {topStates.map(([code, count]) => (
                  <li key={code}>
                    <button
                      type="button"
                      onClick={() => setSelectedState(code)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md hover:bg-ohio-gray-light text-sm transition-colors ${
                        selectedState === code ? 'bg-scarlet-light text-scarlet font-semibold' : 'text-ohio-gray-dark'
                      }`}
                    >
                      <span>{STATE_CODE_TO_NAME[code]}</span>
                      <span className="badge bg-scarlet text-white">{count}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* Side panel — alumni in focused state */}
        <aside className="card lg:sticky lg:top-4 lg:self-start max-h-[calc(100vh-2rem)] overflow-y-auto">
          {focusState ? (
            <>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-ohio-gray font-semibold">
                    {selectedState ? 'Selected' : 'Hovering'}
                  </p>
                  <h2 className="text-lg font-bold text-ohio-gray-dark">{focusName}</h2>
                  <p className="text-sm text-ohio-gray">
                    {focusList.length} {focusList.length === 1 ? 'alum' : 'alumni'}
                  </p>
                </div>
                {selectedState && (
                  <button
                    type="button"
                    onClick={() => setSelectedState(null)}
                    className="text-ohio-gray hover:text-scarlet p-1 rounded-md"
                    aria-label="Clear state selection"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                )}
              </div>

              {focusList.length === 0 ? (
                <p className="text-sm text-ohio-gray italic">No alumni recorded here yet.</p>
              ) : (
                <ul className="space-y-2">
                  {focusList.map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/profile/${a.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-ohio-gray-light transition-colors"
                      >
                        <div className="w-9 h-9 rounded-full overflow-hidden bg-ohio-gray-medium flex-shrink-0 flex items-center justify-center border-2 border-scarlet/30">
                          {a.profilePhoto ? (
                            <Image
                              src={a.profilePhoto}
                              alt=""
                              width={36}
                              height={36}
                              className="object-cover object-top w-full h-full"
                            />
                          ) : (
                            <User size={14} className="text-ohio-gray" aria-hidden="true" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ohio-gray-dark truncate">
                            {a.fullName}
                          </p>
                          <p className="text-xs text-ohio-gray truncate">
                            {[
                              a.graduationYear ? `Class of ${a.graduationYear}` : '',
                              a.location,
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <div className="text-center py-10 text-ohio-gray">
              <MapPin size={36} className="mx-auto mb-3 opacity-30" aria-hidden="true" />
              <p className="text-sm font-medium">Hover or click a state</p>
              <p className="text-xs mt-1">Alumni in that state will appear here.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
