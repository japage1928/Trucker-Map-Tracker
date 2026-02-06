export interface AiPoiSummary {
  name: string;
  distanceMiles: number;
  facilityKind?: string;
}

export interface AiContext {
  drivingState: 'driving' | 'stopped' | 'unknown';
  speedMph: number | null;
  position: { lat: number; lng: number } | null;
  upcomingPois: AiPoiSummary[];
  nextStopEtaMinutes: number | null;
  traffic: { status: 'unavailable' };
  roadConditions: { status: 'unavailable' };
}

interface BuildAiContextInput {
  speedMph: number | null;
  position: { lat: number; lng: number } | null;
  upcomingPois: AiPoiSummary[];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getDrivingState(speedMph: number | null) {
  if (speedMph === null) return 'unknown';
  if (speedMph <= 1) return 'stopped';
  return 'driving';
}

export function buildAiContext(input: BuildAiContextInput): AiContext {
  const drivingState = getDrivingState(input.speedMph);
  const nextStop = input.upcomingPois[0];
  const speedMph = input.speedMph;
  const canEstimateEta = Boolean(nextStop) && speedMph !== null && speedMph > 1;
  const rawEta = canEstimateEta && nextStop
    ? (nextStop.distanceMiles / speedMph) * 60
    : null;
  const nextStopEtaMinutes = rawEta !== null ? Math.round(clamp(rawEta, 1, 24 * 60)) : null;

  return {
    drivingState,
    speedMph: input.speedMph,
    position: input.position,
    upcomingPois: input.upcomingPois.slice(0, 8),
    nextStopEtaMinutes,
    traffic: { status: 'unavailable' },
    roadConditions: { status: 'unavailable' },
  };
}
