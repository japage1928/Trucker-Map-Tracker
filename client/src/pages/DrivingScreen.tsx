import { useEffect, useMemo, useRef, useState } from 'react';
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
import { buildAiContext, type AiContext } from '@/lib/ai-context';
import {
  logUserEvent,
  mapFacilityKindToEventType,
  mapFacilityKindToCategory,
  getUserPreferences,
  type UserPreferences
} from '@/lib/userMemory';
import { TrackingMap } from '@/components/TrackingMap';
import { DrivingHudOverlay } from '@/components/DrivingHudOverlay';
import { ParkingHudBadge } from '@/components/ParkingLikelihoodBadge';
import type { POIWithDistance } from '@/lib/geo-utils';
import { TruckerAiVoiceSession, type VoiceState } from '@/lib/trucker-ai-voice';
import { useShowExplanation } from '@/hooks/use-parking-insights';
import { locationToStopProfile } from '@shared/parking-profile-mapper';
import { getParkingLikelihood } from '@shared/parking-likelihood';
import { logParkingPing } from '@/lib/parking-ping';
import { LOCATION_DISCLOSURE } from '@/lib/location-disclosure';
import { X } from 'lucide-react';

const SEARCH_BUTTONS = ['fuel', 'food', 'parking'] as const;
type SearchType = typeof SEARCH_BUTTONS[number];

const SEARCH_CATEGORIES: Record<SearchType, string[]> = {
  fuel: ['fuel', 'truck_stop', 'gas'],
  food: ['food', 'restaurant', 'cafe', 'coffee'],
  parking: ['parking', 'rest_area'],
};

const SEARCH_LABELS: Record<SearchType, string> = {
  fuel: 'Fuel',
  food: 'Food',
  parking: 'Parking',
};

const DEFAULT_RANGE_MILES = 15;
const EXTENDED_RANGE_MILES = 75;

function mapStopsForDisplay(pois: POIResult[]): POIWithDistance[] {
  return pois.map(poi => ({
    id: poi.id,
    name: poi.name,
    lat: poi.lat,
    lng: poi.lng,
    distance: poi.distanceMeters,
    distanceMiles: poi.distanceMiles,
    facilityKind: poi.category,
    hoursOfOperation: poi.hoursOfOperation,
    notes: poi.notes,
    address: poi.address || '',
    bearing: poi.bearing,
    relativeBearing: poi.relativeBearing,
  }));
}

function TruckerAiHudControl({ context }: { context: AiContext }) {
  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const sessionRef = useRef<TruckerAiVoiceSession | null>(null);

  if (!sessionRef.current) {
    sessionRef.current = new TruckerAiVoiceSession(context, {
      onStateChange: setState,
      onTranscript: setTranscript,
      onError: () => setState('error'),
    });
  }

  useEffect(() => {
    sessionRef.current?.updateContext(context);
  }, [context]);

  useEffect(() => {
    return () => sessionRef.current?.destroy();
  }, []);

  const toggle = () => {
    if (state === 'idle' || state === 'error') {
      sessionRef.current?.start();
    } else {
      sessionRef.current?.stop();
    }
  };

  const isListening = state === 'listening';
  const isSpeaking = state === 'speaking';
  const isProcessing = state === 'processing';
  const isUnavailable = state === 'unavailable';
  const statusLabel = isListening ? 'Listening' : isSpeaking ? 'Speaking' : isProcessing ? 'Working' : 'Idle';
  const showTranscript = Boolean(transcript);

  return (
    <div className="absolute bottom-4 right-4 z-30 flex flex-col items-end gap-2 pointer-events-none">
      <div className="pointer-events-auto rounded-md bg-white/80 px-2 py-1 text-[10px] text-slate-700 shadow-sm">
        {statusLabel}
      </div>

      {showTranscript && (
        <div className="pointer-events-none max-w-[180px] rounded-md bg-white/70 px-2 py-1 text-[10px] text-slate-600 shadow-sm">
          {transcript}
        </div>
      )}

      <button
        type="button"
        onClick={toggle}
        disabled={isUnavailable}
        aria-pressed={state !== 'idle'}
        className={`pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-sm font-semibold text-slate-900 shadow-sm transition-transform transition-opacity duration-150 ${state !== 'idle' ? 'scale-95' : ''} ${isUnavailable ? 'opacity-50' : 'opacity-100'}`}
      >
        AI
      </button>
    </div>
  );
}

