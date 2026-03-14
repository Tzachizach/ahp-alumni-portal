import Link from 'next/link';
import Image from 'next/image';
import { Alumni } from '@/lib/types';
import { MapPin, Briefcase, GraduationCap } from 'lucide-react';

export default function AlumniCard({ alumni }: { alumni: Alumni }) {
  return (
    <Link href={`/profile/${alumni.id}`}>
      <div className="card hover:shadow-md hover:border-scarlet transition-all duration-200 cursor-pointer h-full flex flex-col">
        {/* Photo */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-ohio-gray-medium flex-shrink-0 flex items-center justify-center">
            {alumni.profilePhoto ? (
              <Image
                src={alumni.profilePhoto}
                alt={alumni.fullName}
                width={64}
                height={64}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-2xl font-bold text-ohio-gray">
                {alumni.fullName.charAt(0)}
              </span>
            )}
          </div>
          <div className="overflow-hidden">
            <h3 className="font-bold text-ohio-gray-dark text-base leading-tight truncate">
              {alumni.fullName}
            </h3>
            {alumni.graduationYear && (
              <span className="badge bg-scarlet-light text-scarlet mt-1">
                Class of {alumni.graduationYear}
              </span>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-1.5 flex-1">
          {(alumni.currentJobTitle || alumni.currentEmployer) && (
            <div className="flex items-start gap-2 text-sm text-ohio-gray">
              <Briefcase size={14} className="flex-shrink-0 mt-0.5 text-scarlet" />
              <span className="truncate">
                {[alumni.currentJobTitle, alumni.currentEmployer].filter(Boolean).join(' · ')}
              </span>
            </div>
          )}
          {alumni.location && (
            <div className="flex items-center gap-2 text-sm text-ohio-gray">
              <MapPin size={14} className="flex-shrink-0 text-scarlet" />
              <span className="truncate">{alumni.location}</span>
            </div>
          )}
          {alumni.degreeEarned && (
            <div className="flex items-center gap-2 text-sm text-ohio-gray">
              <GraduationCap size={14} className="flex-shrink-0 text-scarlet" />
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
      </div>
    </Link>
  );
}
