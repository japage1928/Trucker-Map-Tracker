import { useCallback, useEffect, useState } from "react";

export interface TripPlan {
  id: string;
  title: string;
  origin: string;
  destination: string;
  plannedDate?: string;
  distanceMiles?: number;
  etaMinutes?: number;
  notes?: string;
  createdAt: string;
}

const TRIPS_STORAGE_KEY = "driver-trips";

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
}

export function useTrips() {
  const [trips, setTrips] = useState<TripPlan[]>([]);

  useEffect(() => {
    setTrips(loadTrips());
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
