'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Users, Calendar, MessageCircle, Star, ArrowRight } from 'lucide-react';

interface Stats {
  totalAlumni: number;
  totalUsers: number;
  totalEvents: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/alumni').then((r) => r.json()),
      fetch('/api/admin/users').then((r) => r.json()),
      fetch('/api/events').then((r) => r.json()),
    ]).then(([alumni, usersData, events]) => {
      setStats({
        totalAlumni: Array.isArray(alumni) ? alumni.length : 0,
        totalUsers: Array.isArray(usersData?.authRecords) ? usersData.authRecords.length : 0,
        totalEvents: Array.isArray(events) ? events.length : 0,
      });
    });
  }, []);

  const cards = [
    { label: 'Alumni in Airtable', value: stats?.totalAlumni, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Portal Accounts', value: stats?.totalUsers, icon: Star, color: 'bg-green-50 text-green-600' },
    { label: 'Events', value: stats?.totalEvents, icon: Calendar, color: 'bg-purple-50 text-purple-600' },
  ];

  const links = [
    { href: '/admin/users', label: 'Manage User Accounts', description: 'Create, reset passwords, and remove portal accounts', icon: Users },
    { href: '/events', label: 'Manage Events', description: 'Create and delete alumni events', icon: Calendar },
    { href: '/directory', label: 'View Directory', description: 'Browse all alumni profiles', icon: Star },
    { href: '/messages', label: 'Messages', description: 'View your inbox and send messages', icon: MessageCircle },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-ohio-gray-dark mb-6">Admin Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color}`}>
              <card.icon size={22} />
            </div>
            <div>
              <p className="text-2xl font-bold text-ohio-gray-dark">
                {card.value ?? '—'}
              </p>
              <p className="text-sm text-ohio-gray">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <h2 className="text-sm font-semibold text-ohio-gray uppercase tracking-wide mb-3">Quick Actions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="card hover:shadow-md hover:border-scarlet transition-all flex items-center gap-4 group">
            <div className="w-10 h-10 rounded-lg bg-scarlet-light flex items-center justify-center group-hover:bg-scarlet transition-colors">
              <link.icon size={18} className="text-scarlet group-hover:text-white transition-colors" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-ohio-gray-dark">{link.label}</p>
              <p className="text-sm text-ohio-gray">{link.description}</p>
            </div>
            <ArrowRight size={16} className="text-ohio-gray group-hover:text-scarlet transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
