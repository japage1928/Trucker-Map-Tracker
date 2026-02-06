/**
 * Weather Context Types
 * 
 * Read-only weather data normalized for AI reasoning.
 * Used to inform driving decisions, not for automated actions.
 */

export type WeatherCondition = "CLEAR" | "RAIN" | "SNOW" | "FOG" | "WIND" | "UNKNOWN";
export type WeatherSeverity = "LOW" | "MODERATE" | "HIGH";

export interface WeatherContext {
  condition: WeatherCondition;
  severity: WeatherSeverity;
  alert?: string; // e.g., "Winter Storm Advisory"
  temperatureFahrenheit?: number;
  windSpeedMph?: number;
  visibilityMiles?: number;
}

export function normalizeWeatherCondition(
  condition: string | null | undefined
): WeatherCondition {
  if (!condition) return "UNKNOWN";
  const lower = condition.toLowerCase();
  if (lower.includes("snow")) return "SNOW";
  if (lower.includes("rain")) return "RAIN";
  if (lower.includes("fog")) return "FOG";
  if (lower.includes("wind")) return "WIND";
  if (lower.includes("clear") || lower.includes("sunny")) return "CLEAR";
  return "UNKNOWN";
}

export function normalizeSeverity(
  condition: string | null | undefined,
  severity?: string
): WeatherSeverity {
  if (!condition) return "LOW";
  const lower = condition.toLowerCase();
  
  // Map common weather codes/names to severity
  if (lower.includes("storm") || lower.includes("severe") || lower.includes("hurricane")) {
    return "HIGH";
  }
  if (lower.includes("winter") || lower.includes("thunder")) {
    return "MODERATE";
  }
  return "LOW";
}
