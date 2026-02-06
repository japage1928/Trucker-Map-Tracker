import type { TrafficContext } from '@shared/traffic-types';
import { normalizeCongestion } from '@shared/traffic-types';

/**
 * Traffic context adapter
 * 
 * This adapter works with existing routing/navigation data.
 * It calculates ETA deltas based on distance and estimated speed.
 * 
 * No external API scraping. Uses:
 * - Current speed from tracking
 * - Distance to destination
 * - Historical congestion patterns (if available)
 */

export interface TrafficCalculationInput {
  distanceMiles: number;
  currentSpeedMph: number;
  averageFreeFlowSpeedMph?: number; // typically 65 mph for highway
}

/**
 * Calculate traffic delay by comparing current ETA to free-flow ETA
 */
export function calculateTrafficDelay(
  input: TrafficCalculationInput
): TrafficContext {
  const freeFlowSpeed = input.averageFreeFlowSpeedMph || 65;
  
  // Free-flow ETA (minutes)
  const freeFlowEtaMinutes = (input.distanceMiles / freeFlowSpeed) * 60;
  
  // Current ETA based on speed (minutes)
  const currentEtaMinutes = input.currentSpeedMph > 0
    ? (input.distanceMiles / input.currentSpeedMph) * 60
    : freeFlowEtaMinutes * 2; // Assume stopped or very slow
  
  // Delay is the difference
  const delayMinutes = Math.max(0, currentEtaMinutes - freeFlowEtaMinutes);
  
  return {
    delayMinutes: Math.round(delayMinutes),
    congestionLevel: normalizeCongestion(delayMinutes),
  };
}

/**
 * Integrate historical time-of-day patterns if available
 * This allows for predictive traffic awareness
 */
export function estimateTimeOfDayTraffic(hour: number): number {
  // Simple heuristic: rush hour delays
  if (hour >= 7 && hour <= 9) return 1.3; // morning rush +30%
  if (hour >= 16 && hour <= 19) return 1.4; // evening rush +40%
  return 1.0; // normal
}

export function applyTimeOfDayFactor(
  baseContext: TrafficContext,
  hour: number
): TrafficContext {
  const factor = estimateTimeOfDayFactor(hour);
  return {
    ...baseContext,
    delayMinutes: Math.round(baseContext.delayMinutes * factor),
    congestionLevel: normalizeCongestion(baseContext.delayMinutes * factor),
  };
}

function estimateTimeOfDayFactor(hour: number): number {
  return estimateTimeOfDayTraffic(hour);
}

/**
 * Simple traffic context for when no real-time data is available
 */
export function getDefaultTrafficContext(): TrafficContext {
  return {
    delayMinutes: 0,
    congestionLevel: "LOW",
  };
}
