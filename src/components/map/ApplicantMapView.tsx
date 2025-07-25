import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Search, ZoomIn, ZoomOut, MapPin, Crosshair, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTakeApplicationAction, useActiveOrganizationId } from '@/hooks/useJobsApi';
import { Badge } from '@/components/ui/badge';


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

interface ApplicantMapViewProps {
  applicants: ApplicantLocation[];
  onApplicantClick?: (applicant: ApplicantLocation | null) => void;
  selectedApplicant?: ApplicantLocation | null;
  className?: string;
  mapCenter?: LatLng;
  zoom?: number;
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
        return '#3b82f6'; // blue for all other statuses (including 'open', 'applied', etc.)
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
        1
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Custom cluster icon function
const createClusterIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  let size = 40;
  let color = '#3b82f6';
  
  if (count >= 20) {
    size = 50;
    color = '#1e3a8a';
  } else if (count >= 10) {
    size = 45;
    color = '#2563eb';
  } else if (count >= 5) {
    size = 42;
    color = '#1d4ed8';
  }
  
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 4px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: ${size > 45 ? '14px' : '12px'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      ">
        ${count}
      </div>
    `,
    className: 'custom-cluster',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const ApplicantMapView: React.FC<ApplicantMapViewProps> = ({
  applicants = [],
  onApplicantClick,
  selectedApplicant,
  className = "w-full h-full",
  mapCenter = { lat: 20.5937, lng: 78.9629 }, // Center of India
  zoom = 5
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const clusterGroupRef = useRef<any>(null);
  const currentLocationMarkerRef = useRef<L.Marker | null>(null);
  const takeApplicationAction = useTakeApplicationAction();
  const activeOrganizationId = useActiveOrganizationId();

  const handleAccept = () => {
    if (selectedApplicant && activeOrganizationId) {
      takeApplicationAction.mutate({
        organizationId: activeOrganizationId,
        actionData: {
          applicationId: selectedApplicant.id,
          action: 'accept',
          applicationStatus: 'Shortlisted',
        },
      });
    }
  };

  const handleReject = () => {
    if (selectedApplicant && activeOrganizationId) {
      takeApplicationAction.mutate({
        organizationId: activeOrganizationId,
        actionData: {
          applicationId: selectedApplicant.id,
          action: 'reject',
          applicationStatus: 'Rejected',
        },
      });
    }
  };
  
  // State for filtering and search
  const [searchQuery, setSearchQuery] = useState('');
  // const [currentZoom, setCurrentZoom] = useState(zoom); // Removed unused
  // const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null); // Removed unused

  // Filter applicants based on search only
  const filteredApplicants = useMemo(() => {
    return applicants.filter(applicant => {
      const matchesSearch = !searchQuery || 
        applicant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        applicant.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        applicant.skills.some(skill => {
          // Handle both string and object skills
          if (typeof skill === 'string') {
            return skill.toLowerCase().includes(searchQuery.toLowerCase());
          } else if (skill && typeof skill === 'object' && 'name' in skill) {
            return skill.name.toLowerCase().includes(searchQuery.toLowerCase());
          }
          return false;
        });
      
      return matchesSearch;
    });
  }, [applicants, searchQuery]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create map instance
    const map = L.map(mapRef.current, {
      zoomControl: false
    }).setView([mapCenter.lat, mapCenter.lng], zoom);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Create marker cluster group
    const clusterGroup = (L as any).markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: true,
      zoomToBoundsOnClick: true,
      iconCreateFunction: createClusterIcon,
      animate: true,
      animateAddingMarkers: true,
    });

    clusterGroupRef.current = clusterGroup;
    map.addLayer(clusterGroup);

    // Track zoom and bounds changes
    map.on('zoomend', () => {
      // setCurrentZoom(map.getZoom()); // Removed unused
    });

    map.on('moveend', () => {
      // setMapBounds(map.getBounds()); // Removed unused
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map center and zoom
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([mapCenter.lat, mapCenter.lng], zoom, { animate: true });
    }
  }, [mapCenter.lat, mapCenter.lng, zoom]);

  // Update applicant markers
  useEffect(() => {
    if (!mapInstanceRef.current || !clusterGroupRef.current) return;

    // Clear existing markers from cluster group
    clusterGroupRef.current.clearLayers();
    markersRef.current = [];

    // Add applicant location markers to cluster group
    filteredApplicants.forEach(applicant => {
      const marker = L.marker([applicant.lat, applicant.lng], {
        icon: createCustomIcon(applicant.status)
      });

      // Add popup
      const popupContent = `
        <div style="padding: 8px; min-width: 200px; max-width: 280px;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 4px;">
            <h3 style="font-weight: bold; font-size: 14px; margin: 0;">${applicant.name}</h3>
            <button style="
              background: none;
              border: none;
              color: #666;
              cursor: pointer;
              font-size: 16px;
              padding: 0;
              line-height: 1;
            " onclick="this.closest('.leaflet-popup').remove()">×</button>
          </div>
          <p style="font-size: 12px; color: #666; margin-bottom: 8px;">${applicant.location}</p>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 14px; font-weight: 500;">${applicant.age} years</span>
            <span style="font-size: 12px; padding: 2px 8px; border-radius: 4px; background-color: ${
              applicant.status === 'shortlisted' || applicant.status === 'closed' ? '#dbeafe; color: #16a34a' :
              applicant.status === 'rejected' || applicant.status === 'archived' ? '#fef2f2; color: #dc2626' :
              applicant.status === 'interview' ? '#fff7ed; color: #ea580c' :
              applicant.status === 'hired' ? '#eff6ff; color: #2563eb' :
              '#f3f4f6; color: #6b7280'
            };">
              ${applicant.status}
            </span>
          </div>
          <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
            <div style="font-weight: 500; margin-bottom: 4px;">Skills:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 2px;">
              ${applicant.skills.slice(0, 3).map(skill => 
                `<span style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 10px;">${typeof skill === 'string' ? skill : skill.name}</span>`
              ).join('')}
              ${applicant.skills.length > 3 ? `<span style="font-size: 10px; color: #9ca3af;">+${applicant.skills.length - 3} more</span>` : ''}
            </div>
          </div>
          <div style="font-size: 11px; color: #666;">
            <div>📧 ${applicant.email}</div>
            <div>📞 ${applicant.phone}</div>
            ${applicant.expectedSalary ? `<div>💰 Expected: ${applicant.expectedSalary}</div>` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      // Add click handler
      marker.on('click', () => {
        onApplicantClick?.(applicant);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([applicant.lat, applicant.lng], 15, { // Zoom to level 15
            animate: true,
            duration: 1,
          });
        }
      });

