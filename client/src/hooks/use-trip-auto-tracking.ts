import { useEffect, useMemo, useRef } from 'react';
import { useTracking } from '@/hooks/use-tracking';
import { useTrips } from '@/hooks/use-trips';
import { distanceInMiles } from '@/lib/geo-utils';

const ACTIVE_TRIP_KEY = 'active-trip-id';
const MOVING_SPEED_MPH = 5;
const START_GRACE_MS = 30_000;
const STOP_GRACE_MS = 120_000;
const MIN_SEGMENT_MILES = 0.02;

function formatLatLng(lat: number, lng: number) {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export function useTripAutoTracking(enabled: boolean) {
  const { trips, addTrip, updateTrip } = useTrips();
  const { position } = useTracking({
    enabled,
    throttleMs: 5000,
    minDistanceMeters: 50,
    minHeadingChange: 10,
  });

  const activeTripIdRef = useRef<string | null>(null);
  const lastPositionRef = useRef<{ lat: number; lng: number } | null>(null);
  const distanceRef = useRef(0);
  const movingSinceRef = useRef<number | null>(null);
  const stoppedSinceRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    activeTripIdRef.current = localStorage.getItem(ACTIVE_TRIP_KEY);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    const activeId = activeTripIdRef.current;
    if (!activeId) return;
    const trip = trips.find((t) => t.id === activeId);
    if (!trip) {
      activeTripIdRef.current = null;
      localStorage.removeItem(ACTIVE_TRIP_KEY);
      distanceRef.current = 0;
      lastPositionRef.current = null;
      movingSinceRef.current = null;
      stoppedSinceRef.current = null;
      return;
    }
    distanceRef.current = trip.distanceMiles ?? 0;
  }, [trips]);

  const speedMph = useMemo(() => {
    if (position?.speed === null || position?.speed === undefined) return null;
    return position.speed * 2.237;
  }, [position?.speed]);

  useEffect(() => {
    if (!enabled || !position || speedMph === null) return;

    const now = Date.now();
    const currentPos = { lat: position.lat, lng: position.lng };
    const isMoving = speedMph >= MOVING_SPEED_MPH;
    const activeId = activeTripIdRef.current;

    if (activeId) {
      if (lastPositionRef.current) {
        const segment = distanceInMiles(
          lastPositionRef.current.lat,
          lastPositionRef.current.lng,
          currentPos.lat,
          currentPos.lng
        );
        if (Number.isFinite(segment) && segment >= MIN_SEGMENT_MILES) {
          distanceRef.current += segment;
          updateTrip(activeId, {
            distanceMiles: Number(distanceRef.current.toFixed(1)),
          });
        }
      }
      lastPositionRef.current = currentPos;

      if (isMoving) {
        stoppedSinceRef.current = null;
      } else {
        if (!stoppedSinceRef.current) {
          stoppedSinceRef.current = now;
        }
        if (now - stoppedSinceRef.current >= STOP_GRACE_MS) {
          updateTrip(activeId, {
            status: 'completed',
            endedAt: new Date(now).toISOString(),
            destination: formatLatLng(currentPos.lat, currentPos.lng),
            destinationLat: currentPos.lat,
            destinationLng: currentPos.lng,
          });
          activeTripIdRef.current = null;
          localStorage.removeItem(ACTIVE_TRIP_KEY);
          lastPositionRef.current = null;
          distanceRef.current = 0;
          movingSinceRef.current = null;
          stoppedSinceRef.current = null;
        }
      }
      return;
    }

    if (isMoving) {
      if (!movingSinceRef.current) {
        movingSinceRef.current = now;
      }
      if (now - movingSinceRef.current >= START_GRACE_MS) {
        const originText = formatLatLng(currentPos.lat, currentPos.lng);
        const title = `Auto Trip ${new Date(now).toLocaleDateString()}`;
        const trip = addTrip({
          title,
          origin: originText,
          destination: 'In progress',
          originLat: currentPos.lat,
          originLng: currentPos.lng,
          tripType: 'business',
          status: 'active',
          startedAt: new Date(now).toISOString(),
          autoDetected: true,
          distanceMiles: 0,
        });
        activeTripIdRef.current = trip.id;
        localStorage.setItem(ACTIVE_TRIP_KEY, trip.id);
        lastPositionRef.current = currentPos;
        distanceRef.current = 0;
        movingSinceRef.current = null;
        stoppedSinceRef.current = null;
      }
    } else {
      movingSinceRef.current = null;
    }
  }, [position, speedMph, addTrip, updateTrip]);
}
