import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const GoogleMapsTest: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    const initMap = async () => {
      try {
        console.log('🧪 Testing Google Maps initialization...');
        
        // Check environment variables
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        const useGoogleMaps = import.meta.env.VITE_USE_GOOGLE_MAPS;
        
        setDebugInfo({
          apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'Not set',
          useGoogleMaps,
          windowGoogle: typeof window !== 'undefined' && window.google ? 'Available' : 'Not available'
        });

        if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
          throw new Error('Google Maps API key not configured');
        }

        // Load Google Maps script
        if (!window.google || !window.google.maps) {
          console.log('🔄 Loading Google Maps script...');
          
          const script = document.createElement('script');
          script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&v=weekly`;
          script.async = true;
          script.defer = true;
          
          await new Promise<void>((resolve, reject) => {
            script.onload = () => {
              console.log('✅ Google Maps script loaded');
              resolve();
            };
            script.onerror = () => {
              reject(new Error('Failed to load Google Maps script'));
            };
            document.head.appendChild(script);
          });
        }

        // Wait for container
        let attempts = 0;
        const maxAttempts = 50;
        
        const waitForContainer = () => {
          attempts++;
          
          if (!mapRef.current) {
            if (attempts < maxAttempts) {
              setTimeout(waitForContainer, 100);
              return;
            }
            throw new Error('Map container not found');
          }

          const rect = mapRef.current.getBoundingClientRect();
          console.log('📐 Container rect:', rect);
          
          if (rect.width === 0 || rect.height === 0) {
            if (attempts < maxAttempts) {
              setTimeout(waitForContainer, 100);
              return;
            }
            throw new Error(`Container has no dimensions: ${rect.width}x${rect.height}`);
          }

          // Create map
          const map = new window.google.maps.Map(mapRef.current, {
            center: { lat: 20.5937, lng: 78.9629 },
            zoom: 5,
            zoomControl: true,
            mapTypeControl: true,
          });

          // Add a test marker
          new window.google.maps.Marker({
            position: { lat: 20.5937, lng: 78.9629 },
            map: map,
            title: 'Test Marker - Center of India',
          });

          console.log('✅ Google Maps test successful!');
          setIsLoaded(true);
        };

        waitForContainer();

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('❌ Google Maps test failed:', errorMessage);
        setError(errorMessage);
      }
    };

    initMap();
  }, []);

  return (
    <div className="p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Google Maps Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium">Debug Information:</h4>
              <pre className="text-xs bg-gray-100 p-2 rounded">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <h4 className="font-medium text-red-800">Error:</h4>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="h-96 w-full border rounded">
              {!isLoaded && !error && (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>Loading Google Maps...</p>
                  </div>
                </div>
              )}
              
              <div 
                ref={mapRef}
                className="google-maps-container w-full h-full"
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: '400px'
                }}
              />
            </div>

            <div className="text-sm text-gray-600">
              {isLoaded && '✅ Google Maps loaded successfully!'}
              {error && '❌ Google Maps failed to load'}
              {!isLoaded && !error && '⏳ Loading...'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GoogleMapsTest;