      clusterGroupRef.current.addLayer(marker);
      markersRef.current.push(marker);
    });
  }, [filteredApplicants, onApplicantClick]);

  // Map control handlers
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleFindLocation = () => {
    if (mapInstanceRef.current && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const latLng = { lat: latitude, lng: longitude };

          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo(latLng, 15);

            // Add or move the current location marker
            if (currentLocationMarkerRef.current) {
              currentLocationMarkerRef.current.setLatLng(latLng);
            } else {
              const customIcon = L.divIcon({
                className: 'current-location-marker',
                html: `<div style="background-color: #ff4b4b; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px #ff4b4b;"></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              });
              currentLocationMarkerRef.current = L.marker(latLng, { icon: customIcon }).addTo(mapInstanceRef.current);
            }
          }
        },
        (error) => {
          console.error("Error getting current location:", error);
          // Optionally, show an error message to the user
        }
      );
    }
  };

  

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Map Search and Filter Controls */}
      <div className="absolute z-[1000] top-4 left-4 w-80">
        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Applicant Locations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search applicants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Stats */}
            <div className="text-xs text-muted-foreground">
              Showing {filteredApplicants.length} of {applicants.length} applicants
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Controls */}
      <div className="absolute z-[1000] top-4 right-4 flex flex-col gap-2">
        <Button
          variant="outline"
          size="icon"
          className="bg-white shadow-lg"
          onClick={handleZoomIn}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="bg-white shadow-lg"
          onClick={handleZoomOut}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="bg-white shadow-lg"
          onClick={handleFindLocation}
        >
          <Crosshair className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Selected Applicant Info */}
      {selectedApplicant && (
        <div className="absolute z-[1000] top-4 left-96 w-80">
          <Card className="shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Selected Applicant</span>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    selectedApplicant.status === 'shortlisted' || selectedApplicant.status === 'closed' ? 'default' :
                    selectedApplicant.status === 'rejected' || selectedApplicant.status === 'archived' ? 'destructive' :
                    selectedApplicant.status === 'interview' ? 'secondary' :
                    selectedApplicant.status === 'hired' ? 'default' :
                    'outline'
                  }>
                    {selectedApplicant.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onApplicantClick?.(null)}
                    className="h-6 w-6 p-0 hover:bg-muted"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <h4 className="font-medium text-sm">{selectedApplicant.name}</h4>
                <p className="text-xs text-muted-foreground">{selectedApplicant.location}</p>
              </div>
              <div className="text-xs space-y-1">
                <div>Age: {selectedApplicant.age} years</div>
                <div>Email: {selectedApplicant.email}</div>
                <div>Phone: {selectedApplicant.phone}</div>
                {selectedApplicant.expectedSalary && (
                  <div>Expected Salary: {selectedApplicant.expectedSalary}</div>
                )}
              </div>
              <div>
                <div className="text-xs font-medium mb-1">Skills:</div>
                <div className="flex flex-wrap gap-1">
                  {selectedApplicant.skills.slice(0, 5).map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {typeof skill === 'string' ? skill : skill.name}
                    </Badge>
                  ))}
                  {selectedApplicant.skills.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{selectedApplicant.skills.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
              {/* Only show Accept/Reject if status is open or applied */}
              {(selectedApplicant.status === 'open' || selectedApplicant.status === 'applied') && (
                <div className="flex justify-end gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReject}
                    disabled={false}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAccept}
                    disabled={false}
                  >
                    Accept
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ApplicantMapView;