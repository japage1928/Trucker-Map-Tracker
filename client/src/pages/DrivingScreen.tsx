import { useState, useMemo } from 'react';
import { useLocations } from '@/hooks/use-locations';
import { useTracking } from '@/hooks/use-tracking';
import { filterPOIsAhead, type POIWithDistance, type LocationData } from '@/lib/geo-utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Loader2, Navigation2, Fuel, Coffee, ParkingCircle, 
  UtensilsCrossed, X, MapPin, Clock, FileText
} from 'lucide-react';

const CATEGORY_CONFIG: Record<string, { icon: typeof Fuel; color: string; label: string }> = {
  fuel: { icon: Fuel, color: '#dc2626', label: 'Gas' },
  truck_stop: { icon: Fuel, color: '#dc2626', label: 'Truck Stop' },
  gas: { icon: Fuel, color: '#dc2626', label: 'Gas' },
  food: { icon: UtensilsCrossed, color: '#eab308', label: 'Fast Food' },
  restaurant: { icon: UtensilsCrossed, color: '#eab308', label: 'Restaurant' },
  cafe: { icon: Coffee, color: '#16a34a', label: 'Cafe' },
  coffee: { icon: Coffee, color: '#16a34a', label: 'Coffee' },
  parking: { icon: ParkingCircle, color: '#7c3aed', label: 'Parking' },
  rest_area: { icon: ParkingCircle, color: '#7c3aed', label: 'Rest Area' },
  warehouse: { icon: MapPin, color: '#64748b', label: 'Warehouse' },
};

function getCategoryConfig(facilityKind: string) {
  const kind = facilityKind?.toLowerCase() || '';
  for (const [key, config] of Object.entries(CATEGORY_CONFIG)) {
    if (kind.includes(key)) return config;
  }
  return { icon: MapPin, color: '#64748b', label: facilityKind || 'Location' };
}

const ALL_FILTERS = ['fuel', 'food', 'parking'] as const;
type FilterType = typeof ALL_FILTERS[number];

