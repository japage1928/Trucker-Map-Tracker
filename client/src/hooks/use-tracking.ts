import { useState, useEffect, useRef, useCallback } from 'react';

export interface TrackingState {
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  accuracy: number | null;
  timestamp: number;
}

interface UseTrackingOptions {
  enabled?: boolean;
  throttleMs?: number;
  minDistanceMeters?: number;
  minHeadingChange?: number;
}

export function useTracking(options: UseTrackingOptions = {}) {
  const {
    enabled = true,
    throttleMs = 3000,
    minDistanceMeters = 50,
    minHeadingChange = 10
  } = options;

  const [position, setPosition] = useState<TrackingState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const lastUpdateRef = useRef<number>(0);
  const lastPositionRef = useRef<TrackingState | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const haversineDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const headingDiff = (h1: number | null, h2: number | null): number => {
    if (h1 === null || h2 === null) return 0;
    let diff = Math.abs(h1 - h2);
    if (diff > 180) diff = 360 - diff;
    return diff;
  };

  const shouldUpdate = useCallback((newPos: TrackingState): boolean => {
    const now = Date.now();
    if (now - lastUpdateRef.current < throttleMs) return false;

    const last = lastPositionRef.current;
    if (!last) return true;

    const dist = haversineDistance(last.lat, last.lng, newPos.lat, newPos.lng);
    if (dist >= minDistanceMeters) return true;

    if (headingDiff(last.heading, newPos.heading) >= minHeadingChange) return true;

    return false;
  }, [throttleMs, minDistanceMeters, minHeadingChange]);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      return;
    }

    setIsTracking(true);
    setError(null);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newState: TrackingState = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp
        };

        if (shouldUpdate(newState)) {
          lastUpdateRef.current = Date.now();
          lastPositionRef.current = newState;
          setPosition(newState);
        }
      },
      (err) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    );
  }, [shouldUpdate]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  useEffect(() => {
    if (enabled) {
      startTracking();
    } else {
      stopTracking();
    }

    return () => {
      stopTracking();
    };
  }, [enabled, startTracking, stopTracking]);

  return {
    position,
    error,
    isTracking,
    startTracking,
    stopTracking
  };
}
