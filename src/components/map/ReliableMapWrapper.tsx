import React, { useEffect, useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from "@react-google-maps/api";
import { Search, ZoomIn, ZoomOut, MapPin, Crosshair, X, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

type ReliableMapWrapperProps = {
  applicants?: ApplicantLocation[];
  onApplicantClick?: (applicant: ApplicantLocation | null) => void;
  selectedApplicant?: ApplicantLocation | null;
  mapCenter?: LatLng;
  zoom?: number;
  className?: string;
  minHeight?: string;
  active?: boolean; // use this if inside a tab/collapsible
  onTakeAction?: (applicantId: string, action: 'accept' | 'reject') => Promise<void>;
  loadingStates?: Record<string, 'accept' | 'reject' | null>;
};

const ReliableMapWrapper: React.FC<ReliableMapWrapperProps> = ({
  applicants = [],
  onApplicantClick,
  selectedApplicant,
  mapCenter = { lat: 20.5937, lng: 78.9629 }, // Center of India
  zoom = 5,
  className = "w-full h-[600px]",
  minHeight = "600px",
  active = true,
  onTakeAction,
  loadingStates = {}
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"]
  });

  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarker, setSelectedMarker] = useState<ApplicantLocation | null>(null);

  // 🔄 Fix for when map is inside hidden tab/collapsible
  useEffect(() => {
    if (active && mapRef && window.google) {
      window.google.maps.event.trigger(mapRef, "resize");
      mapRef.setCenter(mapCenter);
    }
  }, [active, mapRef, mapCenter]);

  const containerStyle = {
    width: "100%",
    height: "100%",
    minHeight,
  };

  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: false, // We'll use custom controls
    mapTypeControl: false,
    scaleControl: true,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: false,
    restriction: {
      latLngBounds: {
        north: 37.09024,
        south: 8.0883064,
        west: 68.1766451,
        east: 97.4025619,
      },
      strictBounds: false,
    },
  };

  // Create marker icon
  const createMarkerIcon = useCallback((status: string) => {
    const getStatusColor = (status: string) => {
      switch (status.toLowerCase()) {
        case 'shortlisted':
        case 'closed':
          return '#16a34a';
        case 'rejected':
        case 'archived':
          return '#dc2626';
        case 'interview':
          return '#ea580c';
        case 'hired':
          return '#2563eb';
        default:
          return '#3b82f6';
      }
    };

    const color = getStatusColor(status);
    const svg = `<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="14" r="10" fill="${color}" stroke="white" stroke-width="3"/>
      <text x="14" y="18" font-family="Arial, sans-serif" font-size="10" font-weight="bold" text-anchor="middle" fill="white">1</text>
    </svg>`;

    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: new window.google.maps.Size(28, 28),
      anchor: new window.google.maps.Point(14, 14),
    };
  }, []);

  // Filter applicants
  const filteredApplicants = React.useMemo(() => {
    return applicants.filter(applicant => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        applicant.name.toLowerCase().includes(query) ||
        applicant.location.toLowerCase().includes(query) ||
        applicant.skills.some(skill => 
          (typeof skill === 'string' ? skill : skill.name).toLowerCase().includes(query)
        )
      );
    });
  }, [applicants, searchQuery]);

  // Action handlers
  const handleAccept = async (applicant: ApplicantLocation) => {
    if (!onTakeAction) return;
    
    try {
      await onTakeAction(applicant.id, 'accept');
      toast.success('Applicant accepted successfully');
    } catch (error) {
      toast.error('Failed to accept applicant');
    }
  };

  const handleReject = async (applicant: ApplicantLocation) => {
    if (!onTakeAction) return;
    
    try {
      await onTakeAction(applicant.id, 'reject');
      toast.success('Applicant rejected successfully');
    } catch (error) {
      toast.error('Failed to reject applicant');
    }
  };

  // Map controls
  const handleZoomIn = () => {
    if (mapRef) {
      const currentZoom = mapRef.getZoom() || 5;
      mapRef.setZoom(currentZoom + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapRef) {
      const currentZoom = mapRef.getZoom() || 5;
      mapRef.setZoom(Math.max(currentZoom - 1, 1));
    }
  };

  const handleFindLocation = () => {
    if (mapRef && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const latLng = { lat: latitude, lng: longitude };
          mapRef.panTo(latLng);
          mapRef.setZoom(15);
        },
        () => {
          toast.error("Could not get your current location");
        }
      );
    }
  };

  // Handle load error
  if (loadError) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full h-full flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg">
          <div className="text-center p-8 max-w-md">
            <div className="text-red-600 mb-4 text-4xl">⚠️</div>
            <div className="text-gray-700 text-sm mb-4 font-medium">Google Maps Load Error</div>
            <div className="text-gray-600 text-xs mb-4 bg-red-50 p-3 rounded border text-left">
              {loadError.message}
            </div>
            <div className="text-gray-500 text-xs space-y-1 mb-4">
              <div>Please check:</div>
              <div>• Google Maps API key configuration</div>
              <div>• API key permissions and restrictions</div>
              <div>• Network connectivity</div>
            </div>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Reload Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (!isLoaded) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full h-full flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
            <div className="text-gray-600 text-sm">Loading Google Maps...</div>
            <div className="text-gray-500 text-xs mt-2">Please wait</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={zoom}
        onLoad={(map) => {
          console.log('✅ Google Map loaded successfully');
          setMapRef(map);
        }}
        options={mapOptions}
      >
        {/* Render Markers */}
        {filteredApplicants.map((applicant) => (
          <Marker
            key={applicant.id}
            position={{ lat: applicant.lat, lng: applicant.lng }}
            title={applicant.name}
            icon={createMarkerIcon(applicant.status)}
            onClick={() => {
              setSelectedMarker(applicant);
              onApplicantClick?.(applicant);
              if (mapRef) {
                mapRef.panTo({ lat: applicant.lat, lng: applicant.lng });
                mapRef.setZoom(15);
              }
            }}
          />
        ))}

        {/* Info Window for Selected Marker */}
        {selectedMarker && (
          <InfoWindow
            position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
            onCloseClick={() => {
              setSelectedMarker(null);
              onApplicantClick?.(null);
            }}
          >
            <div style={{ padding: '12px', minWidth: '200px', maxWidth: '280px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                <h3 style={{ fontWeight: '600', fontSize: '14px', margin: '0', color: '#1f2937' }}>{selectedMarker.name}</h3>
                <span style={{ 
                  fontSize: '11px', 
                  padding: '3px 8px', 
                  borderRadius: '12px', 
                  fontWeight: '500', 
                  backgroundColor: '#f3f4f6', 
                  color: '#374151' 
                }}>
                  {selectedMarker.status}
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '8px' }}>{selectedMarker.location}</p>
              <div style={{ fontSize: '12px', color: '#374151' }}>Age: {selectedMarker.age} years</div>
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '8px' }}>
                📧 {selectedMarker.email}<br/>
                📞 {selectedMarker.phone}
              </div>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>

      {/* Search Controls */}
      <div className="absolute z-[1000] top-4 left-4 right-4 md:w-80 md:right-auto">
        <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Applicant Locations ({filteredApplicants.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search applicants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
            <div className="text-xs text-muted-foreground">
              Showing {filteredApplicants.length} of {applicants.length} applicants
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Controls */}
      <div className="absolute z-[1000] top-4 right-4 flex flex-col gap-2">
        <Button variant="outline" size="icon" className="bg-white/95 backdrop-blur-sm shadow-lg border-0 h-9 w-9" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="bg-white/95 backdrop-blur-sm shadow-lg border-0 h-9 w-9" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="bg-white/95 backdrop-blur-sm shadow-lg border-0 h-9 w-9" onClick={handleFindLocation}>
          <Crosshair className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Selected Applicant Panel */}
      {selectedApplicant && (
        <div className="absolute z-[1000] bottom-4 left-4 right-4 md:top-4 md:left-96 md:w-80 md:right-auto md:bottom-auto">
          <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Selected Applicant</span>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedApplicant.status}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => onApplicantClick?.(null)} className="h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-medium text-sm">{selectedApplicant.name}</h4>
                <p className="text-xs text-muted-foreground">{selectedApplicant.location}</p>
              </div>
              <div className="text-xs space-y-1">
                <div>Age: {selectedApplicant.age} years</div>
                <div>Email: {selectedApplicant.email}</div>
                <div>Phone: {selectedApplicant.phone}</div>
              </div>
              
              {onTakeAction && (selectedApplicant.status === 'open' || selectedApplicant.status === 'applied') && (
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={() => handleReject(selectedApplicant)} disabled={!!loadingStates[selectedApplicant.id]} className="flex-1">
                    {loadingStates[selectedApplicant.id] === 'reject' ? (
                      <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Rejecting...</>
                    ) : (
                      <><XCircle className="h-4 w-4 mr-1" />Reject</>
                    )}
                  </Button>
                  <Button size="sm" onClick={() => handleAccept(selectedApplicant)} disabled={!!loadingStates[selectedApplicant.id]} className="flex-1">
                    {loadingStates[selectedApplicant.id] === 'accept' ? (
                      <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Accepting...</>
                    ) : (
                      <><CheckCircle className="h-4 w-4 mr-1" />Accept</>
                    )}
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

export default ReliableMapWrapper;
