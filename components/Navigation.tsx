'use client';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users, MessageCircle, Star, Calendar, LayoutDashboard,
  LogOut, Menu, X, Shield,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/directory', label: 'Directory', icon: Users },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
  { href: '/groups', label: 'Interest Groups', icon: Star },
  { href: '/events', label: 'Events', icon: Calendar },
];

export default function Navigation() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isAdmin = (session?.user as { role?: string })?.role === 'admin';

  function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ElementType }) {
    const active = pathname === href || pathname.startsWith(href + '/');
    return (
      <Link
        href={href}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
          active
            ? 'bg-scarlet text-white'
            : 'text-ohio-gray hover:bg-ohio-gray-light hover:text-ohio-gray-dark'
        }`}
      >
        <Icon size={18} />
        {label}
      </Link>
    );
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-6 border-b border-ohio-gray-medium">
        <Link href="/directory" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-scarlet rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">AHP</span>
          </div>
          <div>
            <p className="font-bold text-ohio-gray-dark text-sm leading-tight">AHP Alumni</p>
            <p className="text-xs text-ohio-gray">Network</p>
          </div>
        </Link>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
        {isAdmin && (
          <>
            <div className="border-t border-ohio-gray-medium my-3" />
            <NavLink href="/admin" label="Admin Panel" icon={Shield} />
          </>
        )}
      </nav>

      {/* User info + sign out */}
      <div className="px-3 py-4 border-t border-ohio-gray-medium">
        <Link
          href="/profile/me"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-ohio-gray-light transition-colors mb-2"
        >
          <div className="w-8 h-8 rounded-full bg-scarlet flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {session?.user?.name?.charAt(0) || '?'}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-ohio-gray-dark truncate">{session?.user?.name}</p>
            <p className="text-xs text-ohio-gray truncate">{session?.user?.email}</p>
          </div>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-ohio-gray hover:bg-red-50 hover:text-scarlet transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 lg:left-0 bg-white border-r border-ohio-gray-medium z-10">
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-ohio-gray-medium flex items-center justify-between px-4 z-20">
        <Link href="/directory" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-scarlet rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">AHP</span>
          </div>
          <span className="font-bold text-ohio-gray-dark">AHP Alumni</span>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 rounded-lg hover:bg-ohio-gray-light">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-30">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-xl">
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
