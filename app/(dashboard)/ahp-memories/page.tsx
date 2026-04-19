'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Alumni } from '@/lib/types';
import { BookOpen, User, Search } from 'lucide-react';

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function AHPMemoriesPage() {
  const [all, setAll] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/alumni')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAll(shuffle(data.filter((a: Alumni) => a.favoriteAHPMemory?.trim())));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = all.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.fullName.toLowerCase().includes(q) ||
      a.favoriteAHPMemory.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-scarlet/10 rounded-lg flex items-center justify-center">
            <BookOpen size={20} className="text-scarlet" />
          </div>
          <h1 className="text-2xl font-bold text-ohio-gray-dark">Favorite AHP Memories</h1>
        </div>
        <p className="text-ohio-gray text-sm">
          Memorable moments from the Accounting Honors Program, shared by our alumni.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ohio-gray" />
        <input
          type="text"
          placeholder="Search memories or names…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-ohio-gray-medium rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-scarlet focus:border-transparent bg-white"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-ohio-gray-medium rounded-xl h-32" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-20 text-ohio-gray">
          <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">
            {search ? 'No memories match your search.' : 'No memories have been shared yet.'}
          </p>
          {!search && (
            <p className="text-sm mt-1">
              Alumni can add their memory from{' '}
              <Link href="/profile/me" className="text-scarlet hover:underline">their profile</Link>.
            </p>
          )}
        </div>
      )}

      {/* Memory cards */}
      {!loading && filtered.length > 0 && (
        <div className="space-y-4">
          {filtered.map((alumni) => (
            <div key={alumni.id} className="bg-white rounded-xl border border-ohio-gray-medium shadow-sm p-6">
              {/* Quote */}
              <blockquote className="text-ohio-gray-dark text-sm leading-relaxed italic mb-5 border-l-4 border-scarlet pl-4">
                &ldquo;{alumni.favoriteAHPMemory}&rdquo;
              </blockquote>

              {/* Attribution */}
              <Link
                href={`/profile/${alumni.id}`}
                className="flex items-center gap-3 group w-fit"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden bg-ohio-gray-medium flex-shrink-0 flex items-center justify-center border-2 border-scarlet/30">
                  {alumni.profilePhoto ? (
                    <Image
                      src={alumni.profilePhoto}
                      alt={alumni.fullName}
                      width={36}
                      height={36}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <User size={16} className="text-ohio-gray" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ohio-gray-dark group-hover:text-scarlet transition-colors">
                    {alumni.fullName}
                  </p>
                  <p className="text-xs text-ohio-gray">
                    {[alumni.graduationYear ? `Class of ${alumni.graduationYear}` : '', alumni.currentJobTitle].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Count */}
      {!loading && filtered.length > 0 && (
        <p className="text-center text-xs text-ohio-gray mt-6">
          {filtered.length} {filtered.length === 1 ? 'memory' : 'memories'} shared
        </p>
      )}
    </div>
  );
}