export default function DrivingScreen() {
  const { data: locations, isLoading } = useLocations();
  const [activeSearch, setActiveSearch] = useState<SearchType | null>(null);
  const [selectedStop, setSelectedStop] = useState<POIWithDistance | null>(null);
  const showExplanation = useShowExplanation();
  
  // Location disclosure banner
  const [showLocationBanner, setShowLocationBanner] = useState(() => {
    return !localStorage.getItem('location-disclosure-dismissed');
  });

  const dismissLocationBanner = () => {
    localStorage.setItem('location-disclosure-dismissed', 'true');
    setShowLocationBanner(false);
  };

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

  const handleSelectStop = (poi: POIWithDistance) => {
    setSelectedStop(poi);
    const eventType = mapFacilityKindToEventType(poi.facilityKind || "");
    if (eventType) {
      logUserEvent(eventType, {
        locationId: poi.id,
        category: mapFacilityKindToCategory(poi.facilityKind || ""),
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

    return filtered.slice(0, 8);
  }, [position, locations, currentRange, activeSearch, userPrefs]);

  const stopsAheadWithDistance = useMemo(
    () => mapStopsForDisplay(stopsAhead),
    [stopsAhead]
  );

  const aiContext = useMemo(() => {
    const speedMph = position?.speed !== null && position?.speed !== undefined
      ? position.speed * 2.237
      : null;
    return buildAiContext({
      speedMph,
      position: position ? { lat: position.lat, lng: position.lng } : null,
      upcomingPois: stopsAheadWithDistance.map(stop => ({
        name: stop.name,
        distanceMiles: stop.distanceMiles,
        facilityKind: stop.facilityKind,
      })),
    });
  }, [position, stopsAheadWithDistance]);

  // Parking likelihood for next relevant stop
  const parkingLikelihood = useMemo(() => {
    if (!locations || stopsAheadWithDistance.length === 0) {
      return null;
    }

    // Find the first truck stop or rest area in range
    const nextStop = stopsAheadWithDistance.find(
      stop => stop.facilityKind === 'truck stop' || stop.facilityKind === 'rest area'
    );

    if (!nextStop) {
      return null;
    }

    // Find full location object for profile mapping
    const location = locations.find(loc => loc.id === nextStop.id);
    if (!location) {
      return null;
    }

    const profile = locationToStopProfile(location);
    if (!profile) {
      return null;
    }

    const result = getParkingLikelihood(profile, Date.now());
    return {
      ...result,
      stopName: nextStop.name,
      stopId: nextStop.id,
    };
  }, [locations, stopsAheadWithDistance]);

  // Log parking ping when likelihood is shown (fire-and-forget)
  useEffect(() => {
    if (parkingLikelihood?.stopId) {
      logParkingPing(parkingLikelihood.stopId);
    }
  }, [parkingLikelihood?.stopId]);

  const handleSearchButton = (searchType: SearchType) => {
    if (activeSearch === searchType) {
      setActiveSearch(null);
    } else {
      setActiveSearch(searchType);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen text-sm text-slate-600">
        Loading locations...
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white text-slate-900">
      <div className="flex h-full flex-col">
        <div className="flex flex-wrap items-center gap-3 border-b px-3 py-2 text-xs">
          <span className="font-medium">Driving</span>
          <span>Tracking: {isTracking ? 'On' : 'Off'}</span>
          <span>Speed: {position?.speed ? `${Math.round(position.speed * 2.237)} mph` : '--'}</span>
          <span>Heading: {position?.heading !== null && position?.heading !== undefined ? `${Math.round(position.heading)}°` : '--'}</span>
        </div>

        {error && (
          <div className="border-b px-3 py-2 text-xs text-red-600">
            GPS: {error}
          </div>
        )}

        {showLocationBanner && (
          <div className="border-b px-3 py-2 bg-blue-50 text-blue-900 text-xs flex items-start gap-2">
            <div className="flex-1">
              <strong>Privacy:</strong> {LOCATION_DISCLOSURE}
            </div>
            <button
              onClick={dismissLocationBanner}
              className="shrink-0 text-blue-900 hover:text-blue-700"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex-1 min-h-0 relative">
          <TrackingMap
            position={position}
            stopsAhead={stopsAheadWithDistance}
            selectedStop={selectedStop}
            onStopSelect={handleSelectStop}
          />
          <DrivingHudOverlay
            pois={stopsAheadWithDistance}
            maxDistanceMiles={currentRange}
            onPinSelect={handleSelectStop}
          />
          {parkingLikelihood && (
            <ParkingHudBadge
              status={parkingLikelihood.status}
              explanation={parkingLikelihood.explanation}
              showExplanation={showExplanation}
              visible={true}
            />
          )}
          <TruckerAiHudControl context={aiContext} />
        </div>

        <div className="border-t px-3 py-2 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {SEARCH_BUTTONS.map(searchType => {
              const isActive = activeSearch === searchType;
              return (
                <button
                  key={searchType}
                  onClick={() => handleSearchButton(searchType)}
                  className={`border px-2 py-1 ${isActive ? 'bg-slate-200' : 'bg-white'}`}
                >
                  {SEARCH_LABELS[searchType]}
                </button>
              );
            })}
            <span className="text-slate-600">Range: {currentRange} mi</span>
          </div>

          <div className="mt-2 grid gap-3 md:grid-cols-2">
            <div>
              <div className="font-medium">Stops Ahead</div>
              {!position ? (
                <div className="text-slate-500">Waiting for GPS...</div>
              ) : stopsAheadWithDistance.length === 0 ? (
                <div className="text-slate-500">No stops in range.</div>
              ) : (
                <div className="mt-1 max-h-36 overflow-auto border">
                  {stopsAheadWithDistance.map(stop => (
                    <button
                      key={stop.id}
                      onClick={() => handleSelectStop(stop)}
                      className={`flex w-full items-start justify-between gap-2 border-b px-2 py-1 text-left ${selectedStop?.id === stop.id ? 'bg-slate-100' : ''}`}
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{stop.name}</div>
                        <div className="text-slate-600">{stop.facilityKind || 'Location'}</div>
                      </div>
                      <div className="shrink-0 text-slate-700">{stop.distanceMiles.toFixed(1)} mi</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="font-medium">Details</div>
              {!selectedStop ? (
                <div className="text-slate-500">Select a stop to view details.</div>
              ) : (
                <div className="mt-1 border p-2">
                  <div className="font-medium">{selectedStop.name}</div>
                  <div className="text-slate-600">{selectedStop.facilityKind || 'Location'}</div>
                  <div className="text-slate-600">{selectedStop.distanceMiles.toFixed(1)} miles ahead</div>
                  {selectedStop.address && (
                    <div className="text-slate-600">{selectedStop.address}</div>
                  )}
                  {selectedStop.hoursOfOperation && (
                    <div className="text-slate-600">Hours: {selectedStop.hoursOfOperation}</div>
                  )}
                  {selectedStop.notes && (
                    <div className="text-slate-600">Notes: {selectedStop.notes}</div>
                  )}
                  
                  {/* Show parking likelihood if this is the same stop as HUD */}
                  {parkingLikelihood && selectedStop.id === stopsAheadWithDistance.find(
                    s => s.facilityKind === 'truck stop' || s.facilityKind === 'rest area'
                  )?.id && (
                    <div className="mt-2 pt-2 border-t">
                      <div className="text-xs font-medium text-slate-700 mb-1">Parking Likelihood</div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          parkingLikelihood.status === 'LIKELY_AVAILABLE' ? 'bg-green-100 text-green-700' :
                          parkingLikelihood.status === 'UNCERTAIN' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {parkingLikelihood.status === 'LIKELY_AVAILABLE' ? '🟢 Available' :
                           parkingLikelihood.status === 'UNCERTAIN' ? '🟡 Uncertain' :
                           '🔴 Likely Full'}
                        </span>
                      </div>
                      {showExplanation && (
                        <div className="text-xs text-slate-600 mt-1">
                          {parkingLikelihood.explanation}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
