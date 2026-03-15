'use client';
import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import AlumniCard from '@/components/AlumniCard';
import { Alumni } from '@/lib/types';
import { Search, Filter, X } from 'lucide-react';

export default function DirectoryPage() {
  const searchParams = useSearchParams();
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState(searchParams.get('year') || '');
  const [networkingFilter, setNetworkingFilter] = useState('');
  const [interestFilter, setInterestFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [showFilters, setShowFilters] = useState(!!searchParams.get('year'));

  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/alumni')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAlumni(data);
        } else {
          console.error('Alumni API error:', data);
          setError(data?.detail || data?.error || 'Failed to load alumni');
        }
        setLoading(false);
      })
      .catch((e) => { setError(String(e)); setLoading(false); });
  }, []);

  // Derived filter options
  const years = useMemo(
    () => Array.from(new Set(alumni.map((a) => a.graduationYear).filter(Boolean))).sort((a, b) => Number(b) - Number(a)),
    [alumni]
  );
  const networkingCategories = useMemo(
    () => Array.from(new Set(alumni.map((a) => a.networkingCategory).filter(Boolean))).sort(),
    [alumni]
  );
  const interestGroups = useMemo(
    () => Array.from(new Set(alumni.flatMap((a) => a.summarizedInterestGroup.split(',').map((s) => s.trim())).filter(Boolean))).sort(),
    [alumni]
  );
  const locations = useMemo(
    () => Array.from(new Set(alumni.map((a) => a.location).filter(Boolean))).sort(),
    [alumni]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return alumni.filter((a) => {
      const matchSearch =
        !q ||
        a.fullName.toLowerCase().includes(q) ||
        a.currentEmployer.toLowerCase().includes(q) ||
        a.currentJobTitle.toLowerCase().includes(q) ||
        a.professionalAreasOfExpertise.toLowerCase().includes(q) ||
        a.location.toLowerCase().includes(q);
      const matchYear = !yearFilter || a.graduationYear === yearFilter;
      const matchNetworking = !networkingFilter || a.networkingCategory === networkingFilter;
      const matchInterest = !interestFilter || a.summarizedInterestGroup.includes(interestFilter);
      const matchLocation = !locationFilter || a.location === locationFilter;
      return matchSearch && matchYear && matchNetworking && matchInterest && matchLocation;
    });
  }, [alumni, search, yearFilter, networkingFilter, interestFilter, locationFilter]);

  const hasFilters = yearFilter || networkingFilter || interestFilter || locationFilter;

  function clearFilters() {
    setYearFilter('');
    setNetworkingFilter('');
    setInterestFilter('');
    setLocationFilter('');
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ohio-gray-dark">Alumni Directory</h1>
        <p className="text-ohio-gray mt-1">
          {loading ? 'Loading…' : `${filtered.length} of ${alumni.length} alumni`}
        </p>
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ohio-gray" />
          <input
            className="input pl-9"
            placeholder="Search by name, employer, expertise, location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
            hasFilters
              ? 'border-scarlet bg-scarlet-light text-scarlet'
              : 'border-ohio-gray-medium bg-white text-ohio-gray hover:border-scarlet'
          }`}
        >
          <Filter size={16} />
          Filters {hasFilters && `(${[yearFilter, networkingFilter, interestFilter, locationFilter].filter(Boolean).length})`}
        </button>
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-ohio-gray hover:text-scarlet">
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card mb-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <label className="label">Graduation Year</label>
            <select className="input" value={yearFilter} onChange={(e) => setYearFilter(e.target.value)}>
              <option value="">All years</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Networking Style</label>
            <select className="input" value={networkingFilter} onChange={(e) => setNetworkingFilter(e.target.value)}>
              <option value="">All</option>
              {networkingCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Interest Group</label>
            <select className="input" value={interestFilter} onChange={(e) => setInterestFilter(e.target.value)}>
              <option value="">All</option>
              {interestGroups.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Location</label>
            <select className="input" value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
              <option value="">All locations</option>
              {locations.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* Grid */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-4 text-sm">
          <strong>Error loading alumni:</strong> {error}
        </div>
      )}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-ohio-gray-medium" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-4 bg-ohio-gray-medium rounded w-3/4" />
                  <div className="h-3 bg-ohio-gray-medium rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-ohio-gray-medium rounded" />
                <div className="h-3 bg-ohio-gray-medium rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-ohio-gray">
          <p className="text-lg font-medium">No alumni found</p>
          <p className="text-sm mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((a) => (
            <AlumniCard key={a.id} alumni={a} />
          ))}
        </div>
      )}
    </div>
  );
}
