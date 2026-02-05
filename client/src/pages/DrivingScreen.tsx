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

function TruckSVG() {
  return (
    <svg viewBox="0 0 120 80" className="w-28 h-20 drop-shadow-2xl">
      <defs>
        <linearGradient id="truckBody" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="truckCab" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id="windowGlass" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#bfdbfe" />
          <stop offset="100%" stopColor="#93c5fd" />
        </linearGradient>
      </defs>
      <rect x="10" y="25" width="100" height="45" rx="3" fill="url(#truckBody)" stroke="#1e40af" strokeWidth="1.5"/>
      <rect x="25" y="10" width="70" height="20" rx="8" fill="url(#truckCab)" stroke="#1e40af" strokeWidth="1"/>
      <rect x="35" y="14" width="50" height="12" rx="2" fill="url(#windowGlass)" stroke="#60a5fa" strokeWidth="0.5"/>
      <rect x="36" y="15" width="10" height="10" rx="1" fill="#bfdbfe" opacity="0.8"/>
      <rect x="48" y="15" width="24" height="10" rx="1" fill="#93c5fd" opacity="0.6"/>
      <rect x="74" y="15" width="10" height="10" rx="1" fill="#bfdbfe" opacity="0.8"/>
      <rect x="12" y="40" width="10" height="6" rx="1" fill="#fbbf24"/>
      <rect x="98" y="40" width="10" height="6" rx="1" fill="#fbbf24"/>
      <rect x="12" y="60" width="8" height="4" rx="1" fill="#ef4444"/>
      <rect x="100" y="60" width="8" height="4" rx="1" fill="#ef4444"/>
      <ellipse cx="30" cy="72" rx="10" ry="8" fill="#1f2937"/>
      <ellipse cx="30" cy="72" rx="6" ry="5" fill="#374151"/>
      <ellipse cx="30" cy="72" rx="3" ry="2.5" fill="#4b5563"/>
      <ellipse cx="90" cy="72" rx="10" ry="8" fill="#1f2937"/>
      <ellipse cx="90" cy="72" rx="6" ry="5" fill="#374151"/>
      <ellipse cx="90" cy="72" rx="3" ry="2.5" fill="#4b5563"/>
      <line x1="15" y1="50" x2="105" y2="50" stroke="#1e40af" strokeWidth="0.5" opacity="0.5"/>
      <rect x="55" y="28" width="10" height="8" rx="1" fill="#1e40af" opacity="0.3"/>
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
    }).slice(0, 10);
  }, [position, locations, maxDistance, activeFilters]);

  const leftPOIs = stopsAhead.filter(poi => (poi.relativeBearing || 0) < 0);
  const rightPOIs = stopsAhead.filter(poi => (poi.relativeBearing || 0) >= 0);

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
    <div className="fixed inset-0 overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(180deg, #7dd3fc 0%, #38bdf8 15%, #0ea5e9 30%, #22c55e 30%, #22c55e 35%, #16a34a 100%)'
        }} />
        
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="roadSurface" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#374151" />
              <stop offset="30%" stopColor="#4b5563" />
              <stop offset="70%" stopColor="#374151" />
              <stop offset="100%" stopColor="#1f2937" />
            </linearGradient>
            <linearGradient id="roadEdge" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#9ca3af" />
              <stop offset="50%" stopColor="#d1d5db" />
              <stop offset="100%" stopColor="#9ca3af" />
            </linearGradient>
          </defs>
          
          <polygon points="50,25 20,100 80,100" fill="url(#roadSurface)" />
          
          <line x1="50" y1="27" x2="47" y2="35" stroke="#fbbf24" strokeWidth="0.4" />
          <line x1="50" y1="38" x2="46" y2="50" stroke="#fbbf24" strokeWidth="0.5" />
          <line x1="50" y1="53" x2="45" y2="68" stroke="#fbbf24" strokeWidth="0.6" />
          <line x1="50" y1="71" x2="43" y2="88" stroke="#fbbf24" strokeWidth="0.8" />
          <line x1="50" y1="91" x2="40" y2="100" stroke="#fbbf24" strokeWidth="1" />
          <line x1="50" y1="91" x2="60" y2="100" stroke="#fbbf24" strokeWidth="1" />
          
          <line x1="50" y1="27" x2="25" y2="100" stroke="white" strokeWidth="0.3" opacity="0.9" />
          <line x1="50" y1="27" x2="75" y2="100" stroke="white" strokeWidth="0.3" opacity="0.9" />
          
          <line x1="50" y1="27" x2="20" y2="100" stroke="white" strokeWidth="0.8" />
          <line x1="50" y1="27" x2="80" y2="100" stroke="white" strokeWidth="0.8" />
        </svg>

        <div className="absolute top-4 left-4 right-4 z-20 flex gap-2 justify-center">
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
                className="gap-1.5 text-xs font-semibold shadow-lg"
                style={{ 
                  backgroundColor: isActive ? config.color : 'rgba(0,0,0,0.6)',
                  color: 'white',
                  border: isActive ? 'none' : '1px solid rgba(255,255,255,0.2)'
                }}
              >
                <Icon className="w-4 h-4" />
                {config.label}
              </Button>
            );
          })}
        </div>

        {error && (
          <div className="absolute top-16 left-4 right-4 z-20 bg-red-500/90 text-white px-3 py-2 rounded-lg text-sm text-center">
            GPS Error: {error}
          </div>
        )}

        <div className="absolute left-2 top-24 bottom-32 w-32 flex flex-col justify-start gap-3">
          {leftPOIs.slice(0, 4).map((poi) => {
            const config = getCategoryConfig(poi.facilityKind);
            const Icon = config.icon;
            return (
              <div
                key={poi.id}
                className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
                onClick={() => setSelectedPOI(poi)}
              >
                <div 
                  className="relative flex items-center gap-2 px-3 py-2 rounded-lg shadow-xl"
                  style={{ 
                    backgroundColor: config.color,
                    boxShadow: `0 4px 12px ${config.color}66`
                  }}
                >
                  <Icon className="w-6 h-6 text-white" />
                  <div className="text-white">
                    <div className="font-bold text-sm leading-tight">{config.label}</div>
                    <div className="text-xs opacity-90">{poi.distanceMiles.toFixed(1)} mi</div>
                  </div>
                  <div 
                    className="absolute -right-2 top-1/2 -translate-y-1/2 w-0 h-0"
                    style={{
                      borderTop: '8px solid transparent',
                      borderBottom: '8px solid transparent',
                      borderLeft: `8px solid ${config.color}`
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="absolute right-2 top-24 bottom-32 w-32 flex flex-col justify-start gap-3 items-end">
          {rightPOIs.slice(0, 4).map((poi) => {
            const config = getCategoryConfig(poi.facilityKind);
            const Icon = config.icon;
            return (
              <div
                key={poi.id}
                className="cursor-pointer transition-transform hover:scale-105 active:scale-95"
                onClick={() => setSelectedPOI(poi)}
              >
                <div 
                  className="relative flex items-center gap-2 px-3 py-2 rounded-lg shadow-xl"
                  style={{ 
                    backgroundColor: config.color,
                    boxShadow: `0 4px 12px ${config.color}66`
                  }}
                >
                  <div 
                    className="absolute -left-2 top-1/2 -translate-y-1/2 w-0 h-0"
                    style={{
                      borderTop: '8px solid transparent',
                      borderBottom: '8px solid transparent',
                      borderRight: `8px solid ${config.color}`
                    }}
                  />
                  <Icon className="w-6 h-6 text-white" />
                  <div className="text-white">
                    <div className="font-bold text-sm leading-tight">{config.label}</div>
                    <div className="text-xs opacity-90">{poi.distanceMiles.toFixed(1)} mi</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10">
          <TruckSVG />
          {isTracking && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
            </div>
          )}
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4 text-white text-sm bg-black/60 backdrop-blur-sm px-5 py-2 rounded-full shadow-lg">
          <span className="font-semibold">{position?.speed ? `${Math.round(position.speed * 2.237)} mph` : '-- mph'}</span>
          <span className="text-gray-400">|</span>
          <span>{stopsAhead.length} stops ahead</span>
        </div>

        {selectedPOI && (
          <div className="absolute inset-0 bg-black/50 z-30 flex items-end justify-center p-4" onClick={() => setSelectedPOI(null)}>
            <Card className="w-full max-w-md p-4 bg-gray-900 border-gray-700 animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
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
