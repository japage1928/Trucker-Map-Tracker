/**
 * Traffic Context Types
 * 
 * ETA delta and congestion level only.
 * Used to inform route decisions, not for automated actions.
 */

export type CongestionLevel = "LOW" | "MODERATE" | "HIGH";

export interface TrafficContext {
  delayMinutes: number; // Additional minutes vs free-flow
  congestionLevel: CongestionLevel;
  affectedSegments?: string[]; // e.g., ["I-95 northbound mile 100-120"]
}

export function normalizeCongestion(delayMinutes: number): CongestionLevel {
  if (delayMinutes < 5) return "LOW";
  if (delayMinutes < 20) return "MODERATE";
  return "HIGH";
}
