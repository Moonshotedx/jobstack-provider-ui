import React, { useEffect, useRef, useState } from 'react';
import { Search, ZoomIn, ZoomOut, MapPin, Crosshair, X, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTakeApplicationAction, useActiveOrganizationId } from '@/hooks/useJobsApi';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { initializeGoogleMapsInstance } from '@/lib/google-maps-utils';

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

interface GoogleApplicantMapViewProps {
  applicants: ApplicantLocation[];
  onApplicantClick?: (applicant: ApplicantLocation | null) => void;
  selectedApplicant?: ApplicantLocation | null;
  className?: string;
  mapCenter?: LatLng;
  zoom?: number;
  onTakeAction?: (applicantId: string, action: 'accept' | 'reject') => Promise<void>;
  loadingStates?: Record<string, 'accept' | 'reject' | null>;
}

const GoogleApplicantMapView: React.FC<GoogleApplicantMapViewProps> = ({
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
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const currentLocationMarkerRef = useRef<google.maps.Marker | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const takeApplicationAction = useTakeApplicationAction();
  const activeOrganizationId = useActiveOrganizationId();

  // Debug: Log component lifecycle
  useEffect(() => {
    console.log('🏗️ GoogleApplicantMapView component mounted');
    return () => {
      console.log('🗑️ GoogleApplicantMapView component unmounted');
    };
  }, []);

  // Manual retry function
  const retryGoogleMapsInitialization = () => {
    setError(null);
    setIsLoaded(false);
    
    // Reset the map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current = null;
    }
    
    // Trigger re-initialization
    const initMap = async () => {
      try {
        console.log('🔄 Retrying Google Maps initialization...');
        await initializeGoogleMapsInstance();
        
        // Wait for map container to be available
        let retries = 0;
        const maxRetries = 50;
        
        const waitForContainer = () => {
          if (mapRef.current) {
            const rect = mapRef.current.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              console.log('✅ Map container found during retry with dimensions:', { width: rect.width, height: rect.height });
              
              const map = new window.google.maps.Map(mapRef.current, {
                center: mapCenter,
                zoom: zoom,
                zoomControl: false,
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
              });

              mapInstanceRef.current = map;
              setIsLoaded(true);
              toast.success('Google Maps loaded successfully!');
            } else if (retries < maxRetries) {
              retries++;
              setTimeout(waitForContainer, 100);
            } else {
              setError('Map container has no dimensions');
              toast.error('Retry failed - container has no dimensions');
            }
          } else if (retries < maxRetries) {
            retries++;
            setTimeout(waitForContainer, 100);
          } else {
            setError('Map container not available after retry');
            toast.error('Retry failed - container not found');
          }
        };
        
        waitForContainer();
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load Google Maps';
        setError(errorMessage);
        toast.error('Retry failed');
      }
    };
    
    setTimeout(initMap, 100);
  };

  // State for filtering and search
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filter applicants based on search
  const filteredApplicants = React.useMemo(() => {
    return applicants.filter(applicant => {
      const matchesSearch = !searchQuery || 
        applicant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        applicant.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        applicant.skills.some(skill => {
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

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        console.log('🗺️ Initializing Google Maps component...');
        setError(null);
        
        await initializeGoogleMapsInstance();
        console.log('✅ Google Maps instance initialized');
        
        // Wait for map container to be available with retries
        let retries = 0;
        const maxRetries = 50; // 5 seconds total (50 * 100ms)
        
        const waitForContainer = () => {
          // Add debug information about the container
          console.log('🔍 Checking container:', {
            exists: !!mapRef.current,
            containerElement: mapRef.current,
            parentElement: mapRef.current?.parentElement,
            containerHTML: mapRef.current?.outerHTML
          });
          
          if (mapRef.current) {
            // Check if the container has proper dimensions
            const rect = mapRef.current.getBoundingClientRect();
            console.log('📐 Container dimensions:', rect);
            
            if (rect.width > 0 && rect.height > 0) {
              console.log('✅ Map container found with proper dimensions:', { width: rect.width, height: rect.height });
              createMapInstance();
            } else if (retries < maxRetries) {
              retries++;
              console.log(`⏳ Container exists but has no dimensions, waiting... (attempt ${retries}/${maxRetries})`);
              setTimeout(waitForContainer, 100);
            } else {
              console.error('❌ Map container has no dimensions after maximum retries');
              setError('Map container has no dimensions. Please check CSS styling.');
            }
          } else if (retries < maxRetries) {
            retries++;
            console.log(`⏳ Waiting for map container... (attempt ${retries}/${maxRetries})`);
            setTimeout(waitForContainer, 100);
          } else {
            console.error('❌ Map container not available after maximum retries');
            setError('Map container not available. The DOM element may not be rendered correctly.');
          }
        };
        
        const createMapInstance = () => {
          try {
            console.log('🗺️ Creating map instance...');
            
            // Check if Google Maps is properly loaded
            if (!window.google || !window.google.maps) {
              throw new Error('Google Maps JavaScript API is not loaded properly');
            }
            
            // Create map instance
            const map = new window.google.maps.Map(mapRef.current!, {
              center: mapCenter,
              zoom: zoom,
              zoomControl: false, // We'll add custom controls
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
            });

            console.log('✅ Google Maps instance created successfully');
            mapInstanceRef.current = map;
            setIsLoaded(true);
          } catch (mapError) {
            console.error('❌ Failed to create map instance:', mapError);
            const errorMessage = mapError instanceof Error ? mapError.message : 'Failed to create map instance';
            setError(errorMessage);
            toast.error('Failed to create Google Maps');
          }
        };
        
        // Start waiting for container
        waitForContainer();
        
      } catch (error) {
        console.error('❌ Failed to initialize Google Maps:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to load Google Maps. Please check your API key and internet connection.';
        setError(errorMessage);
        toast.error('Failed to load Google Maps');
      }
    };

    // Add a small delay to ensure DOM is ready, then start initialization
    const timeoutId = setTimeout(initMap, 100);
    
    return () => clearTimeout(timeoutId);
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
    filteredApplicants.forEach(applicant => {
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
        
        // Center map on clicked marker
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo({ lat: applicant.lat, lng: applicant.lng });
          mapInstanceRef.current.setZoom(15);
        }
      });

      // Store info window reference on marker
      (marker as any).infoWindow = infoWindow;
      markersRef.current.push(marker);
    });
  }, [filteredApplicants, onApplicantClick, isLoaded]);

  // Map control handlers
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom() || 5;
      mapInstanceRef.current.setZoom(currentZoom + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom() || 5;
      mapInstanceRef.current.setZoom(Math.max(currentZoom - 1, 1));
    }
  };

  const handleFindLocation = () => {
    if (mapInstanceRef.current && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const latLng = { lat: latitude, lng: longitude };

          if (mapInstanceRef.current) {
            mapInstanceRef.current.panTo(latLng);
            mapInstanceRef.current.setZoom(15);

            // Add or move the current location marker
            if (currentLocationMarkerRef.current) {
              currentLocationMarkerRef.current.setPosition(latLng);
            } else {
              const icon = {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="10" cy="10" r="8" fill="#ff4b4b" stroke="white" stroke-width="2"/>
                  </svg>
                `),
                scaledSize: new window.google.maps.Size(20, 20),
                anchor: new window.google.maps.Point(10, 10),
              };
              
              currentLocationMarkerRef.current = new window.google.maps.Marker({
                position: latLng,
                map: mapInstanceRef.current,
                icon: icon,
                title: 'Your Location'
              });
            }
          }
        },
        (error) => {
          console.error("Error getting current location:", error);
          toast.error("Could not get your current location");
        }
      );
    } else {
      toast.error("Geolocation is not supported by this browser");
    }
  };

  if (error) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full h-full flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg">
          <div className="text-center p-8 max-w-md">
            <div className="text-red-600 mb-4 text-4xl">⚠️</div>
            <div className="text-gray-700 text-sm mb-4 font-medium">Google Maps Error</div>
            <div className="text-gray-600 text-xs mb-4 bg-red-50 p-3 rounded border text-left">
              {error}
            </div>
            <div className="text-gray-500 text-xs space-y-1">
              <div>Please check:</div>
              <div>• Google Maps API key configuration</div>
              <div>• API key permissions and restrictions</div>
              <div>• Billing account status</div>
              <div>• Network connectivity</div>
            </div>
            <div className="mt-4 text-xs text-gray-400 bg-gray-50 p-3 rounded">
              <div>Debug Info:</div>
              <div>API Key: {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? 'Set' : 'Not Set'}</div>
              <div>Use Google Maps: {import.meta.env.VITE_USE_GOOGLE_MAPS}</div>
              <div>Window Google: {typeof window !== 'undefined' && window.google ? 'Available' : 'Not Available'}</div>
            </div>
            <div className="mt-4">
              <Button 
                onClick={retryGoogleMapsInitialization}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                Retry Loading
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full h-full flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <div className="text-gray-600 text-sm">Loading Google Maps...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapRef} 
        className="w-full h-full bg-gray-100 min-h-96"
      />
      
      {/* Map Search and Filter Controls - Mobile Responsive */}
      <div className="absolute z-[1000] top-4 left-4 right-4 md:w-80 md:right-auto map-search-card">
        <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Applicant Locations (Google Maps)
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

export default GoogleApplicantMapView;
