/**
 * Driver-Assist AI Context
 * 
 * Aggregates HOS, weather, traffic, and destination for AI reasoning.
 * The AI uses this to answer questions like:
 * - "Do I have enough time to make it to X?"
 * - "Will I need to stop before arriving?"
 * - "Should I build in buffer time?"
 */

import type { HOSTracking } from "./hos-types";
import type { WeatherContext } from "./weather-types";
import type { TrafficContext } from "./traffic-types";

export interface Destination {
  name: string;
  etaMinutes: number; // Estimated time to arrival
  distanceMiles?: number;
}

export interface DriverAssistAiContext {
  // HOS state
  hos?: HOSTracking;
  
  // Environmental context
  weather?: WeatherContext;
  traffic?: TrafficContext;
  
  // Route info
  destination?: Destination;
  
  // Driving state (from tracking)
  drivingState?: 'driving' | 'stopped' | 'unknown';
  speedMph?: number | null;
  position?: { lat: number; lng: number } | null;
}

export function describeContextForAi(ctx: DriverAssistAiContext): string {
  const lines: string[] = [];
  
  if (ctx.hos) {
    lines.push(`HOS: ${ctx.hos.dutyStatus} status`);
    lines.push(`  - Drive time remaining: ${ctx.hos.driveTimeRemainingHours.toFixed(1)} hours`);
    lines.push(`  - On-duty time remaining: ${ctx.hos.onDutyRemainingHours.toFixed(1)} hours`);
  }
  
  if (ctx.weather) {
    lines.push(`Weather: ${ctx.weather.condition} (${ctx.weather.severity})`);
    if (ctx.weather.alert) {
      lines.push(`  - ⚠️ ${ctx.weather.alert}`);
    }
    if (ctx.weather.temperatureFahrenheit !== undefined) {
      lines.push(`  - Temp: ${ctx.weather.temperatureFahrenheit}°F`);
    }
  }
  
  if (ctx.traffic) {
    lines.push(`Traffic: ${ctx.traffic.congestionLevel} congestion`);
    lines.push(`  - Additional delay: ${ctx.traffic.delayMinutes} minutes`);
  }
  
  if (ctx.destination) {
    lines.push(`Destination: ${ctx.destination.name}`);
    lines.push(`  - ETA: ${ctx.destination.etaMinutes} minutes`);
    if (ctx.destination.distanceMiles !== undefined) {
      lines.push(`  - Distance: ${ctx.destination.distanceMiles.toFixed(1)} miles`);
    }
  }
  
  if (ctx.drivingState) {
    lines.push(`Current state: ${ctx.drivingState} @ ${ctx.speedMph?.toFixed(1) ?? '--'} mph`);
  }
  
  return lines.join('\n');
}
