/**
 * Curated lookup of common US cities to lat/lng (decimal degrees).
 *
 * Used to plot city-level dots on the alumni Locations map. Cities not
 * in this table simply don't get a dot — they still count toward the
 * state-level choropleth via parseStateCode().
 *
 * Coverage goal: top US population centers, all state capitals, and
 * major Ohio cities (Ohio State alumni concentration). Roughly 200
 * entries, optimized for white-collar / professional alumni.
 *
 * Lookup is case-insensitive and tolerant of common punctuation
 * differences ("St. Louis" vs "Saint Louis" vs "St Louis"). See
 * lookupCity() below.
 */

export interface CityCoord {
  city: string; // canonical display form
  state: string; // 2-letter postal code
  lat: number;
  lng: number;
}

const RAW_CITIES: CityCoord[] = [
  // Ohio (Ohio State country)
  { city: 'Columbus', state: 'OH', lat: 39.961, lng: -82.999 },
  { city: 'Cleveland', state: 'OH', lat: 41.499, lng: -81.694 },
  { city: 'Cincinnati', state: 'OH', lat: 39.103, lng: -84.512 },
  { city: 'Akron', state: 'OH', lat: 41.082, lng: -81.519 },
  { city: 'Dayton', state: 'OH', lat: 39.759, lng: -84.192 },
  { city: 'Toledo', state: 'OH', lat: 41.664, lng: -83.555 },
  { city: 'Youngstown', state: 'OH', lat: 41.099, lng: -80.649 },
  { city: 'Canton', state: 'OH', lat: 40.799, lng: -81.378 },
  { city: 'Dublin', state: 'OH', lat: 40.099, lng: -83.114 },
  { city: 'Westerville', state: 'OH', lat: 40.126, lng: -82.929 },
  { city: 'Hilliard', state: 'OH', lat: 40.034, lng: -83.159 },
  { city: 'Worthington', state: 'OH', lat: 40.094, lng: -83.018 },
  { city: 'Upper Arlington', state: 'OH', lat: 40.022, lng: -83.072 },

  // New York
  { city: 'New York', state: 'NY', lat: 40.713, lng: -74.006 },
  { city: 'Brooklyn', state: 'NY', lat: 40.678, lng: -73.944 },
  { city: 'Queens', state: 'NY', lat: 40.728, lng: -73.794 },
  { city: 'Buffalo', state: 'NY', lat: 42.886, lng: -78.879 },
  { city: 'Rochester', state: 'NY', lat: 43.156, lng: -77.609 },
  { city: 'Syracuse', state: 'NY', lat: 43.048, lng: -76.147 },
  { city: 'Albany', state: 'NY', lat: 42.652, lng: -73.756 },
  { city: 'White Plains', state: 'NY', lat: 41.034, lng: -73.763 },

  // California
  { city: 'Los Angeles', state: 'CA', lat: 34.052, lng: -118.244 },
  { city: 'San Francisco', state: 'CA', lat: 37.775, lng: -122.419 },
  { city: 'San Diego', state: 'CA', lat: 32.716, lng: -117.161 },
  { city: 'San Jose', state: 'CA', lat: 37.339, lng: -121.895 },
  { city: 'Sacramento', state: 'CA', lat: 38.582, lng: -121.494 },
  { city: 'Oakland', state: 'CA', lat: 37.804, lng: -122.271 },
  { city: 'Long Beach', state: 'CA', lat: 33.770, lng: -118.194 },
  { city: 'Fresno', state: 'CA', lat: 36.738, lng: -119.787 },
  { city: 'Anaheim', state: 'CA', lat: 33.836, lng: -117.914 },
  { city: 'Berkeley', state: 'CA', lat: 37.872, lng: -122.273 },
  { city: 'Pasadena', state: 'CA', lat: 34.148, lng: -118.144 },
  { city: 'Palo Alto', state: 'CA', lat: 37.442, lng: -122.143 },
  { city: 'Santa Monica', state: 'CA', lat: 34.020, lng: -118.491 },
  { city: 'Santa Clara', state: 'CA', lat: 37.354, lng: -121.955 },
  { city: 'Mountain View', state: 'CA', lat: 37.386, lng: -122.084 },
  { city: 'Irvine', state: 'CA', lat: 33.685, lng: -117.826 },
  { city: 'Beverly Hills', state: 'CA', lat: 34.073, lng: -118.400 },
  { city: 'Burbank', state: 'CA', lat: 34.181, lng: -118.309 },

  // Texas
  { city: 'Houston', state: 'TX', lat: 29.760, lng: -95.370 },
  { city: 'Dallas', state: 'TX', lat: 32.776, lng: -96.797 },
  { city: 'Austin', state: 'TX', lat: 30.267, lng: -97.743 },
  { city: 'San Antonio', state: 'TX', lat: 29.424, lng: -98.494 },
  { city: 'Fort Worth', state: 'TX', lat: 32.755, lng: -97.330 },
  { city: 'El Paso', state: 'TX', lat: 31.762, lng: -106.485 },
  { city: 'Plano', state: 'TX', lat: 33.019, lng: -96.698 },
  { city: 'Frisco', state: 'TX', lat: 33.150, lng: -96.823 },
  { city: 'Arlington', state: 'TX', lat: 32.736, lng: -97.108 },

  // Illinois
  { city: 'Chicago', state: 'IL', lat: 41.878, lng: -87.629 },
  { city: 'Naperville', state: 'IL', lat: 41.748, lng: -88.157 },
  { city: 'Aurora', state: 'IL', lat: 41.760, lng: -88.320 },
  { city: 'Springfield', state: 'IL', lat: 39.781, lng: -89.650 },
  { city: 'Evanston', state: 'IL', lat: 42.045, lng: -87.688 },

  // Florida
  { city: 'Miami', state: 'FL', lat: 25.762, lng: -80.192 },
  { city: 'Tampa', state: 'FL', lat: 27.951, lng: -82.458 },
  { city: 'Orlando', state: 'FL', lat: 28.538, lng: -81.379 },
  { city: 'Jacksonville', state: 'FL', lat: 30.332, lng: -81.656 },
  { city: 'Fort Lauderdale', state: 'FL', lat: 26.122, lng: -80.143 },
  { city: 'St. Petersburg', state: 'FL', lat: 27.768, lng: -82.640 },
  { city: 'Naples', state: 'FL', lat: 26.142, lng: -81.794 },
  { city: 'Sarasota', state: 'FL', lat: 27.336, lng: -82.531 },
  { city: 'Tallahassee', state: 'FL', lat: 30.438, lng: -84.281 },

  // Georgia
  { city: 'Atlanta', state: 'GA', lat: 33.749, lng: -84.388 },
  { city: 'Athens', state: 'GA', lat: 33.961, lng: -83.378 },
  { city: 'Augusta', state: 'GA', lat: 33.474, lng: -82.011 },
  { city: 'Savannah', state: 'GA', lat: 32.084, lng: -81.099 },
  { city: 'Marietta', state: 'GA', lat: 33.953, lng: -84.547 },

  // Pennsylvania
  { city: 'Philadelphia', state: 'PA', lat: 39.953, lng: -75.165 },
  { city: 'Pittsburgh', state: 'PA', lat: 40.441, lng: -79.996 },
  { city: 'Harrisburg', state: 'PA', lat: 40.273, lng: -76.886 },
  { city: 'Allentown', state: 'PA', lat: 40.609, lng: -75.491 },

  // Massachusetts
  { city: 'Boston', state: 'MA', lat: 42.360, lng: -71.058 },
  { city: 'Cambridge', state: 'MA', lat: 42.373, lng: -71.110 },
  { city: 'Worcester', state: 'MA', lat: 42.263, lng: -71.802 },

  // DC + DMV
  { city: 'Washington', state: 'DC', lat: 38.907, lng: -77.037 },
  { city: 'Arlington', state: 'VA', lat: 38.880, lng: -77.108 },
  { city: 'Alexandria', state: 'VA', lat: 38.805, lng: -77.047 },
  { city: 'McLean', state: 'VA', lat: 38.934, lng: -77.178 },
  { city: 'Reston', state: 'VA', lat: 38.958, lng: -77.357 },
  { city: 'Bethesda', state: 'MD', lat: 38.984, lng: -77.094 },
  { city: 'Silver Spring', state: 'MD', lat: 38.991, lng: -77.026 },
  { city: 'Baltimore', state: 'MD', lat: 39.290, lng: -76.612 },
  { city: 'Annapolis', state: 'MD', lat: 38.979, lng: -76.492 },
  { city: 'Richmond', state: 'VA', lat: 37.541, lng: -77.434 },
  { city: 'Norfolk', state: 'VA', lat: 36.846, lng: -76.286 },
  { city: 'Virginia Beach', state: 'VA', lat: 36.853, lng: -75.978 },

  // North Carolina / South Carolina
  { city: 'Charlotte', state: 'NC', lat: 35.227, lng: -80.843 },
  { city: 'Raleigh', state: 'NC', lat: 35.779, lng: -78.638 },
  { city: 'Durham', state: 'NC', lat: 35.994, lng: -78.899 },
  { city: 'Greensboro', state: 'NC', lat: 36.073, lng: -79.792 },
  { city: 'Winston-Salem', state: 'NC', lat: 36.100, lng: -80.244 },
  { city: 'Charleston', state: 'SC', lat: 32.776, lng: -79.931 },
  { city: 'Columbia', state: 'SC', lat: 34.001, lng: -81.035 },
  { city: 'Greenville', state: 'SC', lat: 34.852, lng: -82.394 },

  // Tennessee
  { city: 'Nashville', state: 'TN', lat: 36.162, lng: -86.781 },
  { city: 'Memphis', state: 'TN', lat: 35.149, lng: -90.049 },
  { city: 'Knoxville', state: 'TN', lat: 35.961, lng: -83.921 },
  { city: 'Chattanooga', state: 'TN', lat: 35.046, lng: -85.310 },

  // Colorado
  { city: 'Denver', state: 'CO', lat: 39.739, lng: -104.990 },
  { city: 'Boulder', state: 'CO', lat: 40.015, lng: -105.271 },
  { city: 'Colorado Springs', state: 'CO', lat: 38.834, lng: -104.821 },
  { city: 'Aurora', state: 'CO', lat: 39.729, lng: -104.832 },

  // Pacific Northwest
  { city: 'Seattle', state: 'WA', lat: 47.606, lng: -122.332 },
  { city: 'Bellevue', state: 'WA', lat: 47.610, lng: -122.201 },
  { city: 'Spokane', state: 'WA', lat: 47.658, lng: -117.426 },
  { city: 'Tacoma', state: 'WA', lat: 47.253, lng: -122.444 },
  { city: 'Portland', state: 'OR', lat: 45.515, lng: -122.679 },
  { city: 'Eugene', state: 'OR', lat: 44.052, lng: -123.087 },
  { city: 'Salem', state: 'OR', lat: 44.943, lng: -123.035 },

  // Arizona / Nevada / Utah
  { city: 'Phoenix', state: 'AZ', lat: 33.448, lng: -112.074 },
  { city: 'Tucson', state: 'AZ', lat: 32.222, lng: -110.926 },
  { city: 'Mesa', state: 'AZ', lat: 33.416, lng: -111.832 },
  { city: 'Scottsdale', state: 'AZ', lat: 33.494, lng: -111.926 },
  { city: 'Tempe', state: 'AZ', lat: 33.425, lng: -111.940 },
  { city: 'Chandler', state: 'AZ', lat: 33.306, lng: -111.842 },
  { city: 'Las Vegas', state: 'NV', lat: 36.170, lng: -115.139 },
  { city: 'Reno', state: 'NV', lat: 39.530, lng: -119.815 },
  { city: 'Salt Lake City', state: 'UT', lat: 40.760, lng: -111.891 },
  { city: 'Provo', state: 'UT', lat: 40.234, lng: -111.659 },
  { city: 'Albuquerque', state: 'NM', lat: 35.085, lng: -106.651 },
  { city: 'Santa Fe', state: 'NM', lat: 35.687, lng: -105.938 },

  // New Jersey
  { city: 'Newark', state: 'NJ', lat: 40.736, lng: -74.172 },
  { city: 'Jersey City', state: 'NJ', lat: 40.728, lng: -74.078 },
  { city: 'Hoboken', state: 'NJ', lat: 40.743, lng: -74.033 },
  { city: 'Princeton', state: 'NJ', lat: 40.349, lng: -74.659 },

  // Connecticut / RI / NH / VT / ME
  { city: 'Hartford', state: 'CT', lat: 41.764, lng: -72.685 },
  { city: 'New Haven', state: 'CT', lat: 41.308, lng: -72.928 },
  { city: 'Stamford', state: 'CT', lat: 41.053, lng: -73.539 },
  { city: 'Greenwich', state: 'CT', lat: 41.027, lng: -73.629 },
  { city: 'Providence', state: 'RI', lat: 41.824, lng: -71.413 },
  { city: 'Manchester', state: 'NH', lat: 42.996, lng: -71.455 },
  { city: 'Burlington', state: 'VT', lat: 44.476, lng: -73.213 },
  { city: 'Portland', state: 'ME', lat: 43.661, lng: -70.255 },

  // Michigan / Indiana / Wisconsin / Minnesota
  { city: 'Detroit', state: 'MI', lat: 42.331, lng: -83.046 },
  { city: 'Ann Arbor', state: 'MI', lat: 42.281, lng: -83.743 },
  { city: 'Grand Rapids', state: 'MI', lat: 42.964, lng: -85.668 },
  { city: 'Lansing', state: 'MI', lat: 42.733, lng: -84.555 },
  { city: 'Indianapolis', state: 'IN', lat: 39.768, lng: -86.158 },
  { city: 'Bloomington', state: 'IN', lat: 39.166, lng: -86.526 },
  { city: 'Fort Wayne', state: 'IN', lat: 41.080, lng: -85.139 },
  { city: 'Milwaukee', state: 'WI', lat: 43.038, lng: -87.906 },
  { city: 'Madison', state: 'WI', lat: 43.073, lng: -89.401 },
  { city: 'Minneapolis', state: 'MN', lat: 44.978, lng: -93.265 },
  { city: 'St. Paul', state: 'MN', lat: 44.954, lng: -93.090 },

  // Kentucky / Missouri / Kansas
  { city: 'Louisville', state: 'KY', lat: 38.253, lng: -85.759 },
  { city: 'Lexington', state: 'KY', lat: 38.040, lng: -84.504 },
  { city: 'St. Louis', state: 'MO', lat: 38.627, lng: -90.199 },
  { city: 'Kansas City', state: 'MO', lat: 39.099, lng: -94.578 },
  { city: 'Springfield', state: 'MO', lat: 37.209, lng: -93.292 },
  { city: 'Kansas City', state: 'KS', lat: 39.115, lng: -94.627 },
  { city: 'Wichita', state: 'KS', lat: 37.687, lng: -97.330 },
  { city: 'Overland Park', state: 'KS', lat: 38.982, lng: -94.671 },

  // Oklahoma / Louisiana / Arkansas / Mississippi / Alabama
  { city: 'Oklahoma City', state: 'OK', lat: 35.473, lng: -97.520 },
  { city: 'Tulsa', state: 'OK', lat: 36.154, lng: -95.993 },
  { city: 'New Orleans', state: 'LA', lat: 29.951, lng: -90.071 },
  { city: 'Baton Rouge', state: 'LA', lat: 30.451, lng: -91.187 },
  { city: 'Little Rock', state: 'AR', lat: 34.746, lng: -92.289 },
  { city: 'Bentonville', state: 'AR', lat: 36.373, lng: -94.209 },
  { city: 'Jackson', state: 'MS', lat: 32.299, lng: -90.185 },
  { city: 'Birmingham', state: 'AL', lat: 33.521, lng: -86.802 },
  { city: 'Huntsville', state: 'AL', lat: 34.730, lng: -86.586 },
  { city: 'Montgomery', state: 'AL', lat: 32.366, lng: -86.299 },
  { city: 'Mobile', state: 'AL', lat: 30.695, lng: -88.040 },

  // Iowa / Nebraska / Dakotas / Plains
  { city: 'Des Moines', state: 'IA', lat: 41.587, lng: -93.625 },
  { city: 'Iowa City', state: 'IA', lat: 41.661, lng: -91.530 },
  { city: 'Cedar Rapids', state: 'IA', lat: 41.978, lng: -91.665 },
  { city: 'Omaha', state: 'NE', lat: 41.257, lng: -95.934 },
  { city: 'Lincoln', state: 'NE', lat: 40.806, lng: -96.681 },
  { city: 'Sioux Falls', state: 'SD', lat: 43.546, lng: -96.731 },
  { city: 'Fargo', state: 'ND', lat: 46.877, lng: -96.789 },
  { city: 'Bismarck', state: 'ND', lat: 46.808, lng: -100.784 },
  { city: 'Billings', state: 'MT', lat: 45.787, lng: -108.500 },
  { city: 'Cheyenne', state: 'WY', lat: 41.140, lng: -104.820 },
  { city: 'Boise', state: 'ID', lat: 43.615, lng: -116.202 },

  // Far-flung
  { city: 'Anchorage', state: 'AK', lat: 61.218, lng: -149.900 },
  { city: 'Honolulu', state: 'HI', lat: 21.307, lng: -157.858 },

  // Other state capitals / mid-size
  { city: 'Wilmington', state: 'DE', lat: 39.745, lng: -75.547 },
  { city: 'Charleston', state: 'WV', lat: 38.336, lng: -81.612 },
];

