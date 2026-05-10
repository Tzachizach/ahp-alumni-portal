'use client';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { STATE_FIPS_TO_CODE, STATE_CODE_TO_NAME } from '@/lib/usStates';

// Albers-USA projection topojson with Hawaii and Alaska repositioned
// next to the lower 48 (the standard "Albers USA" view).
const US_GEO_URL =
  'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

interface Props {
  /** Map of state code -> alumni count. */
  countsByState: Record<string, number>;
  /** Currently hovered state code (or null). */
  hoveredState: string | null;
  /** Currently selected/locked state code (or null). */
  selectedState: string | null;
  onHover: (stateCode: string | null) => void;
  onSelect: (stateCode: string | null) => void;
}

/**
 * Lerp from a near-white pink (#FCE7E7) to scarlet (#BB0000) using a
 * log scale on `count` so a state with 50 alumni doesn't completely
 * dominate one with 5.
 */
function colorForCount(count: number, max: number): string {
  if (count === 0) return '#F5F5F5';
  if (max <= 0) return '#F5F5F5';
  const t = Math.min(1, Math.log(count + 1) / Math.log(max + 1));
  const r = Math.round(252 + (187 - 252) * t);
  const g = Math.round(231 + (0 - 231) * t);
  const b = Math.round(231 + (0 - 231) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

export default function UsLocationMap({
  countsByState,
  hoveredState,
  selectedState,
  onHover,
  onSelect,
}: Props) {
  const max = Math.max(0, ...Object.values(countsByState));

  return (
    <div className="w-full" role="img" aria-label="Map of the United States showing alumni distribution by state">
      <ComposableMap
        projection="geoAlbersUsa"
        projectionConfig={{ scale: 1000 }}
        width={975}
        height={610}
        style={{ width: '100%', height: 'auto' }}
      >
        <Geographies geography={US_GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const fips = String(geo.id).padStart(2, '0');
              const code = STATE_FIPS_TO_CODE[fips];
              const count = (code && countsByState[code]) || 0;
              const stateName = (code && STATE_CODE_TO_NAME[code]) || geo.properties.name || 'Unknown';
              const isHovered = code !== undefined && code === hoveredState;
              const isSelected = code !== undefined && code === selectedState;
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={colorForCount(count, max)}
                  stroke={isSelected ? '#BB0000' : '#FFFFFF'}
                  strokeWidth={isSelected ? 2 : 0.75}
                  onMouseEnter={() => onHover(code ?? null)}
                  onMouseLeave={() => onHover(null)}
                  onClick={() => onSelect(code ?? null)}
                  style={{
                    default: { outline: 'none', cursor: code ? 'pointer' : 'default' },
                    hover: {
                      outline: 'none',
                      fill: count > 0 ? '#BB0000' : '#E0E0E0',
                      cursor: code ? 'pointer' : 'default',
                    },
                    pressed: { outline: 'none' },
                  }}
                  // Native title shows on hover for sighted users; full info
                  // lives in the side panel.
                  aria-label={
                    count === 0
                      ? `${stateName}: no alumni`
                      : `${stateName}: ${count} ${count === 1 ? 'alum' : 'alumni'}${
                          isHovered || isSelected ? ' (selected)' : ''
                        }`
                  }
                >
                  <title>
                    {stateName}
                    {count > 0 ? ` — ${count} ${count === 1 ? 'alum' : 'alumni'}` : ''}
                  </title>
                </Geography>
              );
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
}
