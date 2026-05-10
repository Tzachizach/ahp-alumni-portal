/**
 * US states / DC reference data.
 *
 * - `STATE_FIPS_TO_CODE` maps numeric FIPS codes (the IDs used by the
 *   us-atlas TopoJSON) to two-letter postal codes.
 * - `STATE_CODE_TO_NAME` maps the postal code to the human-readable name.
 * - `STATE_NAME_TO_CODE` lets us recognize alumni location strings that
 *   spell out the full state name ("California" rather than "CA").
 */

export const STATE_FIPS_TO_CODE: Record<string, string> = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA',
  '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL',
  '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN',
  '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME',
  '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS',
  '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
  '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND',
  '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
  '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT',
  '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI',
  '56': 'WY',
};

export const STATE_CODE_TO_NAME: Record<string, string> = {
  AL: 'Alabama',     AK: 'Alaska',         AZ: 'Arizona',
  AR: 'Arkansas',    CA: 'California',     CO: 'Colorado',
  CT: 'Connecticut', DE: 'Delaware',       DC: 'District of Columbia',
  FL: 'Florida',     GA: 'Georgia',        HI: 'Hawaii',
  ID: 'Idaho',       IL: 'Illinois',       IN: 'Indiana',
  IA: 'Iowa',        KS: 'Kansas',         KY: 'Kentucky',
  LA: 'Louisiana',   ME: 'Maine',          MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan',     MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri',       MT: 'Montana',
  NE: 'Nebraska',    NV: 'Nevada',         NH: 'New Hampshire',
  NJ: 'New Jersey',  NM: 'New Mexico',     NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
  OK: 'Oklahoma',    OR: 'Oregon',         PA: 'Pennsylvania',
  RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota',
  TN: 'Tennessee',   TX: 'Texas',          UT: 'Utah',
  VT: 'Vermont',     VA: 'Virginia',       WA: 'Washington',
  WV: 'West Virginia', WI: 'Wisconsin',    WY: 'Wyoming',
};

// Reverse lookup: full name (case-insensitive) → 2-letter code.
export const STATE_NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_CODE_TO_NAME).map(([code, name]) => [name.toLowerCase(), code])
);

const VALID_CODES = new Set(Object.keys(STATE_CODE_TO_NAME));

/**
 * Extract a US state code from a free-form location string.
 *
 * Recognized patterns:
 *   "Atlanta, GA"        -> "GA"
 *   "Atlanta, Georgia"   -> "GA"
 *   "Cleveland, Ohio"    -> "OH"
 *   "California"         -> "CA"
 *   "NY"                 -> "NY"
 *
 * Returns null for non-US, "Remote", empty, or unrecognizable strings.
 */
export function parseStateCode(location: string | null | undefined): string | null {
  if (!location) return null;
  const trimmed = location.trim();
  if (!trimmed) return null;

  // Quick reject for obvious non-locations.
  const lower = trimmed.toLowerCase();
  if (lower === 'remote' || lower === 'n/a' || lower === 'unknown') return null;

  // Try "..., XX" (postal code at end after a comma).
  const postalMatch = trimmed.match(/,\s*([A-Z]{2})\s*$/);
  if (postalMatch && VALID_CODES.has(postalMatch[1])) {
    return postalMatch[1];
  }

  // Try "..., Full State Name" at end after a comma.
  const lastSegment = trimmed.split(',').pop()?.trim().toLowerCase() || '';
  if (lastSegment && STATE_NAME_TO_CODE[lastSegment]) {
    return STATE_NAME_TO_CODE[lastSegment];
  }

  // Try the whole string as a state code or state name.
  if (VALID_CODES.has(trimmed.toUpperCase())) return trimmed.toUpperCase();
  if (STATE_NAME_TO_CODE[lower]) return STATE_NAME_TO_CODE[lower];

  return null;
}
