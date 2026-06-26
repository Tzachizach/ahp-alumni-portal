import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Alumni } from '@/lib/types';
import { computeCompleteness } from '@/lib/profileCompleteness';

/**
 * Shows the user how many of their 6 essential profile fields are filled.
 * Rendered ONLY on the user's own profile / edit page — never visible to
 * other alumni viewing their profile.
 */
export default function ProfileCompletenessBar({ alumni }: { alumni: Alumni }) {
  const { filled, total, missing, pct, isComplete } = computeCompleteness(alumni);

  return (
    <div
      className={`card mb-6 ${
        isComplete
          ? 'border-green-200 bg-green-50/40'
          : 'border-scarlet-light bg-scarlet-light/30'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        {isComplete ? (
          <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" aria-hidden="true" />
        ) : (
          <AlertCircle size={20} className="text-scarlet flex-shrink-0" aria-hidden="true" />
        )}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-ohio-gray-dark text-sm">
            {isComplete ? 'Your profile is complete!' : 'Your profile'}
          </p>
          <p className="text-xs text-ohio-gray">
            {filled} of {total} essentials filled
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div
        className="h-2 bg-white rounded-full overflow-hidden border border-ohio-gray-medium"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={filled}
        aria-label={`Profile completeness: ${filled} of ${total} essential fields filled`}
      >
        <div
          className={`h-full transition-all duration-500 ${isComplete ? 'bg-green-600' : 'bg-scarlet'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {!isComplete && missing.length > 0 && (
        <p className="text-xs text-ohio-gray-dark mt-3">
          <span className="font-medium">Still missing:</span>{' '}
          {missing.join(', ')}.
        </p>
      )}
    </div>
  );
}
