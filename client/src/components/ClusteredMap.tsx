import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import L from 'leaflet';
import 'leaflet.markercluster';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

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

const seededIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export interface LocationInfo {
  name: string;
  address: string;
  facilityKind: string;
  hoursOfOperation: string;
  notes?: string | null;
  id: string;
}

interface PinData {
  id?: string;
  type: 'entry' | 'exit';
  lat: string;
  lng: string;
  label: string;
  isSeeded?: boolean;
  locationInfo?: LocationInfo;
}

interface ClusteredMapProps {
  center?: [number, number];
  zoom?: number;
  pins?: PinData[];
  className?: string;
  onMarkerClick?: (location: LocationInfo) => void;
  userLocation?: [number, number] | null;
}

function UserLocationMarker({ position }: { position: [number, number] }) {
  const map = useMap();
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (markerRef.current) {
      map.removeLayer(markerRef.current);
    }

    const userIcon = L.divIcon({
      className: 'user-location-marker',
      html: `
        <div style="position: relative; width: 20px; height: 20px;">
          <div style="
            position: absolute;
            width: 20px;
            height: 20px;
            background: #3b82f6;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(59, 130, 246, 0.5);
          "></div>
          <div style="
            position: absolute;
            width: 40px;
            height: 40px;
            top: -10px;
            left: -10px;
            background: rgba(59, 130, 246, 0.2);
            border-radius: 50%;
            animation: pulse-ring 2s ease-out infinite;
          "></div>
        </div>
        <style>
          @keyframes pulse-ring {
            0% { transform: scale(0.5); opacity: 1; }
            100% { transform: scale(1.5); opacity: 0; }
          }
        </style>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const marker = L.marker(position, { icon: userIcon, zIndexOffset: 1000 });
    marker.addTo(map);
    markerRef.current = marker;

    return () => {
      if (markerRef.current) {
        map.removeLayer(markerRef.current);
      }
    };
  }, [map, position]);

  return null;
}

function MarkerClusterLayer({ pins, onMarkerClick }: { pins: PinData[], onMarkerClick?: (location: LocationInfo) => void }) {
  const map = useMap();
  const clusterGroupRef = useRef<any>(null);

  useEffect(() => {
    if (clusterGroupRef.current) {
      map.removeLayer(clusterGroupRef.current);
    }

    const clusterGroup = (L as any).markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 50,
      iconCreateFunction: (cluster: any) => {
        const count = cluster.getChildCount();
        let size = 'small';
        let className = 'marker-cluster-small';
        
        if (count >= 100) {
          size = 'large';
          className = 'marker-cluster-large';
        } else if (count >= 10) {
          size = 'medium';
          className = 'marker-cluster-medium';
        }

        return L.divIcon({
          html: `<div style="
            background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
            color: white;
            width: ${size === 'large' ? 50 : size === 'medium' ? 40 : 30}px;
            height: ${size === 'large' ? 50 : size === 'medium' ? 40 : 30}px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: ${size === 'large' ? 14 : size === 'medium' ? 12 : 10}px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.3);
            border: 2px solid white;
          ">${count}</div>`,
          className: className,
          iconSize: L.point(size === 'large' ? 50 : size === 'medium' ? 40 : 30, size === 'large' ? 50 : size === 'medium' ? 40 : 30)
        });
      }
    });

    clusterGroupRef.current = clusterGroup;

    pins.forEach((pin) => {
      const lat = parseFloat(pin.lat);
      const lng = parseFloat(pin.lng);
      if (isNaN(lat) || isNaN(lng)) return;

      const icon = pin.isSeeded ? seededIcon : (pin.type === 'entry' ? entryIcon : exitIcon);

      const marker = L.marker([lat, lng], { icon });

      if (pin.locationInfo && onMarkerClick) {
        marker.on('click', () => {
          onMarkerClick(pin.locationInfo!);
        });
      }

      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);

    return () => {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
      }
    };
  }, [map, pins, onMarkerClick]);

  return null;
}

export function ClusteredMap({ 
  center = [39.8283, -98.5795],
  zoom = 4,
  pins = [],
  className,
  onMarkerClick,
  userLocation
}: ClusteredMapProps) {
  return (
    <div className={className}>
      <MapContainer 
        center={center} 
        zoom={zoom}
        scrollWheelZoom={true}
        dragging={true}
        zoomControl={true}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MarkerClusterLayer pins={pins} onMarkerClick={onMarkerClick} />
        {userLocation && <UserLocationMarker position={userLocation} />}
      </MapContainer>
    </div>
  );
}
