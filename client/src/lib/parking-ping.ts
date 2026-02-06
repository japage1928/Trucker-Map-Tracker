/**
 * Client-side utility for logging parking likelihood pings.
 * Fire-and-forget anonymous aggregate data collection.
 */

import { apiRequest } from "./queryClient";

type DayType = "weekday" | "weekend";

/**
 * Log a parking likelihood view ping.
 * This is non-blocking and fails silently.
 * 
 * @param stopId - Location/stop ID
 */
export function logParkingPing(stopId: string): void {
  const now = new Date();
  const hour = now.getHours();
  const dayType: DayType = [0, 6].includes(now.getDay()) ? "weekend" : "weekday";

  // Fire-and-forget: don't await, don't block UI
  apiRequest("POST", "/api/parking-pings", {
    stopId,
    hour,
    dayType,
  }).catch(() => {
    // Silently fail - this is non-critical telemetry
  });
}
