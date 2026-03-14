import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Navigation from '@/components/Navigation';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  if ((session.user as { role?: string })?.role !== 'admin') redirect('/directory');

  return (
    <div className="min-h-screen bg-ohio-gray-light">
      <Navigation />
      <main className="lg:pl-60 pt-14 lg:pt-0">
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
