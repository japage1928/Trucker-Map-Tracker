import type { WeatherContext } from '@shared/weather-types';
import { normalizeWeatherCondition, normalizeSeverity } from '@shared/weather-types';

/**
 * Weather adapter for current location
 * Uses Open-Meteo (free, no API key required) for weather data
 * 
 * This is a read-only adapter that fetches current conditions.
 * No long-term storage or historical data.
 */

interface OpenMeteoResponse {
  current: {
    weather_code: number;
    temperature_2m: number;
    wind_speed_10m: number;
    visibility: number;
  };
}

// WMO Weather Codes
const WMO_CODE_MAP: Record<number, string> = {
  0: "Sunny",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  80: "Slight rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  85: "Slight snow showers",
  86: "Heavy snow showers",
  95: "Thunderstorm",
  96: "Thunderstorm with slight hail",
  99: "Thunderstorm with heavy hail",
};

function mapWmoCodeToCondition(code: number): string {
  return WMO_CODE_MAP[code] || "Unknown";
}

export async function fetchWeatherContext(
  lat: number,
  lng: number
): Promise<WeatherContext | null> {
  try {
    // OpenMeteo requires celsius, so we'll convert
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.append("latitude", lat.toString());
    url.searchParams.append("longitude", lng.toString());
    url.searchParams.append("current", "temperature_2m,weather_code,wind_speed_10m,visibility");
    url.searchParams.append("temperature_unit", "fahrenheit");
    url.searchParams.append("wind_speed_unit", "mph");

    const response = await fetch(url.toString());
    if (!response.ok) {
      console.warn("Weather API error:", response.statusText);
      return null;
    }

    const data = (await response.json()) as OpenMeteoResponse;
    const current = data.current;

    const conditionStr = mapWmoCodeToCondition(current.weather_code);
    const condition = normalizeWeatherCondition(conditionStr);
    const severity = normalizeSeverity(conditionStr);

    return {
      condition,
      severity,
      temperatureFahrenheit: Math.round(current.temperature_2m),
      windSpeedMph: Math.round(current.wind_speed_10m),
      visibilityMiles: current.visibility / 1609.34, // meters to miles
    };
  } catch (error) {
    console.warn("Failed to fetch weather:", error);
    return null;
  }
}

/**
 * Check if alert conditions exist based on weather
 */
export function getWeatherAlert(context: WeatherContext): string | undefined {
  if (context.severity === "HIGH") {
    if (context.condition === "SNOW") {
      return "Winter Storm Warning - Reduced visibility";
    }
    if (context.condition === "WIND") {
      return "High Wind Warning - Use caution";
    }
    if (context.condition === "RAIN") {
      return "Flash Flood Warning";
    }
  }

  if (context.severity === "MODERATE") {
    if (context.condition === "FOG") {
      return "Dense fog - Visibility < 1/4 mile";
    }
    if (context.condition === "SNOW") {
      return "Winter Weather Advisory";
    }
  }

  return undefined;
}
