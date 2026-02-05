import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
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

interface LocationInfo {
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
  onCenterChange?: (center: [number, number]) => void;
}

function MarkerClusterLayer({ pins }: { pins: PinData[] }) {
  const map = useMap();

  useEffect(() => {
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

    pins.forEach((pin) => {
      const lat = parseFloat(pin.lat);
      const lng = parseFloat(pin.lng);
      if (isNaN(lat) || isNaN(lng)) return;

      const icon = pin.isSeeded ? seededIcon : (pin.type === 'entry' ? entryIcon : exitIcon);

      const marker = L.marker([lat, lng], { icon });

      let popupContent = '';
      if (pin.locationInfo) {
        popupContent = `
          <div style="min-width: 180px; font-family: system-ui, sans-serif;">
            <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${pin.locationInfo.name}</div>
            <div style="font-size: 12px; color: #666; text-transform: capitalize; margin-bottom: 8px;">${pin.locationInfo.facilityKind}</div>
            <div style="font-size: 12px; margin-bottom: 4px;">${pin.locationInfo.address}</div>
            ${pin.locationInfo.hoursOfOperation ? `<div style="font-size: 12px; color: #666;">Hours: ${pin.locationInfo.hoursOfOperation}</div>` : ''}
          </div>
        `;
      } else {
        popupContent = `<strong>${pin.type.toUpperCase()}</strong>: ${pin.label}`;
      }

      marker.bindPopup(popupContent);
      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);

    return () => {
      map.removeLayer(clusterGroup);
    };
  }, [map, pins]);

  return null;
}

function MapClickHandler({ onClick }: { onClick?: (lat: string, lng: string) => void }) {
  useMapEvents({
    click(e) {
      if (onClick) {
        onClick(e.latlng.lat.toString(), e.latlng.lng.toString());
      }
    },
  });
  return null;
}

export function ClusteredMap({ 
  center = [39.8283, -98.5795],
  zoom = 4,
  pins = [],
  className
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
        <MarkerClusterLayer pins={pins} />
      </MapContainer>
    </div>
  );
}
