import {
  MILES_TO_METERS,
  EARTH_RADIUS_METERS,
  haversineDistance as engineHaversine,
  distanceInMiles as engineDistanceInMiles,
  bearingTo as engineBearingTo,
  isWithinCone as engineIsWithinCone,
  offsetPosition as engineOffsetPosition,
  processDrivingState as engineProcess,
  type POIInput,
  type POIResult,
  type Coordinates,
} from "@core/driving-engine";

export { MILES_TO_METERS, EARTH_RADIUS_METERS };
export type { Coordinates, POIInput, POIResult };

export interface POIWithDistance {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distance: number;
  distanceMiles: number;
  facilityKind: string;
  hoursOfOperation?: string;
  notes?: string | null;
  address: string;
  bearing?: number;
  relativeBearing?: number;
}

export interface LocationData {
  id: string;
  name: string;
  address: string;
  facilityKind: string;
  hoursOfOperation?: string;
  notes?: string | null;
  pins: Array<{
    lat: string;
    lng: string;
  }>;
}

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return engineHaversine({ lat: lat1, lng: lng1 }, { lat: lat2, lng: lng2 });
}

export function distanceInMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return engineDistanceInMiles({ lat: lat1, lng: lng1 }, { lat: lat2, lng: lng2 });
}

export function bearingTo(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return engineBearingTo({ lat: lat1, lng: lng1 }, { lat: lat2, lng: lng2 });
}

export function isWithinCone(
  fromLat: number,
  fromLng: number,
  heading: number,
  targetLat: number,
  targetLng: number,
  maxDistanceMeters: number,
  coneAngle: number = 90
): boolean {
  return engineIsWithinCone(
    { lat: fromLat, lng: fromLng },
    heading,
    { lat: targetLat, lng: targetLng },
    maxDistanceMeters,
    coneAngle
  );
}

export function offsetPosition(
  lat: number,
  lng: number,
  heading: number,
  distanceMeters: number
): [number, number] {
  const result = engineOffsetPosition({ lat, lng }, heading, distanceMeters);
  return [result.lat, result.lng];
}

export function filterPOIsAhead(
  userLat: number,
  userLng: number,
  heading: number | null,
  locations: LocationData[],
  maxDistanceMiles: number = 25,
  coneAngle: number = 90
): POIWithDistance[] {
  const pois: POIInput[] = locations
    .filter(loc => loc.pins && loc.pins.length > 0)
    .map(loc => {
      const pin = loc.pins[0];
      const lat = parseFloat(pin.lat);
      const lng = parseFloat(pin.lng);
      return {
        id: loc.id,
        name: loc.name,
        lat,
        lng,
        category: loc.facilityKind,
        address: loc.address,
        hoursOfOperation: loc.hoursOfOperation,
        notes: loc.notes,
      };
    })
    .filter(poi => !isNaN(poi.lat) && !isNaN(poi.lng));

  const result = engineProcess({
    position: {
      lat: userLat,
      lng: userLng,
      heading,
      speed: null,
    },
    pois,
    options: {
      maxDistanceMiles,
      coneAngleDegrees: coneAngle,
    },
  });

  return result.poisAhead.map(poi => ({
    id: poi.id,
    name: poi.name,
    lat: poi.lat,
    lng: poi.lng,
    distance: poi.distanceMeters,
    distanceMiles: poi.distanceMiles,
    facilityKind: poi.category,
    hoursOfOperation: poi.hoursOfOperation,
    notes: poi.notes,
    address: poi.address || '',
    bearing: poi.bearing,
    relativeBearing: poi.relativeBearing,
  }));
}
