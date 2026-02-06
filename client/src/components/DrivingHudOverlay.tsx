import type { POIWithDistance } from '@/lib/geo-utils';

interface HudOverlayProps {
  pois: POIWithDistance[];
  maxDistanceMiles: number;
  onPinSelect?: (poi: POIWithDistance) => void;
}

const BRAND_MARKS: Array<{ match: RegExp; label: string }> = [
  { match: /love'?s/i, label: 'LOVES' },
  { match: /pilot/i, label: 'PILOT' },
  { match: /\bta\b|travel center|travelcenters/i, label: 'TA' },
];

const MIN_PIN_SIZE = 28;
const MAX_PIN_SIZE = 44;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getBrandLabel(name: string) {
  const normalized = name || '';
  const match = BRAND_MARKS.find(entry => entry.match.test(normalized));
  if (match) return match.label;
  const fallback = normalized.trim().split(/\s+/).slice(0, 2).join(' ');
  return fallback ? fallback.toUpperCase() : 'POI';
}

function getPinSize(distanceMiles: number, maxDistanceMiles: number) {
  const safeMax = Math.max(maxDistanceMiles, 1);
  const ratio = clamp(distanceMiles / safeMax, 0, 1);
  const size = MAX_PIN_SIZE - ratio * (MAX_PIN_SIZE - MIN_PIN_SIZE);
  return clamp(size, MIN_PIN_SIZE, MAX_PIN_SIZE);
}

function getPinPosition(poi: POIWithDistance, maxDistanceMiles: number) {
  const safeMax = Math.max(maxDistanceMiles, 1);
  const distanceRatio = clamp(poi.distanceMiles / safeMax, 0, 1);
  const bearing = poi.relativeBearing ?? 0;
  const limitedBearing = clamp(bearing, -90, 90);
  const xOffset = (limitedBearing / 90) * 40;
  const yOffset = 12 + distanceRatio * 68;

  return {
    left: `${50 + xOffset}%`,
    top: `${yOffset}%`,
  };
}

export function DrivingHudOverlay({ pois, maxDistanceMiles, onPinSelect }: HudOverlayProps) {
  if (!pois.length) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {pois.map(poi => {
        const size = getPinSize(poi.distanceMiles, maxDistanceMiles);
        const position = getPinPosition(poi, maxDistanceMiles);
        const label = getBrandLabel(poi.name);

        return (
          <button
            key={poi.id}
            type="button"
            onClick={onPinSelect ? () => onPinSelect(poi) : undefined}
            className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/10 bg-white/90 text-[10px] font-semibold text-slate-800 shadow-sm transition-transform transition-opacity duration-200 ease-out"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              ...position,
            }}
            aria-label={poi.name}
          >
            <span className="block px-1 leading-none">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
