/**
 * Maps app Location objects to StopProfile for parking likelihood predictions.
 * This is the ONLY place where Location → StopProfile conversion happens.
 */

import type { Location } from "./schema";
import type { StopProfile, CapacityBucket, StopType } from "./parking-likelihood";

/**
 * Infer capacity bucket from location metadata.
 * 
 * Heuristics (can be refined with real data):
 * - Truck stops: default "medium", can be upgraded with metadata
 * - Rest areas: default "small"
 * - Other: default "small"
 * 
 * Future: Store explicit "parkingSpots" field in locations table.
 */
function inferCapacityBucket(location: Location): CapacityBucket {
  // If location has capacity metadata, use it
  const metadata = location.notes?.toLowerCase() || "";
  
  // Explicit size indicators in notes
  if (metadata.includes("large lot") || metadata.includes("200+ spots")) {
    return "large";
  }
  if (metadata.includes("small lot") || metadata.includes("limited parking")) {
    return "small";
  }
  
  // Facility-based defaults
  if (location.facilityKind === "truck stop") {
    return "medium"; // Most truck stops are medium-sized
  }
  
  if (location.facilityKind === "rest area") {
    return "small"; // Rest areas typically have fewer spots
  }
  
  return "small"; // Conservative default
}

/**
 * Map facilityKind to StopType.
 * Only truck stops and rest areas generate predictions.
 */
function mapStopType(location: Location): StopType | null {
  if (location.facilityKind === "truck stop") {
    return "truck_stop";
  }
  if (location.facilityKind === "rest area") {
    return "rest_area";
  }
  // Warehouses and parking-only don't get predictions
  return null;
}

/**
 * Extract region from location.
 * For now, use a simple US state-level heuristic.
 * Future: Use reverse geocoding or explicit region field.
 */
function inferRegion(location: Location): string {
  // Placeholder: Extract state from address if available
  const addressParts = location.address.split(",");
  const statePart = addressParts[addressParts.length - 2]?.trim();
  
  if (statePart && statePart.length === 2) {
    return statePart.toUpperCase();
  }
  
  return "US"; // Generic fallback
}

/**
 * Convert a Location to a StopProfile for parking prediction.
 * Returns null if the location doesn't support parking predictions.
 */
export function locationToStopProfile(location: Location): StopProfile | null {
  const stopType = mapStopType(location);
  
  if (!stopType) {
    return null; // This location doesn't support parking predictions
  }
  
  return {
    stopId: location.id,
    capacityBucket: inferCapacityBucket(location),
    region: inferRegion(location),
    type: stopType,
  };
}

/**
 * Batch conversion for multiple locations.
 * Filters out unsupported locations automatically.
 */
export function locationsToStopProfiles(locations: Location[]): StopProfile[] {
  return locations
    .map(locationToStopProfile)
    .filter((profile): profile is StopProfile => profile !== null);
}
