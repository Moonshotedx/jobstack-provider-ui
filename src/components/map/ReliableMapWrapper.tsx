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
  groupIndex?: number;
  groupSize?: number;
  originalLat?: number;
  originalLng?: number;
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

  // Create marker icon with optional count indicator
  const createMarkerIcon = useCallback((status: string, count: number = 1, isGroupCenter: boolean = false) => {
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
    const size = count > 1 && isGroupCenter ? 36 : 28; // Larger for group centers
    const radius = count > 1 && isGroupCenter ? 14 : 10;
    const fontSize = count > 1 && isGroupCenter ? 12 : 10;
    const textY = count > 1 && isGroupCenter ? size/2 + 4 : 18;
    
    // Show count if more than 1, otherwise just show individual marker
    const displayText = count > 1 && isGroupCenter ? count.toString() : '•';
    
    const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="${color}" stroke="white" stroke-width="3"/>
      <text x="${size/2}" y="${textY}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" text-anchor="middle" fill="white">${displayText}</text>
    </svg>`;

    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: new window.google.maps.Size(size, size),
      anchor: new window.google.maps.Point(size/2, size/2),
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

  // Group applicants by location and create offset positions to avoid overlapping markers
  const applicantsWithOffsets = React.useMemo(() => {
    const locationGroups = new Map<string, ApplicantLocation[]>();
    
    // Group applicants by their coordinates (rounded to avoid floating point precision issues)
    filteredApplicants.forEach(applicant => {
      const locationKey = `${applicant.lat.toFixed(4)},${applicant.lng.toFixed(4)}`;
      if (!locationGroups.has(locationKey)) {
        locationGroups.set(locationKey, []);
      }
      locationGroups.get(locationKey)!.push(applicant);
    });
    
    // Create offset positions for applicants at the same location
    const offsetApplicants: (ApplicantLocation & { originalLat: number; originalLng: number; groupSize: number; groupIndex: number })[] = [];
    
    locationGroups.forEach((group, _) => {
      if (group.length === 1) {
        // Single applicant, no offset needed
        offsetApplicants.push({
          ...group[0],
          originalLat: group[0].lat,
          originalLng: group[0].lng,
          groupSize: 1,
          groupIndex: 0
        });
      } else {
        // Multiple applicants at the same location, create circular offset pattern
        const baseRadius = 0.001; // Approximately 100 meters
        const radius = Math.max(baseRadius, baseRadius * Math.sqrt(group.length / 4)); // Scale radius based on group size
        
        group.forEach((applicant, index) => {
          let offsetLat = applicant.lat;
          let offsetLng = applicant.lng;
          
          if (index > 0) {
            // Create circular pattern around the original position
            const angle = (2 * Math.PI * index) / group.length;
            offsetLat = applicant.lat + (radius * Math.cos(angle));
            offsetLng = applicant.lng + (radius * Math.sin(angle));
          }
          
          offsetApplicants.push({
            ...applicant,
            lat: offsetLat,
            lng: offsetLng,
            originalLat: applicant.lat,
            originalLng: applicant.lng,
            groupSize: group.length,
            groupIndex: index
          });
        });
      }
    });
    
    return offsetApplicants;
  }, [filteredApplicants]);

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
        {/* Render Markers with offset positions */}
        {applicantsWithOffsets.map((applicant) => {
          const isGroupCenter = applicant.groupIndex === 0 && applicant.groupSize > 1;
          const title = applicant.groupSize > 1 && isGroupCenter 
            ? `${applicant.groupSize} applicants at this location` 
            : applicant.name;
          
          return (
            <Marker
              key={applicant.id}
              position={{ lat: applicant.lat, lng: applicant.lng }}
              title={title}
              icon={createMarkerIcon(applicant.status, applicant.groupSize, isGroupCenter)}
              onClick={() => {
                setSelectedMarker(applicant);
                onApplicantClick?.(applicant);
                if (mapRef) {
                  // Pan to original location for group centers, or offset location for individuals
                  const panLat = isGroupCenter ? applicant.originalLat : applicant.lat;
                  const panLng = isGroupCenter ? applicant.originalLng : applicant.lng;
                  mapRef.panTo({ lat: panLat, lng: panLng });
                  mapRef.setZoom(15);
                }
              }}
            />
          );
        })}

        {/* Info Window for Selected Marker */}
        {selectedMarker && (() => {
          const isGroupCenter = selectedMarker.groupIndex! === 0 && selectedMarker.groupSize! > 1;
          const sameLocationApplicants = isGroupCenter 
            ? applicantsWithOffsets.filter(app => 
                app.originalLat.toFixed(4) === selectedMarker.originalLat!.toFixed(4) && 
                app.originalLng.toFixed(4) === selectedMarker.originalLng!.toFixed(4)
              )
            : [selectedMarker];
          
          return (
            <InfoWindow
              position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
              onCloseClick={() => {
                setSelectedMarker(null);
                onApplicantClick?.(null);
              }}
            >
              <div style={{ padding: '12px', minWidth: '200px', maxWidth: '320px', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
                {isGroupCenter ? (
                  // Group info window
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                      <h3 style={{ fontWeight: '600', fontSize: '14px', margin: '0', color: '#1f2937' }}>
                        {selectedMarker.groupSize} Applicants at this Location
                      </h3>
                      <span style={{ 
                        fontSize: '11px', 
                        padding: '3px 8px', 
                        borderRadius: '12px', 
                        fontWeight: '500', 
                        backgroundColor: '#e0f2fe', 
                        color: '#0277bd' 
                      }}>
                        Group
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '12px' }}>{selectedMarker.location}</p>
                    <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {sameLocationApplicants.map((applicant, index) => (
                        <div key={applicant.id} style={{ 
                          marginBottom: '8px', 
                          padding: '6px', 
                          backgroundColor: index % 2 === 0 ? '#f9fafb' : 'white',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }} onClick={() => onApplicantClick?.(applicant)}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: '500', fontSize: '12px', color: '#1f2937' }}>{applicant.name}</span>
                            <span style={{ 
                              fontSize: '10px', 
                              padding: '2px 6px', 
                              borderRadius: '8px', 
                              backgroundColor: {
                                'shortlisted': '#dcfce7', 'closed': '#dcfce7',
                                'rejected': '#fef2f2', 'archived': '#fef2f2',
                                'interview': '#fff7ed',
                                'hired': '#dbeafe'
                              }[applicant.status.toLowerCase()] || '#f3f4f6',
                              color: {
                                'shortlisted': '#166534', 'closed': '#166534',
                                'rejected': '#dc2626', 'archived': '#dc2626',
                                'interview': '#c2410c',
                                'hired': '#1e40af'
                              }[applicant.status.toLowerCase()] || '#374151'
                            }}>
                              {applicant.status}
                            </span>
                          </div>
                          <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '2px' }}>
                            Age: {applicant.age} • {applicant.email}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '8px', fontStyle: 'italic' }}>
                      💡 Click on any applicant above to view details, or zoom in to see individual markers
                    </div>
                  </>
                ) : (
                  // Individual applicant info window
                  <>
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
                    {selectedMarker.groupSize! > 1 && (
                      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '8px', fontStyle: 'italic' }}>
                        💡 Part of a group of {selectedMarker.groupSize} applicants at this location
                      </div>
                    )}
                  </>
                )}
              </div>
            </InfoWindow>
          );
        })()}
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
