import { useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { TrackingState } from '@/hooks/use-tracking';
import type { POIWithDistance } from '@/lib/geo-utils';
import { offsetPosition } from '@/lib/geo-utils';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const stopIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const selectedStopIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-gold.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapController({ 
  position, 
  selectedStop 
}: { 
  position: TrackingState | null; 
  selectedStop: POIWithDistance | null;
}) {
  const map = useMap();
  const lastCenterRef = useRef<[number, number] | null>(null);

  useEffect(() => {
    if (selectedStop) {
      map.setView([selectedStop.lat, selectedStop.lng], 14, { animate: true });
      return;
    }

    if (position) {
      const heading = position.heading ?? 0;
      const [aheadLat, aheadLng] = offsetPosition(position.lat, position.lng, heading, 500);

      const newCenter: [number, number] = [aheadLat, aheadLng];
      const last = lastCenterRef.current;

      if (!last || Math.abs(last[0] - newCenter[0]) > 0.0005 || Math.abs(last[1] - newCenter[1]) > 0.0005) {
        map.setView(newCenter, 14, { animate: false });
        lastCenterRef.current = newCenter;
      }
    }
  }, [position, selectedStop, map]);

  return null;
}

function HeadingIndicator({ position }: { position: TrackingState }) {
  const heading = position.heading;
  if (heading === null) return null;

  const [endLat, endLng] = offsetPosition(position.lat, position.lng, heading, 300);

  return (
    <CircleMarker
      center={[endLat, endLng]}
      radius={4}
      pathOptions={{ 
        color: '#f97316', 
        fillColor: '#f97316', 
        fillOpacity: 0.6,
        weight: 2
      }}
    />
  );
}

interface TrackingMapProps {
  position: TrackingState | null;
  stopsAhead: POIWithDistance[];
  selectedStop: POIWithDistance | null;
  onStopSelect: (stop: POIWithDistance) => void;
}

export function TrackingMap({ position, stopsAhead, selectedStop, onStopSelect }: TrackingMapProps) {
  const defaultCenter: [number, number] = useMemo(() => {
    if (position) return [position.lat, position.lng];
    return [39.8283, -98.5795];
  }, [position]);

  return (
    <MapContainer 
      center={defaultCenter} 
      zoom={14}
      scrollWheelZoom={true}
      style={{ height: '100%', width: '100%' }}
      className="rounded-lg z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapController position={position} selectedStop={selectedStop} />

      {position && (
        <>
          <Marker position={[position.lat, position.lng]}>
            <Popup>
              <div className="text-sm">
                <div className="font-bold mb-1">Your Location</div>
                {position.speed !== null && (
                  <div>Speed: {Math.round(position.speed * 2.237)} mph</div>
                )}
                {position.heading !== null && (
                  <div>Heading: {Math.round(position.heading)}°</div>
                )}
              </div>
            </Popup>
          </Marker>
          <HeadingIndicator position={position} />
        </>
      )}

      {stopsAhead.map(stop => (
        <Marker
          key={stop.id}
          position={[stop.lat, stop.lng]}
          icon={selectedStop?.id === stop.id ? selectedStopIcon : stopIcon}
          eventHandlers={{
            click: () => onStopSelect(stop)
          }}
        >
          <Popup>
            <div className="min-w-[180px]">
              <div className="font-bold text-sm">{stop.name}</div>
              <div className="text-xs text-muted-foreground capitalize mb-1">{stop.facilityKind}</div>
              <div className="text-xs mb-1">{stop.distanceMiles.toFixed(1)} mi ahead</div>
              {stop.hoursOfOperation && (
                <div className="text-xs text-muted-foreground">Hours: {stop.hoursOfOperation}</div>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
