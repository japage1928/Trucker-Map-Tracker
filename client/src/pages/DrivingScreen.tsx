import { useState, useMemo } from 'react';
import { useLocations } from '@/hooks/use-locations';
import { useTracking } from '@/hooks/use-tracking';
import { filterPOIsAhead, type POIWithDistance, type LocationData } from '@/lib/geo-utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Loader2, Navigation2, Fuel, Coffee, Bed, ParkingCircle, 
  UtensilsCrossed, Camera, X, MapPin, Clock, FileText
} from 'lucide-react';

const CATEGORY_CONFIG: Record<string, { icon: typeof Fuel; color: string; label: string }> = {
  fuel: { icon: Fuel, color: '#ef4444', label: 'Fuel' },
  truck_stop: { icon: Fuel, color: '#ef4444', label: 'Truck Stop' },
  gas: { icon: Fuel, color: '#ef4444', label: 'Gas' },
  food: { icon: UtensilsCrossed, color: '#f59e0b', label: 'Food' },
  restaurant: { icon: UtensilsCrossed, color: '#f59e0b', label: 'Restaurant' },
  cafe: { icon: Coffee, color: '#22c55e', label: 'Cafe' },
  coffee: { icon: Coffee, color: '#22c55e', label: 'Coffee' },
  hotel: { icon: Bed, color: '#3b82f6', label: 'Hotel' },
  lodging: { icon: Bed, color: '#3b82f6', label: 'Lodging' },
  parking: { icon: ParkingCircle, color: '#8b5cf6', label: 'Parking' },
  rest_area: { icon: ParkingCircle, color: '#8b5cf6', label: 'Rest Area' },
  scenic: { icon: Camera, color: '#06b6d4', label: 'Scenic' },
  warehouse: { icon: MapPin, color: '#64748b', label: 'Warehouse' },
};

function getCategoryConfig(facilityKind: string) {
  const kind = facilityKind?.toLowerCase() || '';
  for (const [key, config] of Object.entries(CATEGORY_CONFIG)) {
    if (kind.includes(key)) return config;
  }
  return { icon: MapPin, color: '#64748b', label: facilityKind || 'Location' };
}

