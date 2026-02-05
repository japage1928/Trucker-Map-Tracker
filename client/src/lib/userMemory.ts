import { apiRequest } from "./queryClient";

export type EventType = "fuel_stop" | "parking_stop" | "food_stop" | "shutdown" | "alert_shown" | "alert_tapped" | "alert_ignored";

export interface UserPreferences {
  preferredCategories: string[];
  ignoredAlertTypes: string[];
  avgShutdownHour: number | null;
  totalStops: number;
}

export async function logUserEvent(
  eventType: EventType,
  options?: {
    locationId?: string;
    category?: string;
    alertType?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  try {
    await apiRequest("POST", "/api/user-events", {
      eventType,
      ...options,
    });
  } catch (error) {
    console.error("Failed to log user event:", error);
  }
}

export async function getUserPreferences(): Promise<UserPreferences> {
  try {
    const response = await apiRequest("GET", "/api/user-preferences");
    return await response.json();
  } catch (error) {
    console.error("Failed to get user preferences:", error);
    return {
      preferredCategories: [],
      ignoredAlertTypes: [],
      avgShutdownHour: null,
      totalStops: 0,
    };
  }
}

export function mapFacilityKindToEventType(facilityKind: string): EventType | null {
  const kind = facilityKind?.toLowerCase() || "";
  
  if (kind.includes("fuel") || kind.includes("truck_stop") || kind.includes("gas")) {
    return "fuel_stop";
  }
  if (kind.includes("parking") || kind.includes("rest_area")) {
    return "parking_stop";
  }
  if (kind.includes("food") || kind.includes("restaurant") || kind.includes("cafe") || kind.includes("coffee")) {
    return "food_stop";
  }
  
  return null;
}

export function mapFacilityKindToCategory(facilityKind: string): string {
  const kind = facilityKind?.toLowerCase() || "";
  
  if (kind.includes("fuel") || kind.includes("truck_stop") || kind.includes("gas")) {
    return "fuel";
  }
  if (kind.includes("parking") || kind.includes("rest_area")) {
    return "parking";
  }
  if (kind.includes("food") || kind.includes("restaurant")) {
    return "food";
  }
  if (kind.includes("cafe") || kind.includes("coffee")) {
    return "coffee";
  }
  
  return "other";
}
