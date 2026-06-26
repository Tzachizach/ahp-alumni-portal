'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Users, MessageCircle, Star, ArrowRight, AlertCircle, ClipboardCheck } from 'lucide-react';
import { Alumni } from '@/lib/types';
import { computeCompleteness } from '@/lib/profileCompleteness';

interface AuthRecord {
  id: string;
  email: string;
  role: 'alumni' | 'admin';
}

export default function AdminDashboard() {
  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [authRecords, setAuthRecords] = useState<AuthRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/alumni').then((r) => r.json()),
      fetch('/api/admin/users').then((r) => r.json()),
    ]).then(([alumniData, usersData]) => {
      setAlumni(Array.isArray(alumniData) ? alumniData : []);
      setAuthRecords(Array.isArray(usersData?.authRecords) ? usersData.authRecords : []);
      setLoading(false);
    });
  }, []);

  // Completeness aggregates — computed once for the dashboard stat cards.
  const completeness = useMemo(() => {
    if (alumni.length === 0) return { incomplete: 0, completePct: 0, avgPct: 0 };
    let incomplete = 0;
    let sumPct = 0;
    for (const a of alumni) {
      const c = computeCompleteness(a);
      if (!c.isComplete) incomplete += 1;
      sumPct += c.pct;
    }
    return {
      incomplete,
      completePct: Math.round(((alumni.length - incomplete) / alumni.length) * 100),
      avgPct: Math.round(sumPct / alumni.length),
    };
  }, [alumni]);

  const cards = [
    {
      label: 'Alumni in Airtable',
      value: alumni.length,
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Portal accounts',
      value: authRecords.length,
      icon: Star,
      color: 'bg-green-50 text-green-600',
    },
    {
      label: 'Profiles with gaps',
      value: completeness.incomplete,
      sub: `${completeness.avgPct}% avg completeness`,
      icon: AlertCircle,
      color: 'bg-scarlet-light text-scarlet',
    },
  ];

  const links = [
    {
      href: '/admin/users',
      label: 'Manage User Accounts',
      description: 'Create, reset passwords, and remove portal accounts',
      icon: Users,
    },
    {
      href: '/admin/completeness',
      label: 'Profile Completeness Report',
      description: 'See which alumni still need to fill in their essentials',
      icon: ClipboardCheck,
    },
    {
      href: '/directory',
      label: 'View Directory',
      description: 'Browse all alumni profiles',
      icon: Star,
    },
    {
      href: '/messages',
      label: 'Messages',
      description: 'View your inbox and send messages (including alumni feedback)',
      icon: MessageCircle,
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-ohio-gray-dark mb-6">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
              <card.icon size={22} aria-hidden="true" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ohio-gray-dark">
                {loading ? '—' : card.value}
              </p>
              <p className="text-sm text-ohio-gray">{card.label}</p>
              {card.sub && (
                <p className="text-xs text-ohio-gray mt-0.5">{card.sub}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <h2 className="text-sm font-semibold text-ohio-gray uppercase tracking-wide mb-3">
        Quick Actions
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="card hover:shadow-md hover:border-scarlet transition-all flex items-center gap-4 group"
          >
            <div className="w-10 h-10 rounded-lg bg-scarlet-light flex items-center justify-center group-hover:bg-scarlet transition-colors">
              <link.icon size={18} className="text-scarlet group-hover:text-white transition-colors" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-ohio-gray-dark">{link.label}</p>
              <p className="text-sm text-ohio-gray">{link.description}</p>
            </div>
            <ArrowRight size={16} className="text-ohio-gray group-hover:text-scarlet transition-colors" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </div>
  );
}
