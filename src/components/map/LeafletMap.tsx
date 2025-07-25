import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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
const createCustomIcon = (status: string) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'shortlisted':
      case 'closed':
        return '#16a34a'; // green
      case 'rejected':
      case 'archived':
        return '#dc2626'; // red
      case 'interview':
        return '#ea580c'; // orange
      case 'hired':
        return '#2563eb'; // blue
      default:
        return '#6b7280'; // gray
    }
  };

  const color = getStatusColor(status);
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
      ">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
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
            <Popup closeOnClick={false} autoClose={false}>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-bold text-sm mb-1">{applicant.name}</h3>
                <p className="text-xs text-gray-600 mb-2">{applicant.location}</p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{applicant.age} years</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    applicant.status === 'shortlisted' || applicant.status === 'closed' ? 'bg-green-100 text-green-800' :
                    applicant.status === 'rejected' || applicant.status === 'archived' ? 'bg-red-100 text-red-800' :
                    applicant.status === 'interview' ? 'bg-orange-100 text-orange-800' :
                    applicant.status === 'hired' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {applicant.status}
                  </span>
                </div>
                <div className="text-xs text-gray-600 mb-2">
                  <div className="font-medium">Skills:</div>
                  <div className="mt-1">
                    {applicant.skills.slice(0, 3).map((skill, index) => (
                      <span key={index} className="inline-block bg-gray-100 rounded px-1 py-0.5 mr-1 mb-1 text-xs">
                        {skill}
                      </span>
                    ))}
                    {applicant.skills.length > 3 && (
                      <span className="text-xs text-gray-500">+{applicant.skills.length - 3} more</span>
                    )}
                  </div>
                </div>
                <div className="text-xs text-gray-600">
                  <div>📧 {applicant.email}</div>
                  <div>📞 {applicant.phone}</div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default LeafletMap; 