import { useState } from 'react';

interface GeolocationResult {
  lat: number;
  lng: number;
  accuracy: number;
  address?: string;
}

export function useGeolocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = (): Promise<GeolocationResult> => {
    setLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const msg = "Geolocation is not supported by your browser";
        setError(msg);
        setLoading(false);
        reject(msg);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude, accuracy } = position.coords;
            
            // Reverse geocode using OSM Nominatim
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
              {
                headers: {
                  'Accept-Language': 'en',
                  'User-Agent': 'TruckerBuddy/1.0'
                }
              }
            );
            
            if (!response.ok) throw new Error("Reverse geocoding failed");
            
            const data = await response.json();
            const address = data.display_name;

            setLoading(false);
            resolve({
              lat: latitude,
              lng: longitude,
              accuracy: Math.round(accuracy),
              address
            });
          } catch (err) {
            console.error("Geocoding error:", err);
            setLoading(false);
            // Still resolve with coords even if geocoding fails
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: Math.round(position.coords.accuracy)
            });
          }
        },
        (err) => {
          let msg = "Failed to get location";
          if (err.code === err.PERMISSION_DENIED) {
            msg = "Location permission denied";
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            msg = "Location unavailable";
          } else if (err.code === err.TIMEOUT) {
            msg = "Location request timed out";
          }
          setError(msg);
          setLoading(false);
          reject(msg);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  return { getCurrentLocation, loading, error };
}
