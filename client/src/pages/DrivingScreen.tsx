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
import { useHOSTracking } from '@/hooks/use-hos-tracking';
import { useTrips } from '@/hooks/use-trips';
import { fetchWeatherContext, getWeatherAlert } from '@/lib/weather-adapter';
import type { WeatherContext } from '@shared/weather-types';

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
  const { hos } = useHOSTracking();
  const { trips } = useTrips();
  const [weatherContext, setWeatherContext] = useState<WeatherContext | null>(null);
  
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

  useEffect(() => {
    let cancelled = false;
    if (!position) return;

    fetchWeatherContext(position.lat, position.lng).then((context) => {
      if (cancelled || !context) return;
      const alert = getWeatherAlert(context);
      setWeatherContext({ ...context, alert });
    });

    return () => {
      cancelled = true;
    };
  }, [position]);

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
  const nextStop = stopsAheadWithDistance[0] ?? null;
  const detailStop = selectedStop ?? nextStop;
  const detailLabel = selectedStop ? 'Selected POI' : 'Next POI';

  const getDistanceTone = (distanceMiles?: number) => {
    if (distanceMiles === undefined || distanceMiles === null) return 'text-slate-200';
    if (distanceMiles <= 5) return 'text-emerald-300';
    if (distanceMiles >= 15) return 'text-red-300';
    return 'text-amber-300';
  };

  const getParkingStatusForStop = (stop?: POIWithDistance | null) => {
    if (!locations || !stop) return null;
    if (stop.facilityKind !== 'truck stop' && stop.facilityKind !== 'rest area') {
      return null;
    }
    const location = locations.find(loc => loc.id === stop.id);
    if (!location) return null;
    const profile = locationToStopProfile(location);
    if (!profile) return null;
    return getParkingLikelihood(profile, Date.now());
  };

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
      hos: hos || undefined,
      weather: weatherContext || undefined,
      trips,
    });
  }, [position, stopsAheadWithDistance, hos, weatherContext, trips]);

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
    <div className="fixed inset-0 text-slate-100">
      <div className="relative h-full w-full hud-texture">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />

        <div className="relative z-10 flex h-full flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 text-[11px] uppercase tracking-[0.2em]">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-amber-300">Drive HUD</span>
              <span className="text-white/70">Tracking {isTracking ? 'On' : 'Off'}</span>
            </div>
            <div className="flex items-center gap-4 text-white/80">
              <span>Speed {position?.speed ? `${Math.round(position.speed * 2.237)} mph` : '--'}</span>
              <span>Heading {position?.heading !== null && position?.heading !== undefined ? `${Math.round(position.heading)} deg` : '--'}</span>
            </div>
          </div>

          {error && (
            <div className="border-b border-red-500/40 bg-red-500/10 px-4 py-2 text-[11px] text-red-200">
              GPS: {error}
            </div>
          )}

          {showLocationBanner && (
            <div className="border-b border-blue-500/30 bg-blue-500/10 px-4 py-2 text-[11px] text-blue-100 flex items-start gap-2">
              <div className="flex-1">
                <strong>Privacy:</strong> {LOCATION_DISCLOSURE}
              </div>
              <button
                onClick={dismissLocationBanner}
                className="shrink-0 text-blue-100 hover:text-blue-50"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="relative flex-1 min-h-0">
            <DrivingHudOverlay
              pois={stopsAheadWithDistance}
              maxDistanceMiles={currentRange}
              onPinSelect={handleSelectStop}
            />

            <div className="absolute left-4 top-6 flex flex-col gap-4">
              <div className="glass-card px-3 py-2">
                <div className="text-[10px] uppercase tracking-[0.3em] text-white/60">Next Stop</div>
                {!nextStop ? (
                  <div className="mt-2 text-sm text-white/70">Waiting for POIs...</div>
                ) : (
                  <div className="mt-2 space-y-1">
                    <div className="text-base font-semibold text-white">{nextStop.name}</div>
                    <div className="text-xs text-white/60">{nextStop.facilityKind || 'Location'}</div>
                    <div className={`text-lg font-bold ${getDistanceTone(nextStop.distanceMiles)}`}>
                      {nextStop.distanceMiles.toFixed(1)} mi
                    </div>
                  </div>
                )}
              </div>

              <div className="glass-card px-3 py-2">
                <div className="text-[10px] uppercase tracking-[0.3em] text-white/60">Filters</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {SEARCH_BUTTONS.map(searchType => {
                    const isActive = activeSearch === searchType;
                    return (
                      <button
                        key={searchType}
                        onClick={() => handleSearchButton(searchType)}
                        className={`rounded-sm border px-2 py-1 text-[10px] uppercase tracking-[0.2em] ${
                          isActive ? 'border-amber-300 bg-amber-300/20 text-amber-100' : 'border-white/15 text-white/70'
                        }`}
                      >
                        {SEARCH_LABELS[searchType]}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 text-[10px] text-white/50">Range {currentRange} mi</div>
              </div>
            </div>

            <div className="absolute right-4 top-6 w-[260px] space-y-3">
              <div className="glass-card px-3 py-3">
                <div className="text-[10px] uppercase tracking-[0.3em] text-white/60">{detailLabel}</div>
                {!detailStop ? (
                  <div className="mt-2 text-sm text-white/70">Tap a pin to lock details.</div>
                ) : (
                  <div className="mt-2 space-y-2">
                    <div>
                      <div className="text-base font-semibold text-white">{detailStop.name}</div>
                      <div className="text-xs text-white/60">{detailStop.facilityKind || 'Location'}</div>
                    </div>
                    <div className={`text-lg font-bold ${getDistanceTone(detailStop.distanceMiles)}`}>
                      {detailStop.distanceMiles.toFixed(1)} mi ahead
                    </div>
                    {detailStop.address && (
                      <div className="text-xs text-white/70">{detailStop.address}</div>
                    )}
                    {detailStop.hoursOfOperation && (
                      <div className="text-xs text-white/70">Hours: {detailStop.hoursOfOperation}</div>
                    )}
                    {detailStop.notes && (
                      <div className="text-xs text-white/60">Notes: {detailStop.notes}</div>
                    )}
                    {(() => {
                      const status = getParkingStatusForStop(detailStop);
                      if (!status) return null;
                      return (
                        <div className="pt-2 border-t border-white/10">
                          <div className="text-[10px] uppercase tracking-[0.3em] text-white/60">Parking</div>
                          <div className="mt-1 flex items-center gap-2">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded ${
                                status.status === 'LIKELY_AVAILABLE' ? 'status-available' :
                                status.status === 'UNCERTAIN' ? 'status-uncertain' :
                                'status-full'
                              }`}
                            >
                              {status.status === 'LIKELY_AVAILABLE' ? 'Available' :
                               status.status === 'UNCERTAIN' ? 'Uncertain' :
                               'Likely Full'}
                            </span>
                          </div>
                          {showExplanation && (
                            <div className="mt-1 text-[10px] text-white/60">{status.explanation}</div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

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
        </div>
      </div>
    </div>
  );
}
