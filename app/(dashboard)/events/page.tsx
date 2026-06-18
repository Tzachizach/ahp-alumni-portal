'use client';
import Link from 'next/link';
import { PauseCircle, Users } from 'lucide-react';

/**
 * Events page is paused — the program isn't actively running alumni
 * events through the portal yet. The route still resolves so existing
 * bookmarks don't 404, but the page is no longer linked from the
 * navigation.
 */
export default function EventsPage() {
  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="card text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-scarlet/10 flex items-center justify-center">
          <PauseCircle size={28} className="text-scarlet" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold text-ohio-gray-dark mb-2">
          Events are paused
        </h1>
        <p className="text-sm text-ohio-gray mb-6">
          We&apos;re not running alumni events through the portal at the moment.
          This page will come back when the program is ready to publish them.
        </p>
        <Link href="/directory" className="btn-primary inline-flex items-center gap-2">
          <Users size={16} aria-hidden="true" />
          Browse the Directory instead
        </Link>
      </div>
    </div>
  );
}
