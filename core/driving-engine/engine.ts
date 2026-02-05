import type {
  DrivingEngineInput,
  DrivingEngineOutput,
  POIResult,
  DrivingEngineOptions,
} from "./types";
import { DEFAULT_OPTIONS } from "./types";
import {
  haversineDistance,
  bearingTo,
  relativeBearing,
  isWithinCone,
  MILES_TO_METERS,
} from "./geo";

export function processDrivingState(input: DrivingEngineInput): DrivingEngineOutput {
  const { position, pois, options = {} } = input;
  
  const mergedOptions: Required<DrivingEngineOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const maxDistanceMeters = mergedOptions.maxDistanceMiles * MILES_TO_METERS;
  const headingAvailable = position.heading !== null;
  const effectiveHeading = position.heading ?? 0;

  const results: POIResult[] = [];

  for (const poi of pois) {
    const from = { lat: position.lat, lng: position.lng };
    const to = { lat: poi.lat, lng: poi.lng };

    const distanceMeters = haversineDistance(from, to);

    if (distanceMeters > maxDistanceMeters) {
      continue;
    }

    if (headingAvailable) {
      const inCone = isWithinCone(
        from,
        effectiveHeading,
        to,
        maxDistanceMeters,
        mergedOptions.coneAngleDegrees
      );
      if (!inCone) {
        continue;
      }
    }

    const absoluteBearing = bearingTo(from, to);
    const relBearing = relativeBearing(effectiveHeading, absoluteBearing);

    results.push({
      id: poi.id,
      name: poi.name,
      lat: poi.lat,
      lng: poi.lng,
      category: poi.category,
      address: poi.address,
      hoursOfOperation: poi.hoursOfOperation,
      notes: poi.notes,
      distanceMeters,
      distanceMiles: distanceMeters / MILES_TO_METERS,
      bearing: absoluteBearing,
      relativeBearing: relBearing,
    });
  }

  results.sort((a, b) => a.distanceMeters - b.distanceMeters);

  const poisAhead = results.slice(0, mergedOptions.maxResults);

  return {
    poisAhead,
    totalPoisInRange: results.length,
    headingAvailable,
  };
}

export function filterPOIsByCategory(
  pois: POIResult[],
  categories: string[]
): POIResult[] {
  if (categories.length === 0) return pois;

  const lowerCategories = categories.map(c => c.toLowerCase());
  
  return pois.filter(poi => {
    const poiCategory = poi.category?.toLowerCase() || "";
    return lowerCategories.some(cat => poiCategory.includes(cat));
  });
}

export function rankPOIsByPreference(
  pois: POIResult[],
  preferredCategories: string[]
): POIResult[] {
  if (preferredCategories.length === 0) return pois;

  const lowerPrefs = preferredCategories.map(c => c.toLowerCase());

  return [...pois].sort((a, b) => {
    const aCategory = a.category?.toLowerCase() || "";
    const bCategory = b.category?.toLowerCase() || "";

    const aIndex = lowerPrefs.findIndex(pref => aCategory.includes(pref));
    const bIndex = lowerPrefs.findIndex(pref => bCategory.includes(pref));

    const aScore = aIndex === -1 ? 999 : aIndex;
    const bScore = bIndex === -1 ? 999 : bIndex;

    if (aScore !== bScore) return aScore - bScore;
    return a.distanceMiles - b.distanceMiles;
  });
}