/** Normalize a city name for tolerant lookup. */
function normalizeCity(name: string): string {
  return name
    .toLowerCase()
    .replace(/\bsaint\b/g, 'st')
    .replace(/\bst\.?\b/g, 'st')
    .replace(/\bft\.?\b/g, 'fort')
    .replace(/[.'`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Build a key -> coord index. Key is "normalizedCity|STATE".
const CITY_INDEX: Record<string, CityCoord> = (() => {
  const idx: Record<string, CityCoord> = {};
  for (const c of RAW_CITIES) {
    idx[`${normalizeCity(c.city)}|${c.state}`] = c;
  }
  return idx;
})();

/**
 * Look up lat/lng for a "City, ST" or "City, State Name" string.
 * Returns null if the city isn't in our curated list (the location
 * still counts toward the state-level choropleth).
 *
 * `stateCode` is the already-parsed 2-letter state code from
 * parseStateCode() — pass it in to avoid re-parsing.
 */
export function lookupCity(
  location: string | null | undefined,
  stateCode: string | null
): CityCoord | null {
  if (!location || !stateCode) return null;
  // Take everything before the last comma as the city.
  const lastComma = location.lastIndexOf(',');
  const cityRaw = lastComma === -1 ? location : location.slice(0, lastComma);
  const key = `${normalizeCity(cityRaw)}|${stateCode}`;
  return CITY_INDEX[key] ?? null;
}
