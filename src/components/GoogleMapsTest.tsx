import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// TypeScript declarations for Google Maps
// Note: Using (window as any).google to avoid conflicts with existing global declarations

const GoogleMapsTest: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Check if Google Maps script is already loaded
  const checkGoogleMapsAvailability = useCallback(() => {
    return typeof window !== 'undefined' && 
           (window as any).google && 
           (window as any).google.maps && 
           (window as any).google.maps.Map;
  }, []);

  // Load Google Maps script
  const loadGoogleMapsScript = useCallback(async (apiKey: string) => {
    if (checkGoogleMapsAvailability()) {
      console.log('✅ Google Maps already loaded');
      setIsScriptLoaded(true);
      return;
    }

    return new Promise<void>((resolve, reject) => {
      // Check if script is already being loaded
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      if (existingScript) {
        // Wait for existing script to load
        const checkInterval = setInterval(() => {
          if (checkGoogleMapsAvailability()) {
            clearInterval(checkInterval);
            console.log('✅ Google Maps script loaded (existing)');
            setIsScriptLoaded(true);
            resolve();
          }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('Timeout waiting for existing Google Maps script'));
        }, 10000);
        return;
      }

      console.log('🔄 Loading Google Maps script...');
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        // Additional check to ensure the API is fully loaded
        const checkAPIReady = () => {
          if (checkGoogleMapsAvailability()) {
            console.log('✅ Google Maps script loaded and API ready');
            setIsScriptLoaded(true);
            resolve();
          } else {
            setTimeout(checkAPIReady, 100);
          }
        };
        checkAPIReady();
      };

      script.onerror = (event) => {
        console.error('❌ Failed to load Google Maps script:', event);
        reject(new Error('Failed to load Google Maps script. Check your API key and network connection.'));
      };
      
      document.head.appendChild(script);
    });
  }, [checkGoogleMapsAvailability]);

  // Initialize the map
  const initializeMap = useCallback(async () => {
    if (!isScriptLoaded || !checkGoogleMapsAvailability()) {
      throw new Error('Google Maps API not ready');
    }

    if (!mapRef.current) {
      throw new Error('Map container ref not available');
    }

    // Force a reflow to ensure the container is properly rendered
    mapRef.current.offsetHeight;
    
    // Wait a bit for the DOM to settle
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const rect = mapRef.current.getBoundingClientRect();
    console.log('📐 Container dimensions:', {
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
      offsetWidth: mapRef.current.offsetWidth,
      offsetHeight: mapRef.current.offsetHeight,
      clientWidth: mapRef.current.clientWidth,
      clientHeight: mapRef.current.clientHeight
    });

    if (rect.width === 0 || rect.height === 0) {
      throw new Error(`Container has invalid dimensions: ${rect.width}x${rect.height}. Make sure the container has explicit width and height.`);
    }

    // Clear any existing map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current = null;
    }

    // Create the map with proper error handling
    try {
      const mapOptions: any = {
        center: { lat: 20.5937, lng: 78.9629 },
        zoom: 5,
        zoomControl: true,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        mapTypeId: (window as any).google.maps.MapTypeId.ROADMAP,
        gestureHandling: 'cooperative',
        restriction: {
          latLngBounds: {
            north: 40,
            south: 5,
            west: 65,
            east: 100
          }
        }
      };

      console.log('🗺️ Creating map instance...');
      const map = new (window as any).google.maps.Map(mapRef.current, mapOptions);
      mapInstanceRef.current = map;

      // Wait for the map to be ready
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Map initialization timeout'));
        }, 10000);

        const idleListener = map.addListener('idle', () => {
          clearTimeout(timeout);
          (window as any).google.maps.event.removeListener(idleListener);
          console.log('🗺️ Map is ready and idle');
          resolve();
        });

        const errorListener = map.addListener('error', (error: any) => {
          clearTimeout(timeout);
          (window as any).google.maps.event.removeListener(idleListener);
          (window as any).google.maps.event.removeListener(errorListener);
          reject(new Error(`Map error: ${error}`));
        });
      });

      // Add a test marker
      const marker = new (window as any).google.maps.Marker({
        position: { lat: 20.5937, lng: 78.9629 },
        map: map,
        title: 'Test Marker - Center of India',
        animation: (window as any).google.maps.Animation.DROP,
      });

      // Add info window
      const infoWindow = new (window as any).google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 200px;">
            <h3 style="margin: 0 0 10px 0; color: #333;">🇮🇳 Test Location</h3>
            <p style="margin: 0; color: #666;">Center of India</p>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #999;">
              Lat: 20.5937, Lng: 78.9629
            </p>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });

      // Add some additional test markers
      const testLocations = [
        { lat: 28.6139, lng: 77.2090, title: 'New Delhi' },
        { lat: 19.0760, lng: 72.8777, title: 'Mumbai' },
        { lat: 13.0827, lng: 80.2707, title: 'Chennai' },
        { lat: 22.5726, lng: 88.3639, title: 'Kolkata' }
      ];

      testLocations.forEach((location, index) => {
        setTimeout(() => {
          new (window as any).google.maps.Marker({
            position: { lat: location.lat, lng: location.lng },
            map: map,
            title: location.title,
            animation: (window as any).google.maps.Animation.DROP,
          });
        }, index * 500);
      });

      console.log('✅ Google Maps initialized successfully!');
      setIsLoaded(true);
      setError(null);

    } catch (mapError) {
      throw new Error(`Failed to create map instance: ${mapError}`);
    }
  }, [isScriptLoaded, checkGoogleMapsAvailability]);

  // Main initialization function
  const initialize = useCallback(async () => {
    try {
      setIsInitializing(true);
      setIsLoaded(false);
      setError(null);
      
      console.log('🧪 Starting Google Maps test...');
      
      // Check environment variables
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      const useGoogleMaps = import.meta.env.VITE_USE_GOOGLE_MAPS;
      
      const debugData = {
        apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'Not set',
        useGoogleMaps,
        windowGoogle: checkGoogleMapsAvailability() ? 'Available' : 'Not available',
        containerExists: !!mapRef.current,
        containerDimensions: mapRef.current ? 
          `${mapRef.current.offsetWidth}x${mapRef.current.offsetHeight}` : 'N/A',
        containerVisible: mapRef.current ? 
          getComputedStyle(mapRef.current).display !== 'none' : 'N/A'
      };
      
      setDebugInfo(debugData);
      console.log('🔍 Debug info:', debugData);

      if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
        throw new Error('Google Maps API key not configured. Please set VITE_GOOGLE_MAPS_API_KEY in your environment variables.');
      }

      // Load the script first
      await loadGoogleMapsScript(apiKey);
      
      // Wait a bit for the container to be fully rendered
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Initialize the map
      await initializeMap();

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('❌ Google Maps initialization failed:', errorMessage);
      setError(errorMessage);
      setIsLoaded(false);
    } finally {
      setIsInitializing(false);
    }
  }, [loadGoogleMapsScript, initializeMap, checkGoogleMapsAvailability]);

  // Initialize on mount
  useEffect(() => {
    // Small delay to ensure component is fully mounted and container is rendered
    const timer = setTimeout(() => {
      initialize();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [initialize]);

  // Manual retry function
  const handleRetry = useCallback(() => {
    console.log('🔄 Manual retry triggered');
    initialize();
  }, [initialize]);

  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Google Maps Test</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRetry}
              disabled={isInitializing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isInitializing ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">Debug Information:</h4>
              <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <h4 className="font-medium text-red-800">Error:</h4>
                <p className="text-red-700 text-sm">{error}</p>
                <div className="mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRetry}
                    className="text-red-700 border-red-300 hover:bg-red-50"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                </div>
              </div>
            )}

            {/* Map Container with explicit dimensions */}
            <div className="relative border rounded overflow-hidden bg-gray-100">
              <div 
                className="relative"
                style={{
                  width: '100%',
                  height: '400px',
                  minHeight: '400px'
                }}
              >
                {(isInitializing || (!isLoaded && !error)) && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                      <p className="text-sm font-medium">
                        {isInitializing ? 'Initializing Google Maps...' : 'Loading...'}
                      </p>
                    </div>
                  </div>
                )}
                
                <div 
                  ref={mapRef}
                  className="google-maps-container w-full h-full"
                  style={{
                    width: '100%',
                    height: '400px',
                    minHeight: '400px',
                    display: 'block'
                  }}
                />
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center">
                {isLoaded && <span className="text-green-600">✅ Google Maps loaded successfully!</span>}
                {error && <span className="text-red-600">❌ Google Maps failed to load</span>}
                {!isLoaded && !error && <span className="text-blue-600">⏳ Loading...</span>}
              </div>
              
              {isLoaded && (
                <div className="text-gray-500">
                  Click on markers to see info windows
                </div>
              )}
            </div>

            {/* Additional debug info */}
            <details className="text-xs">
              <summary className="cursor-pointer font-medium text-gray-600">
                Advanced Debug Info
              </summary>
              <div className="mt-2 p-2 bg-gray-50 rounded">
                <div>Script Loaded: {isScriptLoaded ? '✅' : '❌'}</div>
                <div>Map Loaded: {isLoaded ? '✅' : '❌'}</div>
                <div>Initializing: {isInitializing ? '⏳' : '❌'}</div>
                <div>Container Ref: {mapRef.current ? '✅' : '❌'}</div>
                <div>Google Available: {checkGoogleMapsAvailability() ? '✅' : '❌'}</div>
              </div>
            </details>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleMapsTest;