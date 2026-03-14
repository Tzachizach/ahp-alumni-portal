'use client';
import { useEffect, useState, useMemo } from 'react';
import { Alumni } from '@/lib/types';
import AlumniCard from '@/components/AlumniCard';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';

interface Group {
  name: string;
  members: Alumni[];
}

export default function GroupsPage() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/api/alumni')
      .then((r) => r.json())
      .then((data) => { setAlumni(data); setLoading(false); });
  }, []);

  const groups: Group[] = useMemo(() => {
    const map = new Map<string, Alumni[]>();
    alumni.forEach((a) => {
      const tags = a.summarizedInterestGroup
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      if (tags.length === 0) {
        const key = 'General';
        map.set(key, [...(map.get(key) || []), a]);
      } else {
        tags.forEach((tag) => {
          map.set(tag, [...(map.get(tag) || []), a]);
        });
      }
    });
    return [...map.entries()]
      .map(([name, members]) => ({ name, members }))
      .sort((a, b) => b.members.length - a.members.length);
  }, [alumni]);

  function toggleGroup(name: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  const INTEREST_COLORS: Record<string, string> = {
    'Finance': 'bg-blue-100 text-blue-800',
    'Accounting': 'bg-green-100 text-green-800',
    'Consulting': 'bg-purple-100 text-purple-800',
    'Technology': 'bg-indigo-100 text-indigo-800',
    'Entrepreneurship': 'bg-orange-100 text-orange-800',
    'Non-profit': 'bg-teal-100 text-teal-800',
    'Real Estate': 'bg-yellow-100 text-yellow-800',
    'Banking': 'bg-cyan-100 text-cyan-800',
    'General': 'bg-ohio-gray-light text-ohio-gray',
  };

  function colorFor(name: string) {
    return INTEREST_COLORS[name] || 'bg-scarlet-light text-scarlet';
  }

  if (loading) return (
    <div className="space-y-4">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="card animate-pulse h-24" />
      ))}
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ohio-gray-dark">Interest Groups</h1>
        <p className="text-ohio-gray mt-1">
          Alumni grouped by shared professional and personal interests · {groups.length} groups
        </p>
      </div>

      {/* Group overview chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {groups.map((g) => (
          <button
            key={g.name}
            onClick={() => toggleGroup(g.name)}
            className={`badge text-sm py-1 px-3 cursor-pointer transition-all ${colorFor(g.name)} hover:opacity-80`}
          >
            {g.name} · {g.members.length}
          </button>
        ))}
      </div>

      {/* Group cards */}
      <div className="space-y-4">
        {groups.map((group) => {
          const isOpen = openGroups.has(group.name);
          return (
            <div key={group.name} className="card p-0 overflow-hidden">
              {/* Group header */}
              <button
                onClick={() => toggleGroup(group.name)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-ohio-gray-light transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`badge text-sm py-1 px-3 ${colorFor(group.name)}`}>{group.name}</span>
                  <span className="flex items-center gap-1 text-sm text-ohio-gray">
                    <Users size={14} />
                    {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                  </span>
                </div>
                {isOpen ? <ChevronUp size={18} className="text-ohio-gray" /> : <ChevronDown size={18} className="text-ohio-gray" />}
              </button>

              {/* Member grid */}
              {isOpen && (
                <div className="border-t border-ohio-gray-medium px-6 pb-6 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {group.members.map((a) => (
                      <AlumniCard key={a.id} alumni={a} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
