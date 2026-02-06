import type { POIWithDistance } from '@/lib/geo-utils';

interface HudOverlayProps {
  pois: POIWithDistance[];
  maxDistanceMiles: number;
  onPinSelect?: (poi: POIWithDistance) => void;
}

interface BrandMark {
  match: RegExp;
  label: string;
  icon: string;
  slug?: string;
}

const SIMPLE_ICON_BASE = 'https://cdn.simpleicons.org';

const BRAND_MARKS: BrandMark[] = [
  { match: /pilot/i, label: 'PILOT', icon: 'P', slug: 'pilot' },
  { match: /love'?s/i, label: 'LOVES', icon: 'L', slug: 'loves' },
  { match: /\bta\b|travel center|travelcenters/i, label: 'TA', icon: 'TA', slug: 'ta' },
  { match: /petro/i, label: 'PETRO', icon: 'PR', slug: 'petro' },
  { match: /flying\s*j/i, label: 'FLYING J', icon: 'FJ', slug: 'flyingj' },
  { match: /rest\s*area|rest\s*stop/i, label: 'REST', icon: 'R', slug: 'googlemaps' },
  { match: /parking/i, label: 'PARK', icon: 'P', slug: 'parking' },
  { match: /fuel|gas/i, label: 'FUEL', icon: 'F', slug: 'shell' },
  { match: /food|cafe|coffee|restaurant/i, label: 'FOOD', icon: 'FO', slug: 'mcdonalds' },
  { match: /scale/i, label: 'SCALE', icon: 'S', slug: 'weighstation' },
  { match: /weigh/i, label: 'WEIGH', icon: 'W', slug: 'weighstation' },
];

const MIN_PIN_SIZE = 36;
const MAX_PIN_SIZE = 64;
const PIN_FADE_START = 16;
const PIN_FADE_END = 28;

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

function getBrandIcon(name: string) {
  const normalized = name || '';
  const match = BRAND_MARKS.find(entry => entry.match.test(normalized));
  if (match?.icon) return match.icon;
  const fallback = normalized.trim().split(/\s+/)[0];
  return fallback ? fallback.slice(0, 2).toUpperCase() : 'POI';
}

function getBrandIconUrl(name: string) {
  const normalized = name || '';
  const match = BRAND_MARKS.find(entry => entry.match.test(normalized));
  if (!match?.slug) return null;
  return `${SIMPLE_ICON_BASE}/${match.slug}/ffffff`;
}

function getPinSize(distanceMiles: number, maxDistanceMiles: number) {
  const safeMax = Math.max(maxDistanceMiles, 1);
  const ratio = clamp(distanceMiles / safeMax, 0, 1);
  const size = MAX_PIN_SIZE - ratio * (MAX_PIN_SIZE - MIN_PIN_SIZE);
  return clamp(size, MIN_PIN_SIZE, MAX_PIN_SIZE);
}

function getPinColor(distanceMiles: number) {
  if (distanceMiles <= 5) {
    return { fill: '#1fd26a', glow: 'rgba(31, 210, 106, 0.45)' };
  }
  if (distanceMiles >= 15) {
    return { fill: '#f44336', glow: 'rgba(244, 67, 54, 0.5)' };
  }
  return { fill: '#f4c038', glow: 'rgba(244, 192, 56, 0.5)' };
}

function getPinPosition(poi: POIWithDistance, maxDistanceMiles: number) {
  const safeMax = Math.max(maxDistanceMiles, 1);
  const distanceRatio = clamp(poi.distanceMiles / safeMax, 0, 1);
  const bearing = poi.relativeBearing ?? 0;
  const limitedBearing = clamp(bearing, -90, 90);
  const nearFactor = 1 - distanceRatio;
  const lateralSpread = 18 + nearFactor * 46;
  const xOffset = (limitedBearing / 90) * lateralSpread;
  const yOffset = 14 + Math.pow(nearFactor, 0.7) * 70;

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
        const icon = getBrandIcon(poi.name);
        const iconUrl = getBrandIconUrl(poi.name);
        const color = getPinColor(poi.distanceMiles);
        const fadeRatio = clamp((poi.distanceMiles - PIN_FADE_START) / (PIN_FADE_END - PIN_FADE_START), 0, 1);
        const opacity = 1 - fadeRatio;
        const headSize = size;
        const tailHeight = size * 0.9;

        return (
          <button
            key={poi.id}
            type="button"
            onClick={onPinSelect ? () => onPinSelect(poi) : undefined}
            className="pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-200 ease-out"
            style={{
              width: `${headSize}px`,
              height: `${headSize + tailHeight}px`,
              ...position,
              opacity,
            }}
            aria-label={poi.name}
          >
            <div className="relative flex h-full w-full flex-col items-center">
              <div
                className="relative flex items-center justify-center rounded-full border border-black/20 text-[10px] font-semibold text-slate-900 shadow-[0_8px_16px_rgba(0,0,0,0.25)]"
                style={{
                  width: `${headSize}px`,
                  height: `${headSize}px`,
                  background: color.fill,
                  boxShadow: `0 0 18px ${color.glow}`,
                }}
              >
                <div className="absolute -top-2 text-[9px] font-semibold tracking-[0.18em] text-white/80">
                  {label}
                </div>
                <div className="relative flex h-[58%] w-[58%] items-center justify-center rounded-full bg-white/95 text-[11px] font-bold text-slate-900 shadow-inner">
                  {iconUrl && (
                    <img
                      src={iconUrl}
                      alt=""
                      className="h-6 w-6 object-contain"
                      onLoad={(event) => {
                        const fallback = event.currentTarget.parentElement?.querySelector('span');
                        if (fallback instanceof HTMLElement) {
                          fallback.style.opacity = '0';
                        }
                      }}
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <span className="absolute text-[11px] font-bold text-slate-900/80">{icon}</span>
                </div>
              </div>
              <div
                className="-mt-1 w-[32%] rounded-b-full"
                style={{
                  height: `${tailHeight}px`,
                  background: `linear-gradient(180deg, ${color.fill} 0%, rgba(0,0,0,0.2) 100%)`,
                  clipPath: 'polygon(50% 0%, 100% 45%, 64% 100%, 36% 100%, 0% 45%)',
                  filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.25))',
                }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
