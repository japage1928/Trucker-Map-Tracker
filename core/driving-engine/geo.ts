import type { Coordinates } from "./types";

export const MILES_TO_METERS = 1609.34;
export const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function toDegrees(radians: number): number {
  return radians * (180 / Math.PI);
}

export function normalizeAngle(angle: number): number {
  let normalized = angle % 360;
  if (normalized < 0) normalized += 360;
  return normalized;
}

export function angleDifference(angle1: number, angle2: number): number {
  let diff = Math.abs(normalizeAngle(angle1) - normalizeAngle(angle2));
  if (diff > 180) diff = 360 - diff;
  return diff;
}

export function haversineDistance(from: Coordinates, to: Coordinates): number {
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return EARTH_RADIUS_METERS * c;
}

export function distanceInMiles(from: Coordinates, to: Coordinates): number {
  return haversineDistance(from, to) / MILES_TO_METERS;
}

export function bearingTo(from: Coordinates, to: Coordinates): number {
  const dLng = toRadians(to.lng - from.lng);
  const fromLatRad = toRadians(from.lat);
  const toLatRad = toRadians(to.lat);

  const y = Math.sin(dLng) * Math.cos(toLatRad);
  const x = Math.cos(fromLatRad) * Math.sin(toLatRad) -
            Math.sin(fromLatRad) * Math.cos(toLatRad) * Math.cos(dLng);

  const bearing = toDegrees(Math.atan2(y, x));
  return normalizeAngle(bearing);
}

export function relativeBearing(heading: number, absoluteBearing: number): number {
  let relative = absoluteBearing - heading;
  if (relative > 180) relative -= 360;
  if (relative < -180) relative += 360;
  return relative;
}

export function isWithinCone(
  from: Coordinates,
  heading: number,
  target: Coordinates,
  maxDistanceMeters: number,
  coneAngleDegrees: number
): boolean {
  const distance = haversineDistance(from, target);
  if (distance > maxDistanceMeters) return false;

  const bearingToPoi = bearingTo(from, target);
  const angleDiff = angleDifference(bearingToPoi, heading);

  return angleDiff <= coneAngleDegrees / 2;
}

export function offsetPosition(
  from: Coordinates,
  heading: number,
  distanceMeters: number
): Coordinates {
  const headingRad = toRadians(heading);
  const latRad = toRadians(from.lat);
  const lngRad = toRadians(from.lng);

  const newLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(distanceMeters / EARTH_RADIUS_METERS) +
    Math.cos(latRad) * Math.sin(distanceMeters / EARTH_RADIUS_METERS) * Math.cos(headingRad)
  );

  const newLngRad = lngRad + Math.atan2(
    Math.sin(headingRad) * Math.sin(distanceMeters / EARTH_RADIUS_METERS) * Math.cos(latRad),
    Math.cos(distanceMeters / EARTH_RADIUS_METERS) - Math.sin(latRad) * Math.sin(newLatRad)
  );

  return {
    lat: toDegrees(newLatRad),
    lng: toDegrees(newLngRad),
  };
}
