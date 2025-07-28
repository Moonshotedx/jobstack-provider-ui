import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Search, ZoomIn, ZoomOut, MapPin, Crosshair, X, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTakeApplicationAction, useActiveOrganizationId } from '@/hooks/useJobsApi';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';


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
  onTakeAction?: (applicantId: string, action: 'accept' | 'reject') => Promise<void>;
  loadingStates?: Record<string, 'accept' | 'reject' | null>;
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
        1
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

// Custom cluster icon function
const createClusterIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  let size = 44;
  let color = '#3b82f6';
  
  if (count >= 20) {
    size = 52;
    color = '#1e3a8a';
  } else if (count >= 10) {
    size = 48;
    color = '#2563eb';
  } else if (count >= 5) {
    size = 46;
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
        font-size: ${size > 48 ? '16px' : '14px'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        cursor: pointer;
        transition: transform 0.2s ease;
      " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
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
  zoom = 5,
  onTakeAction,
  loadingStates = {}
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const clusterGroupRef = useRef<any>(null);
  const currentLocationMarkerRef = useRef<L.Marker | null>(null);
  const previousSelectedApplicantRef = useRef<ApplicantLocation | null>(null);
  const takeApplicationAction = useTakeApplicationAction();
  const activeOrganizationId = useActiveOrganizationId();

  const handleAccept = async () => {
    if (selectedApplicant) {
      if (onTakeAction) {
        try {
          await onTakeAction(selectedApplicant.id, 'accept');
          toast.success('Applicant accepted successfully');
        } catch (error) {
          toast.error('Failed to accept applicant');
        }
      } else if (activeOrganizationId) {
        try {
          await takeApplicationAction.mutateAsync({
            organizationId: activeOrganizationId,
            actionData: {
              applicationId: selectedApplicant.id,
              action: 'accept',
              applicationStatus: 'Shortlisted',
            },
          });
          toast.success('Applicant accepted successfully');
        } catch (error) {
          toast.error('Failed to accept applicant');
        }
      }
    }
  };

  const handleReject = async () => {
    if (selectedApplicant) {
      if (onTakeAction) {
        try {
          await onTakeAction(selectedApplicant.id, 'reject');
          toast.success('Applicant rejected successfully');
        } catch (error) {
          toast.error('Failed to reject applicant');
        }
      } else if (activeOrganizationId) {
        try {
          await takeApplicationAction.mutateAsync({
            organizationId: activeOrganizationId,
            actionData: {
              applicationId: selectedApplicant.id,
              action: 'reject',
              applicationStatus: 'Rejected',
            },
          });
          toast.success('Applicant rejected successfully');
        } catch (error) {
          toast.error('Failed to reject applicant');
        }
      }
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
      zoomControl: false,
      doubleClickZoom: false, // Disable double-click zoom on mobile
      dragging: true,
      touchZoom: true,
      scrollWheelZoom: true,
      boxZoom: false,
      keyboard: false,
      bounceAtZoomLimits: false
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
      disableClusteringAtZoom: 16, // Disable clustering at high zoom levels for better mobile experience
      spiderfyDistanceMultiplier: 1.5, // Increase distance for better touch targets
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

    // Add touch-friendly interactions
    map.on('click', () => {
      // Close any open popups when clicking on the map
      map.closePopup();
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
        <div style="
          padding: 12px; 
          min-width: 200px; 
          max-width: 280px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
            <h3 style="font-weight: 600; font-size: 14px; margin: 0; color: #1f2937;">${applicant.name}</h3>
            <button style="
              background: none;
              border: none;
              color: #6b7280;
              cursor: pointer;
              font-size: 18px;
              padding: 0;
              line-height: 1;
              width: 20px;
              height: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 4px;
              transition: background-color 0.2s;
            " onmouseover="this.style.backgroundColor='#f3f4f6'" onmouseout="this.style.backgroundColor='transparent'" onclick="this.closest('.leaflet-popup').remove()">×</button>
          </div>
          <p style="font-size: 12px; color: #6b7280; margin-bottom: 8px; line-height: 1.4;">${applicant.location}</p>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 13px; font-weight: 500; color: #374151;">${applicant.age} years</span>
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

      marker.bindPopup(popupContent, {
        closeButton: false,
        autoClose: false,
        className: 'custom-popup',
        offset: [0, -35], // Position popup further above the marker to avoid covering it
        maxWidth: 300,
        minWidth: 200,
        maxHeight: 400,
        keepInView: true,
        autoPan: true,
        autoPanPadding: [50, 50]
      });

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

  // Refresh cluster group when selectedApplicant changes to null (modal closed)
  useEffect(() => {
    // Check if we just closed the modal (had a selected applicant, now null)
    if (previousSelectedApplicantRef.current && selectedApplicant === null && clusterGroupRef.current && mapInstanceRef.current) {
      // Add a small delay to ensure the modal is fully closed before refreshing clusters
      setTimeout(() => {
        if (clusterGroupRef.current && mapInstanceRef.current) {
          // Force refresh the cluster group to regain proper clustering
          const currentCenter = mapInstanceRef.current.getCenter();
          const currentZoom = mapInstanceRef.current.getZoom();
          
          // Temporarily remove and re-add the cluster group to force refresh
          mapInstanceRef.current.removeLayer(clusterGroupRef.current);
          mapInstanceRef.current.addLayer(clusterGroupRef.current);
          
          // Restore the view
          mapInstanceRef.current.setView(currentCenter, currentZoom);
        }
      }, 100); // Small delay to ensure modal animation is complete
    }
    
    // Update the previous selected applicant ref
    previousSelectedApplicantRef.current = selectedApplicant || null;
  }, [selectedApplicant]);

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
      
      {/* Map Search and Filter Controls - Mobile Responsive */}
      <div className="absolute z-[1000] top-4 left-4 right-4 md:w-80 md:right-auto map-search-card">
        <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
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
                className="pl-10 h-10 md:h-9"
              />
            </div>

            {/* Stats */}
            <div className="text-xs text-muted-foreground">
              Showing {filteredApplicants.length} of {applicants.length} applicants
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Controls - Mobile Responsive */}
      <div className="absolute z-[1000] top-4 right-4 flex flex-col gap-2 map-controls">
        <Button
          variant="outline"
          size="icon"
          className="bg-white/95 backdrop-blur-sm shadow-lg border-0 h-10 w-10 md:h-9 md:w-9"
          onClick={handleZoomIn}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="bg-white/95 backdrop-blur-sm shadow-lg border-0 h-10 w-10 md:h-9 md:w-9"
          onClick={handleZoomOut}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="bg-white/95 backdrop-blur-sm shadow-lg border-0 h-10 w-10 md:h-9 md:w-9"
          onClick={handleFindLocation}
        >
          <Crosshair className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Selected Applicant Info - Mobile Responsive */}
      {selectedApplicant && (
        <div className="absolute z-[1000] bottom-4 left-4 right-4 md:top-4 md:left-96 md:w-80 md:right-auto md:bottom-auto map-applicant-card">
          <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm max-h-[60vh] md:max-h-none overflow-hidden">
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
                    className="h-8 w-8 p-0 hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 map-applicant-info overflow-y-auto max-h-[calc(60vh-80px)] md:max-h-none">
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
                <div className="flex flex-wrap gap-1 map-skills">
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
              
              {/* Action Buttons - Show for open/applied status */}
              {(selectedApplicant.status === 'open' || selectedApplicant.status === 'applied') && (
                <div className="flex gap-2 mt-4 map-action-buttons">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReject}
                    disabled={loadingStates[selectedApplicant.id] === 'reject' || loadingStates[selectedApplicant.id] === 'accept'}
                    className="flex-1 h-10 md:h-8"
                  >
                    {loadingStates[selectedApplicant.id] === 'reject' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAccept}
                    disabled={loadingStates[selectedApplicant.id] === 'accept' || loadingStates[selectedApplicant.id] === 'reject'}
                    className="flex-1 h-10 md:h-8"
                  >
                    {loadingStates[selectedApplicant.id] === 'accept' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Accepting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Accept
                      </>
                    )}
                  </Button>
                </div>
              )}
              
              {/* Show status for other statuses */}
              {(selectedApplicant.status === 'shortlisted' || selectedApplicant.status === 'rejected') && (
                <div className="flex items-center gap-2 mt-4 p-2 bg-muted rounded">
                  {selectedApplicant.status === 'shortlisted' ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">Shortlisted</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-600">Rejected</span>
                    </>
                  )}
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