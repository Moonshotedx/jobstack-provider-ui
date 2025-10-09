import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  MapPin, 
  Search, 
  Crosshair, 
  CheckCircle, 
  Loader2, 
  Maximize2, 
  Minimize2,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import type { LocationData } from './LocationField';
import * as GoogleMapsUtils from '@/lib/google-maps-utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface MapLocationSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelect: (location: LocationData) => void;
  initialLocation?: LocationData | null;
  title?: string;
}

interface MapClickLocation {
  lat: number;
  lng: number;
  address?: string;
}

const MapLocationSelector: React.FC<MapLocationSelectorProps> = ({
  isOpen,
  onClose,
  onLocationSelect,
  initialLocation,
  title = "Select Job Location"
}) => {
  const isMobile = useIsMobile();
  const [selectedLocation, setSelectedLocation] = useState<MapClickLocation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 20.5937, lng: 78.9629 });
  const [mapZoom, setMapZoom] = useState(10);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  
  // Preserve map state when modal is closed/reopened
  const [mapState, setMapState] = useState<{
    center?: { lat: number; lng: number };
    zoom?: number;
    selectedLocation?: MapClickLocation;
  }>({});
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialize map when dialog opens
  useEffect(() => {
    if (isOpen) {
      // Always reinitialize the map when modal opens to ensure it renders properly
      initializeMap();
    }
  }, [isOpen]);


  // Set initial location if provided or restore saved state
  useEffect(() => {
    if (isMapLoaded && mapInstanceRef.current) {
      if (initialLocation) {
        // Use provided initial location (e.g., when editing existing job)
        const location = {
          lat: initialLocation.gps.lat,
          lng: initialLocation.gps.lng,
          address: initialLocation.address
        };
        setSelectedLocation(location);
        setMapCenter({ lat: location.lat, lng: location.lng });
        setMapZoom(15);
        // Ensure marker is visible when setting initial location
        if (markerRef.current) {
          markerRef.current.setPosition({ lat: location.lat, lng: location.lng });
          markerRef.current.setVisible(true);
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.panTo({ lat: location.lat, lng: location.lng });
        }
      } else if (mapState.center && mapState.zoom) {
        // Restore saved state (e.g., when reopening after selecting a location)
        mapInstanceRef.current.setCenter(mapState.center);
        mapInstanceRef.current.setZoom(mapState.zoom);
        setMapCenter(mapState.center);
        setMapZoom(mapState.zoom);
        
        if (mapState.selectedLocation) {
          setSelectedLocation(mapState.selectedLocation);
          // Ensure marker is visible when restoring state
          if (markerRef.current) {
            markerRef.current.setPosition({ lat: mapState.selectedLocation.lat, lng: mapState.selectedLocation.lng });
            markerRef.current.setVisible(true);
          }
        }
      }
    }
  }, [initialLocation, isMapLoaded, mapState]);

  // Save map state when modal closes
  useEffect(() => {
    if (!isOpen && (selectedLocation || mapCenter.lat !== 20.5937 || mapCenter.lng !== 78.9629)) {
      setMapState({
        center: mapCenter,
        zoom: mapZoom,
        selectedLocation: selectedLocation || undefined
      });
    }
    // Only depend on isOpen to save state when closing
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      // Cleanup when component unmounts
      if (mapInstanceRef.current) {
        // Clear the map container
        if (mapRef.current) {
          mapRef.current.innerHTML = '';
        }
        mapInstanceRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current = null;
      }
    };
  }, []);

  const initializeMap = async () => {
    try {
      setIsLoading(true);
      
      // Wait a bit to ensure the container is ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Always reinitialize the map to ensure it renders properly
      // Clear existing map instance if it exists
      if (mapInstanceRef.current) {
        // Clear the map container
        if (mapRef.current) {
          mapRef.current.innerHTML = '';
        }
        mapInstanceRef.current = null;
      }
      
      // Clear marker reference
      if (markerRef.current) {
        markerRef.current = null;
      }
      
      // Check if Google Maps should be used
      const useGoogleMaps = import.meta.env.VITE_USE_GOOGLE_MAPS === 'true';
      
      if (useGoogleMaps) {
        await initializeGoogleMaps();
      } else {
        await initializeLeafletMap();
      }
      
      setIsMapLoaded(true);
    } catch (error) {
      console.error('Failed to initialize map:', error);
      toast.error('Failed to load map. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeGoogleMaps = async () => {
    try {
      // Load Google Maps API
      await GoogleMapsUtils.initializeGoogleMapsInstance();
      
      if (!mapRef.current) return;

      // Create map instance
      const map = new window.google.maps.Map(mapRef.current, {
        center: mapCenter,
        zoom: mapZoom,
        zoomControl: true,
        mapTypeControl: false,
        scaleControl: true,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: false, // We'll handle this ourselves
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

      // Add click listener for location selection
      map.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const location = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          };
          handleMapClick(location);
        }
      });

      // Add listeners to track map center and zoom changes
      // Use debounced updates to prevent excessive re-renders
      let centerChangedTimeout: ReturnType<typeof setTimeout> | null = null;
      let zoomChangedTimeout: ReturnType<typeof setTimeout> | null = null;
      
      map.addListener('center_changed', () => {
        const center = map.getCenter();
        if (center && centerChangedTimeout === null) {
          centerChangedTimeout = setTimeout(() => {
            setMapCenter({ lat: center.lat(), lng: center.lng() });
            centerChangedTimeout = null;
          }, 100);
        }
      });

      map.addListener('zoom_changed', () => {
        if (zoomChangedTimeout === null) {
          zoomChangedTimeout = setTimeout(() => {
            setMapZoom(map.getZoom() || 10);
            zoomChangedTimeout = null;
          }, 100);
        }
      });

      // Add marker for selected location
      markerRef.current = new window.google.maps.Marker({
        map: map,
        draggable: true,
        title: 'Selected Location',
        visible: false, // Initially hidden until a location is selected
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="16" cy="16" r="12" fill="#3b82f6" stroke="white" stroke-width="3"/>
              <circle cx="16" cy="16" r="6" fill="white"/>
            </svg>
          `),
          scaledSize: new window.google.maps.Size(32, 32),
          anchor: new window.google.maps.Point(16, 16)
        }
      });

      // Add drag listener to marker
      markerRef.current.addListener('dragend', (event: google.maps.MapMouseEvent) => {
        if (event.latLng) {
          const location = {
            lat: event.latLng.lat(),
            lng: event.latLng.lng()
          };
          handleMapClick(location);
          // No need to update map center here as the marker is already at the new position
          // and updating it would trigger the center_changed event
        }
      });

    } catch (error) {
      console.error('Failed to initialize Google Maps:', error);
      throw error;
    }
  };

  const initializeLeafletMap = async () => {
    // For now, we'll focus on Google Maps implementation
    // Leaflet implementation can be added later if needed
    throw new Error('Leaflet map implementation not yet available');
  };

  const handleMapClick = async (location: MapClickLocation) => {
    setSelectedLocation(location);
    updateMarker(location);
    
    // Reverse geocode to get address
    try {
      const address = await reverseGeocode(location.lat, location.lng);
      setSelectedLocation(prev => prev ? { ...prev, address } : null);
    } catch (error) {
      console.error('Failed to get address:', error);
    }
  };

  const updateMarker = (location: MapClickLocation) => {
    if (markerRef.current && mapInstanceRef.current) {
      markerRef.current.setPosition({ lat: location.lat, lng: location.lng });
      markerRef.current.setVisible(true);
      mapInstanceRef.current.panTo({ lat: location.lat, lng: location.lng });
    }
  };

  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const useGoogleMaps = import.meta.env.VITE_USE_GOOGLE_MAPS === 'true';
      
      if (useGoogleMaps) {
        const result = await GoogleMapsUtils.reverseGeocode(lat, lng);
        return result?.formattedAddress || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      } else {
        // Use Nominatim for reverse geocoding
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  const reverseGeocodeStructured = async (lat: number, lng: number): Promise<Partial<LocationData>> => {
    try {
      const useGoogleMaps = import.meta.env.VITE_USE_GOOGLE_MAPS === 'true';
      
      if (useGoogleMaps) {
        const result = await GoogleMapsUtils.reverseGeocode(lat, lng);
        if (result) {
          const addressComponents = GoogleMapsUtils.parseGoogleMapsAddressComponents(result.addressComponents);
          return {
            address: result.formattedAddress,
            city: addressComponents.city || '',
            state: addressComponents.state || '',
            country: addressComponents.country || 'India',
            tag: addressComponents.city || 'job-location'
          };
        }
      } else {
        // Use Nominatim for reverse geocoding
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
        );
        const data = await response.json();
        
        if (data && data.address) {
          const address = data.address;
          return {
            address: data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
            city: address.city || address.town || address.village || address.municipality || '',
            state: address.state || address.province || '',
            country: address.country || 'India',
            tag: address.city || address.town || 'job-location'
          };
        }
      }
      
      // Fallback if no structured data is available
      return {
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        city: '',
        state: '',
        country: 'India',
        tag: 'job-location'
      };
    } catch (error) {
      console.error('Structured reverse geocoding failed:', error);
      return {
        address: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        city: '',
        state: '',
        country: 'India',
        tag: 'job-location'
      };
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const useGoogleMaps = import.meta.env.VITE_USE_GOOGLE_MAPS === 'true';
      
      if (useGoogleMaps) {
        const results = await GoogleMapsUtils.searchAddressSuggestions(query);
        setSearchResults(results);
      } else {
        // Use Nominatim for search
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`
        );
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchResultSelect = async (result: any) => {
    try {
      const useGoogleMaps = import.meta.env.VITE_USE_GOOGLE_MAPS === 'true';
      
      let location: MapClickLocation;
      
      if (useGoogleMaps) {
        const placeDetails = await GoogleMapsUtils.getPlaceDetails(result.place_id);
        if (placeDetails) {
          location = {
            lat: placeDetails.lat,
            lng: placeDetails.lng,
            address: placeDetails.formattedAddress
          };
        } else {
          throw new Error('Failed to get place details');
        }
      } else {
        location = {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
          address: result.display_name
        };
      }
      
      setSelectedLocation(location);
      setMapCenter({ lat: location.lat, lng: location.lng });
      setMapZoom(15);
      updateMarker(location);
      setSearchQuery('');
      setSearchResults([]);
    } catch (error) {
      console.error('Failed to select search result:', error);
      toast.error('Failed to select location. Please try again.');
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        try {
          const address = await reverseGeocode(location.lat, location.lng);
          const locationWithAddress = { ...location, address };
          setSelectedLocation(locationWithAddress);
          setMapCenter(location);
          setMapZoom(15);
          updateMarker(locationWithAddress);
        } catch (error) {
          console.error('Failed to get address for current location:', error);
          setSelectedLocation(location);
          setMapCenter(location);
          setMapZoom(15);
          updateMarker(location);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Failed to get your current location');
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const handleConfirmSelection = async () => {
    if (!selectedLocation) {
      toast.error('Please select a location on the map');
      return;
    }

    try {
      setIsLoading(true);
      
      // Get structured address data using reverse geocoding
      const structuredData = await reverseGeocodeStructured(selectedLocation.lat, selectedLocation.lng);
      
      const locationData: LocationData = {
        address: structuredData.address || selectedLocation.address || `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`,
        city: structuredData.city || '',
        state: structuredData.state || '',
        country: structuredData.country || 'India',
        tag: structuredData.tag || 'job_location',
        gps: {
          lat: selectedLocation.lat,
          lng: selectedLocation.lng
        }
      };

      onLocationSelect(locationData);
      onClose();
    } catch (error) {
      console.error('Failed to get structured location data:', error);
      // Fallback to basic location data
      const locationData: LocationData = {
        address: selectedLocation.address || `${selectedLocation.lat.toFixed(6)}, ${selectedLocation.lng.toFixed(6)}`,
        city: '',
        state: '',
        country: 'India',
        tag: 'job_location',
        gps: {
          lat: selectedLocation.lat,
          lng: selectedLocation.lng
        }
      };
      onLocationSelect(locationData);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleClose = () => {
    // Save current map state before closing
    if (mapInstanceRef.current && (selectedLocation || mapCenter.lat !== 20.5937 || mapCenter.lng !== 78.9629)) {
      setMapState({
        center: mapCenter,
        zoom: mapZoom,
        selectedLocation: selectedLocation || undefined
      });
    }
    
    // Reset UI state when closing
    setSelectedLocation(null);
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);
    setIsLoading(false);
    setIsFullscreen(false);
    setIsMapLoaded(false); // Reset map loaded state
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`${isFullscreen ? 'max-w-[95vw] h-[95vh]' : isMobile ? 'max-w-[95vw] h-[90vh]' : 'max-w-4xl h-[80vh]'} p-0 overflow-hidden`} hideCloseButton>
        <DialogHeader className={`${isMobile ? 'p-4 pb-0' : 'p-6 pb-0'} relative`}>
          <div className="flex items-center justify-between">
            <DialogTitle className={`${isMobile ? 'text-lg' : 'text-xl'} font-semibold`}>{title}</DialogTitle>
            <div className="flex items-center gap-2">
              {!isMobile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleToggleFullscreen}
                  className="flex items-center gap-2 z-10 relative"
                >
                  {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="flex items-center gap-2 z-10 relative"
              >
                <X className="h-4 w-4" />
                {isMobile ? '' : 'Close'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className={`flex-1 flex flex-col ${isMobile ? 'p-4 pt-2' : 'p-6 pt-4'}`}>
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
                placeholder="Search for a location..."
                className={`pl-10 pr-20 ${isMobile ? 'h-12 text-base' : ''}`}
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                {isSearching && <Loader2 className="h-4 w-4 animate-spin" />}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleGetCurrentLocation}
                  disabled={isLoading}
                  className={`${isMobile ? 'h-10 px-3' : 'h-8 px-2'}`}
                >
                  <Crosshair className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className={`px-4 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0 touch-manipulation ${isMobile ? 'py-4 min-h-[48px]' : 'py-3'}`}
                    onClick={() => handleSearchResultSelect(result)}
                  >
                    <div className={`${isMobile ? 'text-base' : 'text-sm'} font-medium`}>
                      {import.meta.env.VITE_USE_GOOGLE_MAPS === 'true' ? result.description : result.display_name}
                    </div>
                    {import.meta.env.VITE_USE_GOOGLE_MAPS === 'true' && (
                      <div className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-500 mt-1`}>
                        {result.terms?.slice(1, 3).map((term: any) => term.value).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Map Container */}
          <div className="flex-1 relative border border-gray-200 rounded-lg overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-10">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span>Loading map...</span>
                </div>
              </div>
            )}
            
            <div
              ref={mapRef}
              className="w-full h-full"
              style={{ minHeight: isMobile ? '300px' : '400px' }}
            />

            {/* Map Instructions */}
            {!selectedLocation && !isLoading && (
              <div className={`absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-lg ${isMobile ? 'max-w-[280px]' : 'max-w-xs'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className={`${isMobile ? 'text-base' : 'text-sm'} font-medium`}>Select Location</span>
                </div>
                <p className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-600`}>
                  {isMobile 
                    ? "Tap anywhere on the map to select the job location, or search for a specific address."
                    : "Click anywhere on the map to select the job location, or search for a specific address."
                  }
                </p>
              </div>
            )}

            {/* Selected Location Info - Compact Popup */}
            {selectedLocation && (
              <div className={`absolute z-20 bg-white/95 backdrop-blur-sm shadow-lg rounded-lg border ${isMobile ? 'bottom-16 left-4 right-4' : 'bottom-4 left-4 right-4'} max-w-sm`}>
                <div className="p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate" title={selectedLocation.address}>
                        {selectedLocation.address}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className={`${isMobile ? 'p-3 pt-0 flex-col gap-2' : 'p-4 pt-0 flex-row gap-3'} flex-shrink-0`}>
          <Button 
            onClick={handleConfirmSelection}
            disabled={!selectedLocation || isLoading}
            size={isMobile ? "sm" : "default"}
            className={`flex items-center gap-2 ${isMobile ? 'w-full h-10' : 'flex-1 min-w-0'}`}
          >
            <MapPin className="h-4 w-4" />
            Use This Location
          </Button>
          <Button 
            variant="outline" 
            onClick={handleClose} 
            size={isMobile ? "sm" : "default"}
            className={`${isMobile ? 'w-full h-10' : 'flex-1 min-w-0'}`}
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MapLocationSelector;
