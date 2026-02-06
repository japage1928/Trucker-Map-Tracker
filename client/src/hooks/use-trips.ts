import { useCallback, useEffect, useState } from "react";

export interface TripPlan {
  id: string;
  title: string;
  origin: string;
  destination: string;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
  plannedDate?: string;
  distanceMiles?: number;
  etaMinutes?: number;
  notes?: string;
  tripType?: "business" | "personal";
  status?: "planned" | "active" | "completed";
  startedAt?: string;
  endedAt?: string;
  autoDetected?: boolean;
  createdAt: string;
}

const TRIPS_STORAGE_KEY = "driver-trips";
const TRIPS_SYNC_EVENT = "trips:update";

function loadTrips(): TripPlan[] {
  try {
    const raw = localStorage.getItem(TRIPS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TripPlan[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTrips(trips: TripPlan[]) {
  localStorage.setItem(TRIPS_STORAGE_KEY, JSON.stringify(trips));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(TRIPS_SYNC_EVENT));
  }
}

export function useTrips() {
  const [trips, setTrips] = useState<TripPlan[]>([]);

  useEffect(() => {
    setTrips(loadTrips());
    const handleSync = () => setTrips(loadTrips());
    if (typeof window !== "undefined") {
      window.addEventListener(TRIPS_SYNC_EVENT, handleSync);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(TRIPS_SYNC_EVENT, handleSync);
      }
    };
  }, []);

  const addTrip = useCallback((trip: Omit<TripPlan, "id" | "createdAt">) => {
    const next: TripPlan = {
      ...trip,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setTrips((prev) => {
      const updated = [next, ...prev];
      saveTrips(updated);
      return updated;
    });
    return next;
  }, []);

  const removeTrip = useCallback((id: string) => {
    setTrips((prev) => {
      const updated = prev.filter((trip) => trip.id !== id);
      saveTrips(updated);
      return updated;
    });
  }, []);

  const updateTrip = useCallback((id: string, updates: Partial<Omit<TripPlan, "id" | "createdAt">>) => {
    setTrips((prev) => {
      const updated = prev.map((trip) =>
        trip.id === id ? { ...trip, ...updates } : trip
      );
      saveTrips(updated);
      return updated;
    });
  }, []);

  const clearTrips = useCallback(() => {
    setTrips([]);
    saveTrips([]);
  }, []);

  return {
    trips,
    addTrip,
    removeTrip,
    updateTrip,
    clearTrips,
  };
}
