import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocations } from '@/hooks/use-locations';
import { useTracking } from '@/hooks/use-tracking';
import { 
  processDrivingState, 
  filterPOIsByCategory,
  rankPOIsByPreference,
  type POIInput,
  type POIResult 
} from '@core/driving-engine';
import { logUserEvent, mapFacilityKindToEventType, mapFacilityKindToCategory, getUserPreferences, type UserPreferences } from '@/lib/userMemory';
import { Card } from '@/components/ui/card';
import { 
  Loader2, Navigation2, Fuel, Coffee, ParkingCircle, 
  UtensilsCrossed, X, MapPin, Clock, FileText, Compass
} from 'lucide-react';

const CATEGORY_CONFIG: Record<string, { icon: typeof Fuel; color: string; label: string }> = {
  fuel: { icon: Fuel, color: '#dc2626', label: 'Gas' },
  truck_stop: { icon: Fuel, color: '#dc2626', label: 'Truck Stop' },
  gas: { icon: Fuel, color: '#dc2626', label: 'Gas' },
  food: { icon: UtensilsCrossed, color: '#eab308', label: 'Food' },
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

const SEARCH_BUTTONS = ['fuel', 'food', 'parking'] as const;
type SearchType = typeof SEARCH_BUTTONS[number];

const SEARCH_CATEGORIES: Record<SearchType, string[]> = {
  fuel: ['fuel', 'truck_stop', 'gas'],
  food: ['food', 'restaurant', 'cafe', 'coffee'],
  parking: ['parking', 'rest_area'],
};

const DEFAULT_RANGE_MILES = 15;
const EXTENDED_RANGE_MILES = 75;

function getBearingDirection(bearing: number | undefined): string {
  if (bearing === undefined) return '';
  const normalized = ((bearing % 360) + 360) % 360;
  if (normalized < 22.5 || normalized >= 337.5) return 'ahead';
  if (normalized < 67.5) return 'ahead right';
  if (normalized < 112.5) return 'right';
  if (normalized < 157.5) return 'behind right';
  if (normalized < 202.5) return 'behind';
  if (normalized < 247.5) return 'behind left';
  if (normalized < 292.5) return 'left';
  return 'ahead left';
}

export default function DrivingScreen() {
  const { data: locations, isLoading } = useLocations();
  const [activeSearch, setActiveSearch] = useState<SearchType | null>(null);
  const [selectedPOI, setSelectedPOI] = useState<POIResult | null>(null);

  const { data: userPrefs } = useQuery<UserPreferences>({
    queryKey: ["/api/user-preferences"],
    queryFn: getUserPreferences,
    staleTime: 5 * 60 * 1000,
  });

  const { position, error, isTracking } = useTracking({
    enabled: true,
    throttleMs: 2000,
    minDistanceMeters: 30,
    minHeadingChange: 5
  });

  const handleSelectPOI = (poi: POIResult) => {
    setSelectedPOI(poi);
    const eventType = mapFacilityKindToEventType(poi.category || "");
    if (eventType) {
      logUserEvent(eventType, {
        locationId: poi.id,
        category: mapFacilityKindToCategory(poi.category || ""),
      });
    }
  };

  const currentRange = activeSearch ? EXTENDED_RANGE_MILES : DEFAULT_RANGE_MILES;

  const stopsAhead = useMemo(() => {
    if (!position || !locations) return [];

    const pois: POIInput[] = locations
      .filter(loc => loc.pins && loc.pins.length > 0)
      .map(loc => {
        const pin = loc.pins[0];
        const lat = parseFloat(pin.lat);
        const lng = parseFloat(pin.lng);
        return {
          id: loc.id,
          name: loc.name,
          lat,
          lng,
          category: loc.facilityKind,
          address: loc.address,
          hoursOfOperation: loc.hoursOfOperation || undefined,
          notes: loc.notes,
        };
      })
      .filter(poi => !isNaN(poi.lat) && !isNaN(poi.lng));

    const engineResult = processDrivingState({
      position: {
        lat: position.lat,
        lng: position.lng,
        heading: position.heading,
        speed: position.speed,
      },
      pois,
      options: {
        maxDistanceMiles: currentRange,
        coneAngleDegrees: position.heading !== null ? 90 : 360,
        maxResults: 50,
      },
    });

    let filtered = engineResult.poisAhead;

    if (activeSearch) {
      const searchCategories = SEARCH_CATEGORIES[activeSearch];
      filtered = filterPOIsByCategory(filtered, searchCategories);
    }

    if (userPrefs?.preferredCategories?.length) {
      filtered = rankPOIsByPreference(filtered, userPrefs.preferredCategories);
    }

    return filtered.slice(0, 10);
  }, [position, locations, currentRange, activeSearch, userPrefs]);

  const handleSearchButton = (searchType: SearchType) => {
    if (activeSearch === searchType) {
      setActiveSearch(null);
    } else {
      setActiveSearch(searchType);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    );
  }

  const speed = position?.speed ? Math.round(position.speed * 2.237) : null;

  return (
    <div className="fixed inset-0 bg-zinc-950 flex flex-col select-none">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-green-500' : error ? 'bg-red-500' : 'bg-zinc-600'}`} />
          <span className="text-zinc-400 text-sm font-medium">
            {speed !== null ? `${speed} mph` : 'GPS'}
          </span>
        </div>
        
        <div className="flex items-center gap-1 bg-zinc-900 rounded-full p-1">
          {SEARCH_BUTTONS.map(searchType => {
            const config = CATEGORY_CONFIG[searchType];
            const Icon = config.icon;
            const isActive = activeSearch === searchType;
            return (
              <button
                key={searchType}
                onClick={() => handleSearchButton(searchType)}
                className={`p-2.5 rounded-full transition-all ${
                  isActive 
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30' 
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
                title={config.label}
              >
                <Icon className="w-5 h-5" />
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-zinc-500 text-sm">
          <Compass className="w-4 h-4" />
          <span>{currentRange} mi</span>
        </div>
      </div>

      {activeSearch && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
          <p className="text-amber-500 text-xs text-center font-medium">
            Searching {EXTENDED_RANGE_MILES} mi for {CATEGORY_CONFIG[activeSearch].label}
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
        {stopsAhead.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500">
            <Navigation2 className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm">No stops ahead</p>
            <p className="text-xs mt-1">
              {position ? `Within ${currentRange} miles` : 'Waiting for GPS...'}
            </p>
          </div>
        ) : (
          stopsAhead.map((poi, index) => {
            const config = getCategoryConfig(poi.category);
            const Icon = config.icon;
            const direction = getBearingDirection(poi.relativeBearing);
            
            return (
              <div
                key={poi.id}
                onClick={() => handleSelectPOI(poi)}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all
                  ${index === 0 ? 'bg-zinc-800 border border-zinc-700' : 'bg-zinc-900 hover:bg-zinc-800'}`}
              >
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: config.color }}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">{poi.name}</p>
                  <p className="text-zinc-500 text-xs truncate">{config.label}</p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-white font-semibold text-sm">{poi.distanceMiles.toFixed(1)} mi</p>
                  {direction && (
                    <p className="text-zinc-500 text-xs">{direction}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-900/50">
        <div className="flex items-center justify-center gap-4 text-xs text-zinc-500">
          <span>{stopsAhead.length} stops ahead</span>
          {position && (
            <>
              <span className="text-zinc-700">|</span>
              <span>
                {position.heading !== null 
                  ? `Heading ${Math.round(position.heading)}°` 
                  : 'No heading'}
              </span>
            </>
          )}
        </div>
      </div>

      {selectedPOI && (
        <div 
          className="absolute inset-0 bg-black/60 z-30 flex items-end justify-center p-3" 
          onClick={() => setSelectedPOI(null)}
        >
          <Card 
            className="w-full max-w-md p-4 bg-zinc-900 border-zinc-800 rounded-2xl" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                {(() => {
                  const config = getCategoryConfig(selectedPOI.category);
                  const Icon = config.icon;
                  return (
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: config.color }}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  );
                })()}
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedPOI.name}</h3>
                  <p className="text-sm text-zinc-400">{getCategoryConfig(selectedPOI.category).label}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPOI(null)}
                className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3 text-zinc-300 bg-zinc-800/50 rounded-lg px-3 py-2">
                <Navigation2 className="w-4 h-4 text-amber-500" />
                <span className="font-medium">{selectedPOI.distanceMiles.toFixed(1)} miles ahead</span>
              </div>
              
              {selectedPOI.address && (
                <div className="flex items-center gap-3 text-zinc-400">
                  <MapPin className="w-4 h-4 text-zinc-600" />
                  <span>{selectedPOI.address}</span>
                </div>
              )}
              {selectedPOI.hoursOfOperation && (
                <div className="flex items-center gap-3 text-zinc-400">
                  <Clock className="w-4 h-4 text-zinc-600" />
                  <span>{selectedPOI.hoursOfOperation}</span>
                </div>
              )}
              {selectedPOI.notes && (
                <div className="flex items-start gap-3 text-zinc-400">
                  <FileText className="w-4 h-4 text-zinc-600 mt-0.5" />
                  <span>{selectedPOI.notes}</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
