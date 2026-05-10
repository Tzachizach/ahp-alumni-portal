import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Alumni } from '@/lib/types';
import { MapPin, Briefcase, GraduationCap, Linkedin } from 'lucide-react';

/**
 * Alumni directory card.
 *
 * Accessibility note: previous versions wrapped the entire card in <Link>
 * with nested <a> and <button> elements (invalid HTML — anchors cannot
 * be nested). This version uses the "stretched link" pattern: the card
 * is a plain <article>, and the alumni name is a <Link> whose
 * ::before pseudo-element covers the whole card. Other interactive
 * elements (LinkedIn, location filter, year filter) sit on top via
 * relative + z-index, so they remain individually clickable.
 *
 * Result: one accessible link per card (the name), but the whole card
 * is still mouse-clickable.
 */
export default function AlumniCard({ alumni }: { alumni: Alumni }) {
  const router = useRouter();
  return (
    <article className="card hover:shadow-md hover:border-scarlet transition-all duration-200 h-full flex flex-col relative focus-within:ring-2 focus-within:ring-scarlet">
      {/* LinkedIn icon — sits above the stretched link via z-index */}
      {alumni.linkedIn && (
        <a
          href={alumni.linkedIn.startsWith('http') ? alumni.linkedIn : `https://${alumni.linkedIn}`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-3 right-3 z-10 p-1.5 rounded-md text-ohio-gray hover:text-scarlet hover:bg-scarlet-light transition-colors"
          aria-label={`LinkedIn profile of ${alumni.fullName} (opens in new tab)`}
          title="View LinkedIn profile"
        >
          <Linkedin size={16} aria-hidden="true" />
        </a>
      )}

      {/* Photo + name */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-ohio-gray-medium flex-shrink-0 flex items-center justify-center">
          {alumni.profilePhoto ? (
            <Image
              src={alumni.profilePhoto}
              alt={`Photo of ${alumni.fullName}`}
              width={80}
              height={80}
              className="object-cover object-top w-full h-full"
            />
          ) : (
            <span className="text-3xl font-bold text-ohio-gray" aria-hidden="true">
              {alumni.fullName.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0 pr-8">
          <h3 className="font-bold text-ohio-gray-dark text-base leading-tight break-words">
            {/* Stretched link — covers the entire card so mouse users can click anywhere. */}
            <Link
              href={`/profile/${alumni.id}`}
              className="hover:text-scarlet transition-colors before:absolute before:inset-0 before:content-[''] before:rounded-xl"
            >
              {alumni.fullName}
            </Link>
          </h3>
          {alumni.graduationYear && (
            <button
              type="button"
              onClick={() => router.push(`/directory?year=${alumni.graduationYear}`)}
              className="badge bg-scarlet-light text-scarlet mt-1 hover:bg-scarlet hover:text-white transition-colors cursor-pointer relative z-10"
              aria-label={`Filter directory by Class of ${alumni.graduationYear}`}
            >
              Class of {alumni.graduationYear}
            </button>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="space-y-1.5 flex-1">
        {(alumni.currentJobTitle || alumni.currentEmployer) && (
          <div className="flex items-start gap-2 text-sm text-ohio-gray">
            <Briefcase size={14} className="flex-shrink-0 mt-0.5 text-scarlet" aria-hidden="true" />
            <span className="truncate">
              {[alumni.currentJobTitle, alumni.currentEmployer].filter(Boolean).join(' · ')}
            </span>
          </div>
        )}
        {alumni.location && (
          <button
            type="button"
            onClick={() => router.push(`/directory?location=${encodeURIComponent(alumni.location)}`)}
            className="flex items-center gap-2 text-sm text-ohio-gray hover:text-scarlet transition-colors text-left relative z-10"
            aria-label={`Filter directory by location: ${alumni.location}`}
          >
            <MapPin size={14} className="flex-shrink-0 text-scarlet" aria-hidden="true" />
            <span className="truncate">{alumni.location}</span>
          </button>
        )}
        {alumni.degreeEarned && (
          <div className="flex items-center gap-2 text-sm text-ohio-gray">
            <GraduationCap size={14} className="flex-shrink-0 text-scarlet" aria-hidden="true" />
            <span className="truncate">{alumni.degreeEarned}</span>
          </div>
        )}
      </div>

      {/* Interest tags */}
      {alumni.summarizedInterestGroup && (
        <div className="mt-3 pt-3 border-t border-ohio-gray-medium">
          <div className="flex flex-wrap gap-1">
            {alumni.summarizedInterestGroup
              .split(',')
              .slice(0, 2)
              .map((tag) => (
                <span key={tag} className="badge bg-ohio-gray-light text-ohio-gray text-xs">
                  {tag.trim()}
                </span>
              ))}
          </div>
        </div>
      )}
    </article>
  );
}
