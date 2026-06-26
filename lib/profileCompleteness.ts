import { Alumni } from './types';

/**
 * Essential profile fields used to compute completeness. Six items chosen
 * with the program director:
 *   - Photo, Phone, Location, LinkedIn, Current Job Title, Current Employer
 *
 * Sentimental fields (memories, advice for students) are intentionally
 * excluded — they're optional flavor, not "completeness."
 */
export const ESSENTIAL_FIELDS: Array<{
  label: string;
  isFilled: (a: Alumni) => boolean;
}> = [
  { label: 'Profile photo',    isFilled: (a) => !!a.profilePhoto },
  { label: 'Phone number',     isFilled: (a) => !!a.phone?.trim() },
  { label: 'Location',         isFilled: (a) => !!a.location?.trim() },
  { label: 'LinkedIn URL',     isFilled: (a) => !!a.linkedIn?.trim() },
  { label: 'Current job title', isFilled: (a) => !!a.currentJobTitle?.trim() },
  { label: 'Current employer',  isFilled: (a) => !!a.currentEmployer?.trim() },
];

export interface CompletenessResult {
  filled: number;
  total: number;
  missing: string[];
  pct: number;
  isComplete: boolean;
}

export function computeCompleteness(alumni: Alumni): CompletenessResult {
  const missing: string[] = [];
  let filled = 0;
  for (const field of ESSENTIAL_FIELDS) {
    if (field.isFilled(alumni)) filled += 1;
    else missing.push(field.label);
  }
  const total = ESSENTIAL_FIELDS.length;
  return {
    filled,
    total,
    missing,
    pct: Math.round((filled / total) * 100),
    isComplete: filled === total,
  };
}
