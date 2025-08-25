import React, { useEffect, useRef, useState } from 'react';
import { initializeGoogleMapsInstance } from '@/lib/google-maps-utils';
import { toast } from 'sonner';

interface ApplicantLocation {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  status: string;
  age: number;
  skills: (string | { name: string; code?: string })[];
  email: string;
  phone: string;
  experience?: string;
  expectedSalary?: string;
}

interface LatLng {
  lat: number;
  lng: number;
}

interface GoogleMapComponentProps {
  applicantLocations?: ApplicantLocation[];
  onApplicantClick?: (applicant: ApplicantLocation) => void;
  selectedApplicant?: ApplicantLocation | null;
  className?: string;
  mapCenter?: LatLng;
  zoom?: number;
}

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
  applicantLocations = [],
  onApplicantClick,
  className = "w-full h-full",
  mapCenter = { lat: 20.5937, lng: 78.9629 }, // Center of India
  zoom = 5
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        await initializeGoogleMapsInstance();
        
        if (!mapRef.current) return;

        // Create map instance
        const map = new window.google.maps.Map(mapRef.current, {
          center: mapCenter,
          zoom: zoom,
          zoomControl: true,
          mapTypeControl: false,
          scaleControl: true,
          streetViewControl: false,
          rotateControl: false,
          fullscreenControl: true,
          restriction: {
            latLngBounds: {
              north: 37.09024,
              south: 8.0883064,
              west: 68.1766451,
              east: 97.4025619,
            },
            strictBounds: false,
          },
        });

        mapInstanceRef.current = map;
        setIsLoaded(true);
      } catch (error) {
        console.error('Failed to initialize Google Maps:', error);
        setError('Failed to load Google Maps. Please check your API key and internet connection.');
        toast.error('Failed to load Google Maps');
      }
    };

    initMap();
  }, []);

  // Update map center and zoom
  useEffect(() => {
    if (mapInstanceRef.current && isLoaded) {
      mapInstanceRef.current.setCenter(mapCenter);
      mapInstanceRef.current.setZoom(zoom);
    }
  }, [mapCenter.lat, mapCenter.lng, zoom, isLoaded]);

  // Create custom marker icon based on status
  const createMarkerIcon = (status: string): google.maps.Icon => {
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
          return '#3b82f6'; // blue for all other statuses
      }
    };

    const color = getStatusColor(status);
    
    // Create a simple circular marker icon
    const svg = `
      <svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
        <circle cx="14" cy="14" r="10" fill="${color}" stroke="white" stroke-width="3"/>
        <text x="14" y="18" font-family="Arial, sans-serif" font-size="10" font-weight="bold" text-anchor="middle" fill="white">1</text>
      </svg>
    `;

    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: new window.google.maps.Size(28, 28),
      anchor: new window.google.maps.Point(14, 14),
    };
  };

  // Update applicant markers
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    applicantLocations.forEach(applicant => {
      if (!mapInstanceRef.current) return;

      const marker = new window.google.maps.Marker({
        position: { lat: applicant.lat, lng: applicant.lng },
        map: mapInstanceRef.current,
        icon: createMarkerIcon(applicant.status),
        title: applicant.name,
      });

      // Create info window content
      const infoWindowContent = `
        <div style="padding: 12px; min-width: 200px; max-width: 280px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
            <h3 style="font-weight: 600; font-size: 14px; margin: 0; color: #1f2937;">${applicant.name}</h3>
            <span style="font-size: 11px; padding: 3px 8px; border-radius: 12px; font-weight: 500; ${
              applicant.status === 'shortlisted' || applicant.status === 'closed' ? 'background-color: #dcfce7; color: #166534' :
              applicant.status === 'rejected' || applicant.status === 'archived' ? 'background-color: #fef2f2; color: #dc2626' :
              applicant.status === 'interview' ? 'background-color: #fff7ed; color: #c2410c' :
              applicant.status === 'hired' ? 'background-color: #dbeafe; color: #1e40af' :
              'background-color: #f3f4f6; color: #374151'
            };">
              ${applicant.status}
            </span>
          </div>
          <p style="font-size: 12px; color: #6b7280; margin-bottom: 8px; line-height: 1.4;">${applicant.location}</p>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 13px; font-weight: 500; color: #374151;">${applicant.age} years</span>
          </div>
          <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px;">
            <div style="font-weight: 500; margin-bottom: 4px; color: #374151;">Skills:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 3px;">
              ${applicant.skills.slice(0, 3).map(skill => 
                `<span style="background: #f9fafb; padding: 2px 6px; border-radius: 8px; font-size: 10px; color: #374151; border: 1px solid #e5e7eb;">${typeof skill === 'string' ? skill : skill.name}</span>`
              ).join('')}
              ${applicant.skills.length > 3 ? `<span style="font-size: 10px; color: #9ca3af;">+${applicant.skills.length - 3} more</span>` : ''}
            </div>
          </div>
          <div style="font-size: 11px; color: #6b7280; line-height: 1.4;">
            <div style="margin-bottom: 2px;">📧 ${applicant.email}</div>
            <div style="margin-bottom: 2px;">📞 ${applicant.phone}</div>
            ${applicant.expectedSalary ? `<div>💰 Expected: ${applicant.expectedSalary}</div>` : ''}
          </div>
        </div>
      `;

      const infoWindow = new window.google.maps.InfoWindow({
        content: infoWindowContent,
      });

      marker.addListener('click', () => {
        // Close all other info windows
        markersRef.current.forEach(m => {
          if ((m as any).infoWindow) {
            (m as any).infoWindow.close();
          }
        });

        infoWindow.open(mapInstanceRef.current, marker);
        onApplicantClick?.(applicant);
      });

      // Store info window reference on marker
      (marker as any).infoWindow = infoWindow;
      markersRef.current.push(marker);
    });
  }, [applicantLocations, onApplicantClick, isLoaded]);

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg`}>
        <div className="text-center p-8">
          <div className="text-red-600 mb-2">⚠️</div>
          <div className="text-gray-700 text-sm">{error}</div>
          <div className="text-gray-500 text-xs mt-2">
            Please check your Google Maps API key configuration
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <div className="text-gray-600 text-sm">Loading Google Maps...</div>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className={className} />;
};

export default GoogleMapComponent;
