import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default marker icons
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Custom Icons
const entryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const exitIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle clicks on the map to add pins
function MapClickHandler({ onClick }: { onClick: (lat: string, lng: string) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat.toString(), e.latlng.lng.toString());
    },
  });
  return null;
}

interface PinData {
  id?: string;
  type: 'entry' | 'exit';
  lat: string;
  lng: string;
  label: string;
}

interface LocationMapProps {
  interactive?: boolean;
  center?: [number, number];
  zoom?: number;
  pins?: PinData[];
  onPinAdd?: (lat: string, lng: string) => void; // Called when map is clicked
  onPinMove?: (index: number, lat: string, lng: string) => void;
  className?: string;
}

export function LocationMap({ 
  interactive = false, 
  center = [39.8283, -98.5795], // USA Center
  zoom = 4,
  pins = [],
  onPinAdd,
  onPinMove,
  className
}: LocationMapProps) {
  
  return (
    <div className={className}>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={interactive}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="map-tiles"
        />
        
        {interactive && onPinAdd && <MapClickHandler onClick={onPinAdd} />}

        {pins.map((pin, idx) => (
          <Marker
            key={pin.id || idx}
            position={[parseFloat(pin.lat), parseFloat(pin.lng)]}
            icon={pin.type === 'entry' ? entryIcon : exitIcon}
            draggable={interactive && !!onPinMove}
            eventHandlers={{
              dragend: (e) => {
                if (onPinMove) {
                  const marker = e.target;
                  const position = marker.getLatLng();
                  onPinMove(idx, position.lat.toString(), position.lng.toString());
                }
              }
            }}
          >
            <Popup className="font-sans">
              <strong>{pin.type.toUpperCase()}</strong>: {pin.label}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
