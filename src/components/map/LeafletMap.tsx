import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default markers in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface ApplicantLocation {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  status: string;
  age: number;
  skills: string[];
  email: string;
  phone: string;
}

interface LatLng {
  lat: number;
  lng: number;
}

interface LeafletMapProps {
  applicantLocations?: ApplicantLocation[];
  onApplicantClick?: (applicant: ApplicantLocation) => void;
  selectedApplicant?: ApplicantLocation | null;
  className?: string;
  mapCenter?: LatLng;
  zoom?: number;
}

// Custom hook to update map center and zoom
function MapUpdater({ center, zoom }: { center: LatLng; zoom: number }) {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      map.setView([center.lat, center.lng], zoom, { animate: true });
    }
  }, [center.lat, center.lng, zoom, map]);
  
  return null;
}

// Create custom icons for different applicant statuses
const createCustomIcon = (_status: string) => {
  const getStatusColor = () => {
    // Use consistent blue color for all job applicant markers
    return '#3b82f6'; // blue for all statuses
  };

  const color = getStatusColor();
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.2s ease;
      " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

const LeafletMap: React.FC<LeafletMapProps> = ({
  applicantLocations = [],
  onApplicantClick,
  className = "w-full h-full",
  mapCenter = { lat: 20.5937, lng: 78.9629 }, // Center of India
  zoom = 5
}) => {
  // Memoize the map key to force re-render when needed
  const mapKey = useMemo(() => `${mapCenter.lat}-${mapCenter.lng}-${zoom}`, [mapCenter, zoom]);

  return (
    <div className={className}>
      <MapContainer
        key={mapKey}
        center={[mapCenter.lat, mapCenter.lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        
        <MapUpdater center={mapCenter} zoom={zoom} />
        
        {/* Applicant Location Markers */}
        {applicantLocations.map((applicant) => (
          <Marker
            key={applicant.id}
            position={[applicant.lat, applicant.lng]}
            icon={createCustomIcon(applicant.status)}
            eventHandlers={{
              click: () => onApplicantClick?.(applicant),
            }}
          >
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default LeafletMap; 