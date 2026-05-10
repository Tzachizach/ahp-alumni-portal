'use client';
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Image from 'next/image';
import { Alumni } from '@/lib/types';
import { parseStateCode, STATE_CODE_TO_NAME } from '@/lib/usStates';
import { lookupCity } from '@/lib/usCities';
import { MapPin, User, Users as UsersIcon, X, Globe2, Filter, Search } from 'lucide-react';
import type { CityMarker } from '@/components/UsLocationMap';

// react-simple-maps reaches for `window` during init — load on the client only.
const UsLocationMap = dynamic(() => import('@/components/UsLocationMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[975/610] animate-pulse bg-ohio-gray-light rounded-lg" />
  ),
});

/** Augment each alum with parsed-once geo info to avoid recomputing in filters. */
interface AlumniGeo extends Alumni {
  _stateCode: string | null;
  _cityKey: string | null; // "Canonical City|ST" if found in usCities lookup
  _city: string | null;
  _lat: number | null;
  _lng: number | null;
}

export default function LocationsPage() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);
  const [showInternational, setShowInternational] = useState(false);

  // Filters
  const [yearFilter, setYearFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/alumni')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAlumni(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Compute parsed geo info once per alum. This is the only place the
  // location string is parsed; everything downstream uses _stateCode etc.
  const alumniGeo: AlumniGeo[] = useMemo(
    () =>
      alumni.map((a) => {
        const stateCode = parseStateCode(a.location);
        const city = stateCode ? lookupCity(a.location, stateCode) : null;
        return {
          ...a,
          _stateCode: stateCode,
          _cityKey: city ? `${city.city}|${city.state}` : null,
          _city: city ? city.city : null,
          _lat: city ? city.lat : null,
          _lng: city ? city.lng : null,
        };
      }),
    [alumni]
  );

  // Filter pass — applied before grouping so the map and lists agree.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return alumniGeo.filter((a) => {
      if (yearFilter && a.graduationYear !== yearFilter) return false;
      if (q) {
        const haystack = [
          a.fullName,
          a.currentEmployer,
          a.currentJobTitle,
          a.location,
          a.professionalAreasOfExpertise,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [alumniGeo, yearFilter, search]);

  // Year dropdown options come from the unfiltered set so they're stable.
  const years = useMemo(
    () =>
      Array.from(new Set(alumni.map((a) => a.graduationYear).filter(Boolean)))
        .sort((a, b) => Number(b) - Number(a)),
    [alumni]
  );

  // Group filtered alumni by state.
  const { byState, countsByState, international } = useMemo(() => {
    const byState: Record<string, AlumniGeo[]> = {};
    const international: AlumniGeo[] = [];
    for (const a of filtered) {
      if (!a._stateCode) {
        international.push(a);
        continue;
      }
      if (!byState[a._stateCode]) byState[a._stateCode] = [];
      byState[a._stateCode].push(a);
    }
    Object.values(byState).forEach((list) =>
      list.sort((a, b) => a.fullName.localeCompare(b.fullName))
    );
    international.sort((a, b) => a.fullName.localeCompare(b.fullName));
    const countsByState: Record<string, number> = {};
    for (const [code, list] of Object.entries(byState)) {
      countsByState[code] = list.length;
    }
    return { byState, countsByState, international };
  }, [filtered]);

  // Group filtered alumni by city (only those whose city is in the lookup).
  const { byCity, cityMarkers } = useMemo(() => {
    const byCity: Record<string, AlumniGeo[]> = {};
    for (const a of filtered) {
      if (!a._cityKey || a._lat == null || a._lng == null) continue;
      if (!byCity[a._cityKey]) byCity[a._cityKey] = [];
      byCity[a._cityKey].push(a);
    }
    Object.values(byCity).forEach((list) =>
      list.sort((a, b) => a.fullName.localeCompare(b.fullName))
    );
    const markers: CityMarker[] = [];
    for (const [key, list] of Object.entries(byCity)) {
      const first = list[0];
      if (first._lat == null || first._lng == null || !first._city || !first._stateCode) continue;
      markers.push({
        id: key,
        city: first._city,
        state: first._stateCode,
        lat: first._lat,
        lng: first._lng,
        count: list.length,
      });
    }
    return { byCity, cityMarkers: markers };
  }, [filtered]);

  // Side panel: city selection wins over state selection if both are set.
  const focusCity = selectedCityId ? byCity[selectedCityId] : null;
  const focusState = selectedState ?? hoveredState;
  const focusList = focusCity
    ? focusCity
    : focusState
    ? byState[focusState] || []
    : [];
  const focusName = focusCity
    ? `${focusCity[0]?._city ?? ''}, ${focusCity[0]?._stateCode ?? ''}`
    : focusState
    ? STATE_CODE_TO_NAME[focusState]
    : '';
  const focusKind: 'city' | 'state' | null = focusCity ? 'city' : focusState ? 'state' : null;

  const totalMapped = Object.values(countsByState).reduce((a, b) => a + b, 0);
  const topStates = useMemo(
    () =>
      Object.entries(countsByState)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5),
    [countsByState]
  );

  const hasActiveFilters = !!yearFilter || !!search;

  function clearFilters() {
    setYearFilter('');
    setSearch('');
  }

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
              } states${international.length ? ` · ${international.length} international or unrecognized` : ''}${
                hasActiveFilters ? ` · filtered from ${alumni.length} total` : ''
              }.`}
        </p>
      </div>

      {/* Filter bar */}
      <div className="card mb-6 p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
        <div className="flex-1">
          <label htmlFor="loc-search" className="label flex items-center gap-1.5">
            <Search size={14} className="text-scarlet" aria-hidden="true" /> Search
          </label>
          <input
            id="loc-search"
            type="search"
            className="input"
            placeholder="Name, employer, expertise, location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="sm:w-48">
          <label htmlFor="loc-year" className="label flex items-center gap-1.5">
            <Filter size={14} className="text-scarlet" aria-hidden="true" /> Class year
          </label>
          <select
            id="loc-year"
            className="input"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
          >
            <option value="">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="btn-ghost flex items-center gap-1 text-sm sm:self-end"
            aria-label="Clear filters"
          >
            <X size={14} aria-hidden="true" /> Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2">
          <div className="card">
            <UsLocationMap
              countsByState={countsByState}
              cityMarkers={cityMarkers}
              hoveredState={hoveredState}
              selectedState={selectedState}
              selectedCityId={selectedCityId}
              onHoverState={setHoveredState}
              onSelectState={(s) => {
                setSelectedCityId(null);
                setSelectedState((prev) => (prev === s ? null : s));
              }}
              onSelectCity={(id) => {
                setSelectedState(null);
                setSelectedCityId(id);
              }}
            />
            {/* Legend */}
            <div className="mt-4 flex items-center gap-4 text-xs text-ohio-gray flex-wrap">
              <span className="font-medium text-ohio-gray-dark">State density:</span>
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
              <span className="mx-2 text-ohio-gray-medium" aria-hidden="true">|</span>
              <span className="font-medium text-ohio-gray-dark">Cities:</span>
              <div className="flex items-center gap-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#7A0000' }} aria-hidden="true" />
                <span>= alumni count</span>
              </div>
              <span className="ml-auto text-ohio-gray italic">
                Hover or click a state · click a dot for that city
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
                      onClick={() => {
                        setSelectedCityId(null);
                        setSelectedState(code);
                      }}
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

          {/* International / unrecognized section */}
          {international.length > 0 && (
            <div className="mt-4 card">
              <button
                type="button"
                onClick={() => setShowInternational((v) => !v)}
                className="w-full flex items-center justify-between"
                aria-expanded={showInternational}
                aria-controls="international-list"
              >
                <h2 className="font-semibold text-ohio-gray-dark text-sm flex items-center gap-2">
                  <Globe2 size={16} className="text-scarlet" aria-hidden="true" />
                  International &amp; unrecognized
                  <span className="badge bg-ohio-gray-light text-ohio-gray">
                    {international.length}
                  </span>
                </h2>
                <span className="text-xs text-ohio-gray">
                  {showInternational ? 'Hide' : 'Show'}
                </span>
              </button>
              {showInternational && (
                <ul id="international-list" className="mt-3 space-y-2">
                  {international.map((a) => (
                    <li key={a.id}>
                      <Link
                        href={`/profile/${a.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-ohio-gray-light transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-ohio-gray-medium flex-shrink-0 flex items-center justify-center border border-scarlet/30">
                          {a.profilePhoto ? (
                            <Image
                              src={a.profilePhoto}
                              alt=""
                              width={32}
                              height={32}
                              className="object-cover object-top w-full h-full"
                            />
                          ) : (
                            <User size={12} className="text-ohio-gray" aria-hidden="true" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ohio-gray-dark truncate">
                            {a.fullName}
                          </p>
                          <p className="text-xs text-ohio-gray truncate">
                            {[
                              a.graduationYear ? `Class of ${a.graduationYear}` : '',
                              a.location || '— location not provided —',
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
            </div>
          )}
        </div>

        {/* Side panel — alumni in focused state or city */}
        <aside className="card lg:sticky lg:top-4 lg:self-start max-h-[calc(100vh-2rem)] overflow-y-auto">
          {focusKind ? (
            <>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-ohio-gray font-semibold">
                    {focusKind === 'city' ? 'City' : selectedState ? 'Selected state' : 'Hovering state'}
                  </p>
                  <h2 className="text-lg font-bold text-ohio-gray-dark">{focusName}</h2>
                  <p className="text-sm text-ohio-gray">
                    {focusList.length} {focusList.length === 1 ? 'alum' : 'alumni'}
                  </p>
                </div>
                {(selectedState || selectedCityId) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedState(null);
                      setSelectedCityId(null);
                    }}
                    className="text-ohio-gray hover:text-scarlet p-1 rounded-md"
                    aria-label="Clear selection"
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                )}
              </div>

              {focusList.length === 0 ? (
                <p className="text-sm text-ohio-gray italic">
                  No alumni recorded here yet
                  {hasActiveFilters ? ' (with current filters)' : ''}.
                </p>
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
              <p className="text-xs mt-1">Or click a city dot for a finer view.</p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
