'use client';
import Link from 'next/link';
import { PauseCircle, Users } from 'lucide-react';

/**
 * Interest Groups page is temporarily paused while we improve the
 * AI categorization that powers it. The route still resolves so
 * existing bookmarks don't 404, but the page is no longer linked
 * from the navigation.
 */
export default function GroupsPage() {
  return (
    <div className="max-w-2xl mx-auto py-10">
      <div className="card text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-scarlet/10 flex items-center justify-center">
          <PauseCircle size={28} className="text-scarlet" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-bold text-ohio-gray-dark mb-2">
          Interest Groups are paused
        </h1>
        <p className="text-sm text-ohio-gray mb-6">
          We&apos;re refining how alumni get sorted into interest categories so
          the groupings reflect what people actually share, not an AI guess.
          The page will return once the categorization is reliable.
        </p>
        <Link href="/directory" className="btn-primary inline-flex items-center gap-2">
          <Users size={16} aria-hidden="true" />
          Browse the Directory instead
        </Link>
      </div>
    </div>
  );
}
