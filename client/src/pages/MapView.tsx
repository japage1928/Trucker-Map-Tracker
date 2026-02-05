import { useLocations } from "@/hooks/use-locations";
import { ClusteredMap, LocationInfo, FullnessStatus } from "@/components/ClusteredMap";
import { LocationDetailPanel } from "@/components/LocationDetailPanel";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Plus, Locate, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export default function MapView() {
  const { data: locations, isLoading } = useLocations();

  // Fetch fullness summary for all locations
  const { data: fullnessSummary } = useQuery<Record<string, string>>({
    queryKey: ["fullness-summary"],
    queryFn: async () => {
      const res = await fetch("/api/fullness-summary");
      if (!res.ok) return {};
      return res.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [flyToLocation, setFlyToLocation] = useState<[number, number] | null>(null);
  const [locatingUser, setLocatingUser] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<LocationInfo | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserLocation(loc);
          setLocatingUser(false);
        },
        () => {
          setLocatingUser(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      setLocatingUser(false);
    }
  }, []);

  const handleLocateMe = () => {
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const loc: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserLocation(loc);
        setFlyToLocation(loc);
        setLocatingUser(false);
      },
      () => {
        setLocatingUser(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleMarkerClick = (location: LocationInfo) => {
    setSelectedLocation(location);
  };

  const handleClosePanel = () => {
    setSelectedLocation(null);
  };

  if (isLoading) return <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;

  const allPins = (locations || []).flatMap(loc => 
    loc.pins.map(p => ({
      ...p,
      type: p.type as "entry" | "exit",
      label: p.label,
      isSeeded: loc.isSeeded,
      fullnessStatus: (fullnessSummary?.[loc.id] || null) as FullnessStatus,
      locationInfo: {
        name: loc.name,
        address: loc.address,
        facilityKind: loc.facilityKind,
        hoursOfOperation: loc.hoursOfOperation,
        notes: loc.notes,
        id: loc.id,
        fullnessStatus: (fullnessSummary?.[loc.id] || null) as FullnessStatus
      }
    }))
  );

  const mapCenter: [number, number] = userLocation || [39.8283, -98.5795];
  const mapZoom = userLocation ? 12 : 4;

  return (
    <div className="h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)] flex flex-col gap-4">
      <div className="flex justify-between items-center shrink-0">
        <h1 className="text-2xl font-bold">Map</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleLocateMe}
            disabled={locatingUser}
          >
            {locatingUser ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Locate className="w-4 h-4" />
            )}
          </Button>
          <Link href="/new">
            <Button size="sm" className="bg-primary text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" /> Add
            </Button>
          </Link>
        </div>
      </div>

      <Card className="flex-1 overflow-hidden border-border/50 shadow-lg relative">
        <ClusteredMap 
          center={mapCenter}
          zoom={mapZoom}
          pins={allPins}
          className="h-full w-full"
          onMarkerClick={handleMarkerClick}
          userLocation={userLocation}
          flyToLocation={flyToLocation}
        />
        <div className="absolute top-4 right-4 bg-card/90 backdrop-blur p-4 rounded-lg border border-border shadow-xl z-[400] max-w-xs">
          <h4 className="font-bold text-sm mb-2">Legend</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow shadow-blue-500/50"></div>
              <span>Your Location</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600 shadow shadow-blue-600/50"></div>
              <span>Truck Stops</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500 shadow shadow-orange-500/50"></div>
              <span>Clustered (zoom to expand)</span>
            </div>
          </div>
        </div>
        <LocationDetailPanel 
          location={selectedLocation} 
          onClose={handleClosePanel} 
        />
      </Card>
    </div>
  );
}
