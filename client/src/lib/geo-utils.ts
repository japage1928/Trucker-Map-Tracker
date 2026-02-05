export const MILES_TO_METERS = 1609.34;

export function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function distanceInMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return haversineDistance(lat1, lng1, lat2, lng2) / MILES_TO_METERS;
}

export function bearingTo(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const lat1Rad = lat1 * Math.PI / 180;
  const lat2Rad = lat2 * Math.PI / 180;

  const y = Math.sin(dLng) * Math.cos(lat2Rad);
  const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) -
            Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng);

  let bearing = Math.atan2(y, x) * 180 / Math.PI;
  return (bearing + 360) % 360;
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
  const distance = haversineDistance(fromLat, fromLng, targetLat, targetLng);
  if (distance > maxDistanceMeters) return false;

  const bearingToPoi = bearingTo(fromLat, fromLng, targetLat, targetLng);

  let angleDiff = Math.abs(bearingToPoi - heading);
  if (angleDiff > 180) angleDiff = 360 - angleDiff;

  return angleDiff <= coneAngle / 2;
}

export function offsetPosition(
  lat: number,
  lng: number,
  heading: number,
  distanceMeters: number
): [number, number] {
  const R = 6371000;
  const headingRad = heading * Math.PI / 180;
  const latRad = lat * Math.PI / 180;
  const lngRad = lng * Math.PI / 180;

  const newLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(distanceMeters / R) +
    Math.cos(latRad) * Math.sin(distanceMeters / R) * Math.cos(headingRad)
  );

  const newLngRad = lngRad + Math.atan2(
    Math.sin(headingRad) * Math.sin(distanceMeters / R) * Math.cos(latRad),
    Math.cos(distanceMeters / R) - Math.sin(latRad) * Math.sin(newLatRad)
  );

  return [newLatRad * 180 / Math.PI, newLngRad * 180 / Math.PI];
}

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

export function filterPOIsAhead(
  userLat: number,
  userLng: number,
  heading: number | null,
  locations: LocationData[],
  maxDistanceMiles: number = 25,
  coneAngle: number = 90
): POIWithDistance[] {
  const maxDistanceMeters = maxDistanceMiles * MILES_TO_METERS;
  const effectiveHeading = heading ?? 0;
  const useCone = heading !== null;

  const results: POIWithDistance[] = [];

  for (const loc of locations) {
    if (!loc.pins || loc.pins.length === 0) continue;

    const pin = loc.pins[0];
    const lat = parseFloat(pin.lat);
    const lng = parseFloat(pin.lng);

    if (isNaN(lat) || isNaN(lng)) continue;

    const distance = haversineDistance(userLat, userLng, lat, lng);

    if (distance > maxDistanceMeters) continue;

    if (useCone && !isWithinCone(userLat, userLng, effectiveHeading, lat, lng, maxDistanceMeters, coneAngle)) {
      continue;
    }

    const poiBearing = bearingTo(userLat, userLng, lat, lng);
    let relativeBearing = poiBearing - effectiveHeading;
    if (relativeBearing > 180) relativeBearing -= 360;
    if (relativeBearing < -180) relativeBearing += 360;

    results.push({
      id: loc.id,
      name: loc.name,
      lat,
      lng,
      distance,
      distanceMiles: distance / MILES_TO_METERS,
      facilityKind: loc.facilityKind,
      hoursOfOperation: loc.hoursOfOperation,
      notes: loc.notes,
      address: loc.address,
      bearing: poiBearing,
      relativeBearing
    });
  }

  return results.sort((a, b) => a.distance - b.distance);
}
