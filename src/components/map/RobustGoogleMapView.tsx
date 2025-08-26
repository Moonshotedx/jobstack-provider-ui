import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Search, ZoomIn, ZoomOut, MapPin, Crosshair, X, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTakeApplicationAction, useActiveOrganizationId } from '@/hooks/useJobsApi';
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

interface RobustGoogleMapViewProps {
  applicants: ApplicantLocation[];
  onApplicantClick?: (applicant: ApplicantLocation | null) => void;
  selectedApplicant?: ApplicantLocation | null;
  className?: string;
  mapCenter?: LatLng;
  zoom?: number;
  onTakeAction?: (applicantId: string, action: 'accept' | 'reject') => Promise<void>;
  loadingStates?: Record<string, 'accept' | 'reject' | null>;
}

// Simple Google Maps loader that uses script tag - more reliable than @googlemaps/js-api-loader
const loadGoogleMaps = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google && window.google.maps) {
      console.log('✅ Google Maps already loaded');
      resolve();
      return;
    }

    // Check if script is already loading
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      console.log('🔄 Google Maps script already exists, waiting...');
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', reject);
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      reject(new Error('Google Maps API key not configured'));
      return;
    }

    console.log('📡 Loading Google Maps script...');
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly&region=IN&language=en`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('✅ Google Maps script loaded');
      // Add small delay to ensure everything is initialized
      setTimeout(() => {
        if (window.google && window.google.maps) {
          resolve();
        } else {
          reject(new Error('Google Maps not available after script load'));
        }
      }, 100);
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load Google Maps script'));
    };
    
    document.head.appendChild(script);
  });
};

const RobustGoogleMapView: React.FC<RobustGoogleMapViewProps> = ({
  applicants = [],
  onApplicantClick,
  selectedApplicant,
  className = "w-full h-full",
  mapCenter = { lat: 20.5937, lng: 78.9629 },
  zoom = 5,
  onTakeAction,
  loadingStates = {}
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const takeApplicationAction = useTakeApplicationAction();
  const activeOrganizationId = useActiveOrganizationId();

  // Robust container waiting function
  const waitForMapContainer = useCallback((): Promise<HTMLDivElement> => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 100; // 10 seconds total
      
      const checkContainer = () => {
        attempts++;
        
        if (!mapRef.current) {
          if (attempts < maxAttempts) {
            setTimeout(checkContainer, 100);
            return;
          }
          reject(new Error('Map container element not found'));
          return;
        }

        // Check if container is actually rendered and has dimensions
        const rect = mapRef.current.getBoundingClientRect();
        const computedStyle = window.getComputedStyle(mapRef.current);
        
        console.log(`🔍 Container check ${attempts}:`, {
          exists: true,
          width: rect.width,
          height: rect.height,
          display: computedStyle.display,
          visibility: computedStyle.visibility,
          offsetParent: mapRef.current.offsetParent
        });

        if (rect.width > 0 && rect.height > 0 && 
            computedStyle.display !== 'none' && 
            computedStyle.visibility !== 'hidden') {
          console.log('✅ Container ready with dimensions:', rect);
          resolve(mapRef.current);
        } else if (attempts < maxAttempts) {
          setTimeout(checkContainer, 100);
        } else {
          reject(new Error(`Container not ready after ${maxAttempts} attempts. Width: ${rect.width}, Height: ${rect.height}`));
        }
      };
      
      // Start checking immediately
      checkContainer();
    });
  }, []);

  // Initialize Google Maps
  const initializeMap = useCallback(async () => {
    try {
      setError(null);
      console.log('🗺️ Starting Google Maps initialization...');

      // Step 1: Load Google Maps API
      await loadGoogleMaps();
      console.log('✅ Google Maps API loaded');

      // Step 2: Wait for container to be ready
      const container = await waitForMapContainer();
      console.log('✅ Container ready');

      // Step 3: Create map instance
      const map = new window.google.maps.Map(container, {
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

      // Wait for map to be fully initialized
      await new Promise<void>((resolve) => {
        const listener = map.addListener('idle', () => {
          console.log('✅ Map fully initialized');
          window.google.maps.event.removeListener(listener);
          resolve();
        });
      });

      mapInstanceRef.current = map;
      setIsLoaded(true);
      console.log('🎉 Google Maps initialization complete!');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ Google Maps initialization failed:', errorMessage);
      setError(errorMessage);
    }
  }, [mapCenter, zoom, waitForMapContainer]);

  // Retry function
  const retryInitialization = useCallback(async () => {
    setIsRetrying(true);
    setError(null);
    setIsLoaded(false);
    
    // Reset map instance
    mapInstanceRef.current = null;
    
    try {
      await initializeMap();
      toast.success('Google Maps loaded successfully!');
    } catch (err) {
      toast.error('Failed to load Google Maps');
    } finally {
      setIsRetrying(false);
    }
  }, [initializeMap]);

  // Initialize on mount
  useEffect(() => {
    initializeMap();
  }, [initializeMap]);

  // Update map center and zoom
  useEffect(() => {
    if (mapInstanceRef.current && isLoaded) {
      mapInstanceRef.current.setCenter(mapCenter);
      mapInstanceRef.current.setZoom(zoom);
    }
  }, [mapCenter.lat, mapCenter.lng, zoom, isLoaded]);

  // Create marker icon
  const createMarkerIcon = useCallback((status: string): google.maps.Icon => {
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

  // Update markers
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

      const infoWindowContent = `
        <div style="padding: 12px; min-width: 200px; max-width: 280px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
            <h3 style="font-weight: 600; font-size: 14px; margin: 0; color: #1f2937;">${applicant.name}</h3>
            <span style="font-size: 11px; padding: 3px 8px; border-radius: 12px; font-weight: 500; background-color: #f3f4f6; color: #374151;">
              ${applicant.status}
            </span>
          </div>
          <p style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">${applicant.location}</p>
          <div style="font-size: 12px; color: #374151;">Age: ${applicant.age} years</div>
          <div style="font-size: 11px; color: #6b7280; margin-top: 8px;">
            📧 ${applicant.email}<br/>
            📞 ${applicant.phone}
          </div>
        </div>
      `;

      const infoWindow = new window.google.maps.InfoWindow({
        content: infoWindowContent,
      });

      marker.addListener('click', () => {
        // Close other info windows
        markersRef.current.forEach(m => {
          if ((m as any).infoWindow) {
            (m as any).infoWindow.close();
          }
        });

        infoWindow.open(mapInstanceRef.current, marker);
        onApplicantClick?.(applicant);
        
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo({ lat: applicant.lat, lng: applicant.lng });
          mapInstanceRef.current.setZoom(15);
        }
      });

      (marker as any).infoWindow = infoWindow;
      markersRef.current.push(marker);
    });
  }, [filteredApplicants, onApplicantClick, isLoaded, createMarkerIcon]);

  // Action handlers
  const handleAccept = async () => {
    if (!selectedApplicant) return;
    
    try {
      if (onTakeAction) {
        await onTakeAction(selectedApplicant.id, 'accept');
      } else if (activeOrganizationId) {
        await takeApplicationAction.mutateAsync({
          organizationId: activeOrganizationId,
          actionData: {
            applicationId: selectedApplicant.id,
            action: 'accept',
            applicationStatus: 'Shortlisted',
          },
        });
      }
      toast.success('Applicant accepted successfully');
    } catch (error) {
      toast.error('Failed to accept applicant');
    }
  };

  const handleReject = async () => {
    if (!selectedApplicant) return;
    
    try {
      if (onTakeAction) {
        await onTakeAction(selectedApplicant.id, 'reject');
      } else if (activeOrganizationId) {
        await takeApplicationAction.mutateAsync({
          organizationId: activeOrganizationId,
          actionData: {
            applicationId: selectedApplicant.id,
            action: 'reject',
            applicationStatus: 'Rejected',
          },
        });
      }
      toast.success('Applicant rejected successfully');
    } catch (error) {
      toast.error('Failed to reject applicant');
    }
  };

  // Map controls
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
          }
        },
        () => {
          toast.error("Could not get your current location");
        }
      );
    }
  };

  // Error state
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
            <div className="text-gray-500 text-xs space-y-1 mb-4">
              <div>Please check:</div>
              <div>• Google Maps API key configuration</div>
              <div>• API key permissions and restrictions</div>
              <div>• Network connectivity</div>
            </div>
            <Button 
              onClick={retryInitialization}
              disabled={isRetrying}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              {isRetrying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                'Retry Loading'
              )}
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
            <div className="text-gray-500 text-xs mt-2">
              {isRetrying ? 'Retrying...' : 'Please wait'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Map container */}
      <div 
        ref={mapRef} 
        className="google-maps-container w-full h-full bg-gray-100 min-h-96"
        style={{
          width: '100%',
          height: '100%',
          minHeight: '400px',
          position: 'relative'
        }}
      />
      
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
              
              {(selectedApplicant.status === 'open' || selectedApplicant.status === 'applied') && (
                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" onClick={handleReject} disabled={!!loadingStates[selectedApplicant.id]} className="flex-1">
                    {loadingStates[selectedApplicant.id] === 'reject' ? (
                      <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Rejecting...</>
                    ) : (
                      <><XCircle className="h-4 w-4 mr-1" />Reject</>
                    )}
                  </Button>
                  <Button size="sm" onClick={handleAccept} disabled={!!loadingStates[selectedApplicant.id]} className="flex-1">
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

export default RobustGoogleMapView;
