import { useState, useMemo, useCallback } from 'react';
import { useLocations } from '@/hooks/use-locations';
import { useTracking } from '@/hooks/use-tracking';
import { TrackingMap } from '@/components/TrackingMap';
import { StopsAheadPanel } from '@/components/StopsAheadPanel';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Navigation2, Loader2, AlertCircle, Radio } from 'lucide-react';
import { filterPOIsAhead, type POIWithDistance, type LocationData } from '@/lib/geo-utils';

const DISTANCE_OPTIONS = [
  { value: '5', label: '5 mi' },
  { value: '10', label: '10 mi' },
  { value: '25', label: '25 mi' },
  { value: '50', label: '50 mi' },
];

export default function TrackingView() {
  const { data: locations, isLoading: locationsLoading } = useLocations();
  const [maxDistance, setMaxDistance] = useState('25');
  const [selectedStop, setSelectedStop] = useState<POIWithDistance | null>(null);

  const { position, error, isTracking } = useTracking({
    enabled: true,
    throttleMs: 3000,
    minDistanceMeters: 50,
    minHeadingChange: 10
  });

  const stopsAhead = useMemo(() => {
    if (!position || !locations) return [];

    const locData: LocationData[] = locations.map(loc => ({
      id: loc.id,
      name: loc.name,
      address: loc.address,
      facilityKind: loc.facilityKind,
      hoursOfOperation: loc.hoursOfOperation || '',
      notes: loc.notes,
      pins: loc.pins.map(p => ({ lat: p.lat, lng: p.lng }))
    }));

    return filterPOIsAhead(
      position.lat,
      position.lng,
      position.heading,
      locData,
      parseFloat(maxDistance),
      90
    );
  }, [position, locations, maxDistance]);

  const handleStopSelect = useCallback((stop: POIWithDistance) => {
    setSelectedStop(stop);
  }, []);

  if (locationsLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-6rem)]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-6rem)] md:h-[calc(100vh-4rem)] flex flex-col gap-4">
      <div className="flex justify-between items-center shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Navigation2 className="w-6 h-6 text-primary" />
          <h1 className="text-xl font-bold">Tracking</h1>
          {isTracking && (
            <span className="flex items-center gap-1 text-xs text-green-500">
              <Radio className="w-3 h-3 animate-pulse" />
              Live
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Range:</span>
          <Select value={maxDistance} onValueChange={setMaxDistance}>
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DISTANCE_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>GPS Error: {error}</span>
        </div>
      )}

      <div className="flex-1 flex gap-4 min-h-0">
        <Card className="flex-1 overflow-hidden border-border/50 shadow-lg relative">
          <TrackingMap
            position={position}
            stopsAhead={stopsAhead}
            selectedStop={selectedStop}
            onStopSelect={handleStopSelect}
          />

          {!position && !error && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Acquiring GPS signal...</p>
              </div>
            </div>
          )}
        </Card>

        <StopsAheadPanel
          stops={stopsAhead}
          selectedStop={selectedStop}
          onStopSelect={handleStopSelect}
          position={position}
        />
      </div>
    </div>
  );
}
