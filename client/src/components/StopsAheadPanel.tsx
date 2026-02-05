import { Fuel, ParkingCircle, Bed, Scale, UtensilsCrossed, Warehouse, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { POIWithDistance } from '@/lib/geo-utils';
import type { TrackingState } from '@/hooks/use-tracking';

const facilityIcons: Record<string, typeof Fuel> = {
  'truck stop': Fuel,
  'parking': ParkingCircle,
  'rest area': Bed,
  'scale': Scale,
  'food': UtensilsCrossed,
  'warehouse': Warehouse,
};

interface StopsAheadPanelProps {
  stops: POIWithDistance[];
  selectedStop: POIWithDistance | null;
  onStopSelect: (stop: POIWithDistance) => void;
  position: TrackingState | null;
}

export function StopsAheadPanel({ stops, selectedStop, onStopSelect, position }: StopsAheadPanelProps) {
  return (
    <Card className="w-80 hidden md:flex flex-col border-border/50 shadow-lg overflow-hidden">
      <div className="p-4 border-b border-border bg-muted/50">
        <h2 className="font-bold flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          Stops Ahead
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          {stops.length} {stops.length === 1 ? 'stop' : 'stops'} in range
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!position ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Waiting for GPS...
          </div>
        ) : stops.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No stops ahead in selected range
          </div>
        ) : (
          <div className="divide-y divide-border">
            {stops.map(stop => {
              const Icon = facilityIcons[stop.facilityKind] || MapPin;
              const isSelected = selectedStop?.id === stop.id;

              return (
                <button
                  key={stop.id}
                  onClick={() => onStopSelect(stop)}
                  className={cn(
                    "w-full p-4 text-left transition-colors hover:bg-muted/50",
                    isSelected && "bg-primary/10 border-l-2 border-l-primary"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "p-2 rounded-lg shrink-0",
                      isSelected ? "bg-primary/20" : "bg-muted"
                    )}>
                      <Icon className={cn(
                        "w-5 h-5",
                        isSelected ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{stop.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">{stop.facilityKind}</div>
                      {stop.address && (
                        <div className="text-xs text-muted-foreground truncate mt-1">{stop.address}</div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-primary">
                        {stop.distanceMiles.toFixed(1)}
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase">mi</div>
                    </div>
                  </div>

                  {stop.hoursOfOperation && (
                    <div className="text-xs text-muted-foreground mt-2 pl-11">
                      {stop.hoursOfOperation}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

export function StopsAheadMobilePanel({ stops, selectedStop, onStopSelect, position }: StopsAheadPanelProps) {
  if (!position || stops.length === 0) return null;

  return (
    <div className="md:hidden absolute bottom-0 left-0 right-0 bg-card/95 backdrop-blur border-t border-border max-h-[40vh] overflow-y-auto z-[400]">
      <div className="p-3 border-b border-border sticky top-0 bg-card/95 backdrop-blur">
        <span className="font-bold text-sm">{stops.length} stops ahead</span>
      </div>

      <div className="divide-y divide-border">
        {stops.slice(0, 5).map(stop => {
          const Icon = facilityIcons[stop.facilityKind] || MapPin;
          const isSelected = selectedStop?.id === stop.id;

          return (
            <button
              key={stop.id}
              onClick={() => onStopSelect(stop)}
              className={cn(
                "w-full p-3 text-left flex items-center gap-3",
                isSelected && "bg-primary/10"
              )}
            >
              <Icon className={cn(
                "w-5 h-5 shrink-0",
                isSelected ? "text-primary" : "text-muted-foreground"
              )} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{stop.name}</div>
                <div className="text-xs text-muted-foreground capitalize">{stop.facilityKind}</div>
              </div>
              <div className="text-sm font-bold text-primary">
                {stop.distanceMiles.toFixed(1)} mi
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