function TruckIcon() {
  return (
    <svg viewBox="0 0 60 40" className="w-16 h-10">
      <defs>
        <linearGradient id="truckGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      <rect x="5" y="12" width="50" height="22" rx="2" fill="url(#truckGrad)" />
      <rect x="12" y="5" width="36" height="10" rx="4" fill="#60a5fa" />
      <rect x="18" y="7" width="24" height="6" rx="1" fill="#bfdbfe" />
      <ellipse cx="15" cy="36" rx="5" ry="4" fill="#1f2937" />
      <ellipse cx="45" cy="36" rx="5" ry="4" fill="#1f2937" />
      <rect x="6" y="20" width="4" height="3" rx="1" fill="#fbbf24" />
      <rect x="50" y="20" width="4" height="3" rx="1" fill="#fbbf24" />
    </svg>
  );
}

export default function DrivingScreen() {
  const { data: locations, isLoading } = useLocations();
  const [activeFilters, setActiveFilters] = useState<Set<FilterType>>(new Set(ALL_FILTERS));
  const [selectedPOI, setSelectedPOI] = useState<POIWithDistance | null>(null);
  const [maxDistance] = useState(25);

  const { position, error, isTracking } = useTracking({
    enabled: true,
    throttleMs: 2000,
    minDistanceMeters: 30,
    minHeadingChange: 5
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

    const allPOIs = filterPOIsAhead(
      position.lat,
      position.lng,
      position.heading,
      locData,
      maxDistance,
      position.heading !== null ? 90 : 360
    );

    return allPOIs.filter(poi => {
      const kind = poi.facilityKind?.toLowerCase() || '';
      if (activeFilters.has('fuel') && (kind.includes('fuel') || kind.includes('truck_stop') || kind.includes('gas'))) return true;
      if (activeFilters.has('food') && (kind.includes('food') || kind.includes('restaurant') || kind.includes('cafe') || kind.includes('coffee'))) return true;
      if (activeFilters.has('parking') && (kind.includes('parking') || kind.includes('rest_area'))) return true;
      if (activeFilters.size === ALL_FILTERS.length) return true;
      return false;
    }).slice(0, 8);
  }, [position, locations, maxDistance, activeFilters]);

  const toggleFilter = (filter: FilterType) => {
    setActiveFilters(prev => {
      const next = new Set(prev);
      if (next.has(filter)) {
        next.delete(filter);
      } else {
        next.add(filter);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-900">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const horizonY = 25;
  const roadBottom = 100;

  return (
    <div className="fixed inset-0 overflow-hidden select-none">
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0"
          style={{
            background: `linear-gradient(180deg, 
              #87ceeb 0%, 
              #87ceeb ${horizonY}%, 
              #4ade80 ${horizonY}%, 
              #22c55e 100%)`
          }}
        />
        
        <svg 
          className="absolute inset-0 w-full h-full" 
          viewBox="0 0 100 100" 
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="roadGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#52525b" />
              <stop offset="100%" stopColor="#27272a" />
            </linearGradient>
          </defs>
          
          <polygon 
            points={`50,${horizonY} 15,${roadBottom} 85,${roadBottom}`} 
            fill="url(#roadGrad)" 
          />
          
          <line x1="50" y1={horizonY + 3} x2="50" y2={horizonY + 8} stroke="#fbbf24" strokeWidth="0.4" />
          <line x1="50" y1={horizonY + 12} x2="50" y2={horizonY + 20} stroke="#fbbf24" strokeWidth="0.5" />
          <line x1="50" y1={horizonY + 25} x2="50" y2={horizonY + 38} stroke="#fbbf24" strokeWidth="0.7" />
          <line x1="50" y1={horizonY + 44} x2="50" y2={horizonY + 60} stroke="#fbbf24" strokeWidth="1" />
          <line x1="50" y1={horizonY + 66} x2="50" y2={roadBottom} stroke="#fbbf24" strokeWidth="1.2" />
          
          <line 
            x1="50" y1={horizonY} 
            x2="15" y2={roadBottom} 
            stroke="white" strokeWidth="0.8" 
          />
          <line 
            x1="50" y1={horizonY} 
            x2="85" y2={roadBottom} 
            stroke="white" strokeWidth="0.8" 
          />
        </svg>

        <div className="absolute top-3 left-3 right-3 z-20 flex gap-2 justify-center">
          {ALL_FILTERS.map(filter => {
            const config = CATEGORY_CONFIG[filter] || { icon: MapPin, color: '#64748b', label: filter };
            const Icon = config.icon;
            const isActive = activeFilters.has(filter);
            return (
              <Button
                key={filter}
                size="sm"
                onClick={() => toggleFilter(filter)}
                className="gap-1 text-xs font-medium px-3 py-1.5 rounded-full border-0"
                style={{ 
                  backgroundColor: isActive ? config.color : 'rgba(0,0,0,0.5)',
                  color: 'white',
                  opacity: isActive ? 1 : 0.7
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {config.label}
              </Button>
            );
          })}
        </div>

        {error && (
          <div className="absolute top-14 left-4 right-4 z-20 bg-red-600 text-white px-3 py-2 rounded text-xs text-center">
            GPS: {error}
          </div>
        )}

        <div className="absolute inset-0 pointer-events-none" style={{ top: `${horizonY}%`, bottom: '18%' }}>
          {stopsAhead.map((poi, index) => {
            const config = getCategoryConfig(poi.facilityKind);
            const Icon = config.icon;
            
            const distanceRatio = Math.min(poi.distanceMiles / maxDistance, 1);
            
            const verticalPercent = 5 + distanceRatio * 75;
            
            const scale = 1.1 - distanceRatio * 0.6;
            
            const bearing = poi.relativeBearing || 0;
            const isLeft = bearing < 0;
            
            const roadWidthAtY = 35 - distanceRatio * 30;
            const offsetFromCenter = roadWidthAtY * 0.6 + Math.abs(bearing) * 0.15;
            
            const horizontalPos = isLeft 
              ? 50 - offsetFromCenter 
              : 50 + offsetFromCenter;
            
            return (
              <div
                key={poi.id}
                className="absolute pointer-events-auto cursor-pointer transition-all duration-500 ease-out"
                style={{
                  top: `${verticalPercent}%`,
                  left: `${horizontalPos}%`,
                  transform: `translate(-50%, -50%) scale(${scale})`,
                  zIndex: Math.round(100 - distanceRatio * 100)
                }}
                onClick={() => setSelectedPOI(poi)}
              >
                <div 
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md"
                  style={{ backgroundColor: config.color }}
                >
                  <Icon className="w-4 h-4 text-white" />
                  <span className="text-white font-semibold text-xs whitespace-nowrap">
                    {poi.distanceMiles.toFixed(1)} mi
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-10">
          <TruckIcon />
          {isTracking && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            </div>
          )}
        </div>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 text-white text-xs bg-black/50 px-4 py-1.5 rounded-full">
          <span className="font-medium">{position?.speed ? `${Math.round(position.speed * 2.237)} mph` : '--'}</span>
          <span className="text-white/50">|</span>
          <span>{stopsAhead.length} ahead</span>
        </div>

        {selectedPOI && (
          <div 
            className="absolute inset-0 bg-black/40 z-30 flex items-end justify-center p-3" 
            onClick={() => setSelectedPOI(null)}
          >
            <Card 
              className="w-full max-w-sm p-3 bg-zinc-900 border-zinc-800" 
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  {(() => {
                    const config = getCategoryConfig(selectedPOI.facilityKind);
                    const Icon = config.icon;
                    return (
                      <div 
                        className="w-10 h-10 rounded flex items-center justify-center"
                        style={{ backgroundColor: config.color }}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                    );
                  })()}
                  <div>
                    <h3 className="text-base font-semibold text-white leading-tight">{selectedPOI.name}</h3>
                    <p className="text-xs text-zinc-400">{getCategoryConfig(selectedPOI.facilityKind).label}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedPOI(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center gap-2 text-zinc-300">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{selectedPOI.address}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Navigation2 className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{selectedPOI.distanceMiles.toFixed(1)} miles ahead</span>
                </div>
                {selectedPOI.hoursOfOperation && (
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    <span>{selectedPOI.hoursOfOperation}</span>
                  </div>
                )}
                {selectedPOI.notes && (
                  <div className="flex items-start gap-2 text-zinc-300">
                    <FileText className="w-3.5 h-3.5 text-zinc-500 mt-0.5" />
                    <span>{selectedPOI.notes}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
