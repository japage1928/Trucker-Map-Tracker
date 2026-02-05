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

export type FullnessStatus = "empty" | "moderate" | "limited" | "full" | null;

export interface LocationInfo {
  name: string;
  address: string;
  facilityKind: string;
  hoursOfOperation: string;
  notes?: string | null;
  id: string;
  fullnessStatus?: FullnessStatus;
}

const fullnessColors: Record<string, string> = {
  empty: "#22c55e",      // green
  moderate: "#eab308",   // yellow
  limited: "#f97316",    // orange
  full: "#ef4444",       // red
};

interface PinData {
  id?: string;
  type: 'entry' | 'exit';
  lat: string;
  lng: string;
  label: string;
  isSeeded?: boolean;
  locationInfo?: LocationInfo;
  fullnessStatus?: FullnessStatus;
}

interface ClusteredMapProps {
  center?: [number, number];
  zoom?: number;
  pins?: PinData[];
  className?: string;
  onMarkerClick?: (location: LocationInfo) => void;
  userLocation?: [number, number] | null;
  flyToLocation?: [number, number] | null;
}

function MapViewController({ flyTo, zoom }: { flyTo: [number, number] | null, zoom: number }) {
  const map = useMap();
  const lastFlyToRef = useRef<string | null>(null);

  useEffect(() => {
    if (flyTo) {
      const key = `${flyTo[0]},${flyTo[1]}`;
      if (lastFlyToRef.current !== key) {
        lastFlyToRef.current = key;
        map.flyTo(flyTo, zoom, { duration: 1 });
      }
    }
  }, [map, flyTo, zoom]);

  return null;
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
        <div style="position: relative; width: 24px; height: 24px;">
          <div style="
            position: absolute;
            width: 24px;
            height: 24px;
            background: #3b82f6;
            border: 4px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 10px rgba(59, 130, 246, 0.6);
            z-index: 2;
          "></div>
          <div style="
            position: absolute;
            width: 48px;
            height: 48px;
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

      // Determine fullness status for the colored dot
      const fullness = pin.fullnessStatus || pin.locationInfo?.fullnessStatus;
      const fullnessColor = fullness ? fullnessColors[fullness] : null;

      // Create custom icon with optional fullness dot
      let icon;
      if (fullnessColor) {
        // Custom icon with fullness indicator dot
        icon = L.divIcon({
          className: 'custom-marker-with-status',
          html: `
            <div style="position: relative;">
              <img src="${pin.isSeeded ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png' : (pin.type === 'entry' ? 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png' : 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png')}" style="width: 25px; height: 41px;" />
              <div style="
                position: absolute;
                top: -6px;
                right: -6px;
                width: 14px;
                height: 14px;
                background: ${fullnessColor};
                border: 2px solid white;
                border-radius: 50%;
                box-shadow: 0 1px 3px rgba(0,0,0,0.4);
              "></div>
            </div>
          `,
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
        });
      } else {
        icon = pin.isSeeded ? seededIcon : (pin.type === 'entry' ? entryIcon : exitIcon);
      }

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
  userLocation,
  flyToLocation
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
        <MapViewController flyTo={flyToLocation || null} zoom={12} />
        <MarkerClusterLayer pins={pins} onMarkerClick={onMarkerClick} />
        {userLocation && <UserLocationMarker position={userLocation} />}
      </MapContainer>
    </div>
  );
}
