import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Navigation from '@/components/Navigation';
import { canAccessAdmin } from '@/lib/permissions';

export const metadata = { title: 'Admin' };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  if (!canAccessAdmin((session.user as { role?: string })?.role)) redirect('/directory');

  return (
    <div className="min-h-screen bg-ohio-gray-light">
      {/* Skip link — keyboard users can bypass the navigation (WCAG 2.4.1). */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-scarlet focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg focus:font-semibold"
      >
        Skip to main content
      </a>
      <Navigation />
      <main id="main-content" className="lg:pl-60 pt-14 lg:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-2">
            <span className="badge bg-scarlet text-white text-xs">Admin</span>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