const ALL_FILTERS = ['fuel', 'food', 'parking', 'hotel', 'scenic'] as const;
type FilterType = typeof ALL_FILTERS[number];

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
      if (activeFilters.has('hotel') && (kind.includes('hotel') || kind.includes('lodging'))) return true;
      if (activeFilters.has('scenic') && kind.includes('scenic')) return true;
      if (activeFilters.size === ALL_FILTERS.length) return true;
      return false;
    }).slice(0, 10);
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
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-sky-400 via-sky-300 to-green-400 overflow-hidden">
      <div className="absolute inset-0 flex flex-col">
        <div className="absolute top-4 left-4 right-4 z-20 flex gap-2 flex-wrap">
          {ALL_FILTERS.map(filter => {
            const config = CATEGORY_CONFIG[filter] || { icon: MapPin, color: '#64748b', label: filter };
            const Icon = config.icon;
            const isActive = activeFilters.has(filter);
            return (
              <Button
                key={filter}
                size="sm"
                variant={isActive ? "default" : "secondary"}
                onClick={() => toggleFilter(filter)}
                className="gap-1 text-xs"
                style={{ backgroundColor: isActive ? config.color : undefined }}
              >
                <Icon className="w-4 h-4" />
                {config.label}
              </Button>
            );
          })}
        </div>

        {error && (
          <div className="absolute top-16 left-4 right-4 z-20 bg-red-500/90 text-white px-3 py-2 rounded-lg text-sm">
            GPS Error: {error}
          </div>
        )}

        <div className="flex-1 relative overflow-hidden">
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(to bottom, #87CEEB 0%, #87CEEB 30%, #90EE90 30%, #90EE90 100%)'
          }} />
          
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <defs>
              <linearGradient id="roadGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4a4a4a" />
                <stop offset="100%" stopColor="#2d2d2d" />
              </linearGradient>
            </defs>
            <polygon 
              points="50%,30% 35%,100% 65%,100%" 
              fill="url(#roadGradient)"
            />
            <line x1="50%" y1="32%" x2="50%" y2="100%" stroke="#fbbf24" strokeWidth="3" strokeDasharray="20,15" />
            <line x1="36%" y1="100%" x2="46%" y2="32%" stroke="white" strokeWidth="2" />
            <line x1="64%" y1="100%" x2="54%" y2="32%" stroke="white" strokeWidth="2" />
          </svg>

          <div className="absolute left-0 right-0" style={{ top: '20%', bottom: '25%' }}>
            {stopsAhead.map((poi, index) => {
              const config = getCategoryConfig(poi.facilityKind);
              const Icon = config.icon;
              
              const distanceRatio = Math.min(poi.distanceMiles / maxDistance, 1);
              const verticalPos = 10 + distanceRatio * 70;
              const scale = 1.2 - distanceRatio * 0.6;
              const isLeft = (poi.relativeBearing || 0) < 0;
              const horizontalOffset = 15 + Math.abs(poi.relativeBearing || 0) * 0.3;
              
              return (
                <div
                  key={poi.id}
                  className="absolute cursor-pointer transition-all duration-300 hover:scale-110"
                  style={{
                    top: `${verticalPos}%`,
                    left: isLeft ? `${5 + horizontalOffset}%` : undefined,
                    right: !isLeft ? `${5 + horizontalOffset}%` : undefined,
                    transform: `scale(${scale})`,
                    zIndex: Math.round(100 - distanceRatio * 100)
                  }}
                  onClick={() => setSelectedPOI(poi)}
                >
                  <div 
                    className="flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg border-2 border-white"
                    style={{ backgroundColor: config.color }}
                  >
                    <Icon className="w-5 h-5 text-white" />
                    <div className="text-white font-bold text-sm whitespace-nowrap">
                      {poi.distanceMiles.toFixed(1)} mi
                    </div>
                  </div>
                  <div 
                    className="absolute left-1/2 -bottom-2 w-0 h-0 -translate-x-1/2"
                    style={{
                      borderLeft: '8px solid transparent',
                      borderRight: '8px solid transparent',
                      borderTop: `8px solid ${config.color}`
                    }}
                  />
                </div>
              );
            })}
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
            <div className="relative">
              <div className="w-16 h-24 bg-blue-600 rounded-t-lg rounded-b-md shadow-xl border-2 border-blue-800">
                <div className="absolute top-2 left-2 right-2 h-6 bg-blue-400 rounded-sm opacity-60" />
                <div className="absolute top-10 left-1 w-3 h-2 bg-yellow-400 rounded-sm" />
                <div className="absolute top-10 right-1 w-3 h-2 bg-yellow-400 rounded-sm" />
                <div className="absolute bottom-1 left-2 w-4 h-4 bg-gray-800 rounded-full" />
                <div className="absolute bottom-1 right-2 w-4 h-4 bg-gray-800 rounded-full" />
              </div>
              {isTracking && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                  <Navigation2 className="w-6 h-6 text-green-400 animate-pulse" />
                </div>
              )}
            </div>
          </div>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-4 text-white text-sm bg-black/40 px-4 py-1 rounded-full">
            <span>{position?.speed ? `${Math.round(position.speed * 2.237)} mph` : '--'}</span>
            <span className="text-gray-400">|</span>
            <span>{stopsAhead.length} stops ahead</span>
          </div>
        </div>

        {selectedPOI && (
          <div className="absolute inset-0 bg-black/50 z-30 flex items-end justify-center p-4">
            <Card className="w-full max-w-md p-4 bg-gray-900 border-gray-700 animate-in slide-in-from-bottom">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  {(() => {
                    const config = getCategoryConfig(selectedPOI.facilityKind);
                    const Icon = config.icon;
                    return (
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: config.color }}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    );
                  })()}
                  <div>
                    <h3 className="text-lg font-bold text-white">{selectedPOI.name}</h3>
                    <p className="text-sm text-gray-400">{getCategoryConfig(selectedPOI.facilityKind).label}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedPOI(null)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <span>{selectedPOI.address}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Navigation2 className="w-4 h-4 text-gray-500" />
                  <span>{selectedPOI.distanceMiles.toFixed(1)} miles ahead</span>
                </div>
                {selectedPOI.hoursOfOperation && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>{selectedPOI.hoursOfOperation}</span>
                  </div>
                )}
                {selectedPOI.notes && (
                  <div className="flex items-start gap-2 text-gray-300">
                    <FileText className="w-4 h-4 text-gray-500 mt-0.5" />
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
