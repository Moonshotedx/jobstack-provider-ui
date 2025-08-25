import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

const GoogleMapsDebugTest: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<string>('Initializing...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testGoogleMaps = async () => {
      try {
        setStatus('Testing API key...');
        
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'Not found');
        
        if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
          throw new Error('Google Maps API key is not configured');
        }

        setStatus('Loading Google Maps JavaScript API...');
        
        const loader = new Loader({
          apiKey,
          version: 'weekly',
          libraries: ['places', 'geometry'],
          region: 'IN',
          language: 'en'
        });

        await loader.load();
        setStatus('Google Maps API loaded successfully!');

        if (!mapRef.current) return;

        setStatus('Creating map instance...');
        
        // Create a simple map
        const map = new window.google.maps.Map(mapRef.current, {
          center: { lat: 20.5937, lng: 78.9629 },
          zoom: 5,
          mapTypeId: 'roadmap'
        });

        setStatus('Map created successfully!');

        // Add a test marker
        const marker = new window.google.maps.Marker({
          position: { lat: 20.5937, lng: 78.9629 },
          map: map,
          title: 'Test Marker'
        });

        console.log('Google Maps test successful!', { map, marker });

      } catch (error: any) {
        console.error('Google Maps test failed:', error);
        setError(error.message || 'Unknown error');
        setStatus('Failed to load Google Maps');
      }
    };

    testGoogleMaps();
  }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Google Maps Debug Test</h2>
      
      <div className="mb-4">
        <p><strong>Status:</strong> {status}</p>
        {error && (
          <p className="text-red-600"><strong>Error:</strong> {error}</p>
        )}
      </div>

      <div 
        ref={mapRef} 
        className="w-full h-96 border border-gray-300 rounded min-h-96"
      />

      <div className="mt-4 text-sm text-gray-600">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        <p>API Key: {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? 'Set' : 'Not set'}</p>
        <p>Use Google Maps: {import.meta.env.VITE_USE_GOOGLE_MAPS}</p>
        <p>Window Google: {typeof window !== 'undefined' && window.google ? 'Available' : 'Not available'}</p>
      </div>
    </div>
  );
};

export default GoogleMapsDebugTest;
