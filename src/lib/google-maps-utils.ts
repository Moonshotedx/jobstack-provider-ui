// Google Maps utility functions for map functionality
import { Loader } from '@googlemaps/js-api-loader';

// Use the same interface as the existing map utils
export interface ApplicantLocation {
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

// Location data interface for structured data
export interface LocationData {
  address: string;
  city: string;
  state: string;
  country: string;
  tag: string;
  gps: {
    lat: number;
    lng: number;
  };
}

// Google Maps suggestion interface to match existing LocationField interface
export interface GoogleMapsSuggestion {
  description: string;
  place_id: string;
  terms: Array<{ offset: number; value: string }>;
}

let googleMapsLoader: Loader | null = null;
let isGoogleMapsLoaded = false;
let loadPromise: Promise<void> | null = null;

// Alternative: Load Google Maps via script tag
const loadGoogleMapsScript = async (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google && window.google.maps) {
      console.log('✅ Google Maps already loaded via script');
      resolve();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      console.log('🔄 Google Maps script already exists, waiting for load...');
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', reject);
      return;
    }

    console.log('📡 Loading Google Maps via script tag...');
    
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&v=weekly&region=IN&language=en`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      console.log('✅ Google Maps script loaded successfully');
      resolve();
    };
    
    script.onerror = (error) => {
      console.error('❌ Failed to load Google Maps script:', error);
      reject(new Error('Failed to load Google Maps script'));
    };
    
    document.head.appendChild(script);
  });
};

// Initialize Google Maps loader with the new Places API
const initializeGoogleMaps = async (): Promise<void> => {
  if (isGoogleMapsLoaded) return;
  
  // Return existing load promise if already loading
  if (loadPromise) {
    console.log('🔄 Google Maps already loading, waiting...');
    return loadPromise;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  console.log('🔑 Initializing Google Maps with API key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'Not found');
  
  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    const errorMsg = 'Google Maps API key is not configured. Please set VITE_GOOGLE_MAPS_API_KEY in your environment variables.';
    console.error('❌', errorMsg);
    throw new Error(errorMsg);
  }

  loadPromise = (async () => {
    try {
      // Try using the Loader first
      console.log('🔧 Attempting to load with @googlemaps/js-api-loader...');
      
      if (!googleMapsLoader) {
        googleMapsLoader = new Loader({
          apiKey,
          version: 'weekly',
          libraries: ['places', 'geometry'],
          region: 'IN',
          language: 'en'
        });
      }

      await googleMapsLoader.load();
      console.log('✅ Google Maps loaded successfully via Loader');
      isGoogleMapsLoaded = true;
      
    } catch (loaderError) {
      console.warn('⚠️ Loader failed, trying script tag fallback:', loaderError);
      
      try {
        await loadGoogleMapsScript(apiKey);
        console.log('✅ Google Maps loaded successfully via script tag');
        isGoogleMapsLoaded = true;
      } catch (scriptError) {
        console.error('❌ Both loader and script tag failed');
        
        // More detailed error information
        if (loaderError instanceof Error) {
          if (loaderError.message.includes('API key')) {
            throw new Error('Google Maps API key is invalid or has restrictions. Please check your API key configuration.');
          }
          if (loaderError.message.includes('quota')) {
            throw new Error('Google Maps API quota exceeded. Please check your billing settings.');
          }
          if (loaderError.message.includes('referer') || loaderError.message.includes('referrer')) {
            throw new Error('Google Maps API referrer restriction. Please check your API key HTTP referrer settings.');
          }
        }
        
        throw new Error(`Failed to initialize Google Maps: ${loaderError instanceof Error ? loaderError.message : 'Unknown error'}. Please check your API key and internet connection.`);
      }
    }
  })();

  return loadPromise;
};

// Geocoding function using Google Maps Geocoding API
export const geocodeLocation = async (location: string): Promise<{ lat: number; lng: number } | null> => {
  if (!location) return null;

  try {
    await initializeGoogleMaps();

    const cleanLocation = location.trim();
    if (!cleanLocation) return null;

    console.log(`🔍 Google Maps: Searching for coordinates: "${cleanLocation}"`);

    const geocoder = new window.google.maps.Geocoder();
    
    // Bias search towards India
    const request = {
      address: cleanLocation,
      region: 'IN',
      componentRestrictions: {
        country: 'IN'
      }
    };

    const response = await new Promise<any>((resolve, reject) => {
      geocoder.geocode(request, (results: any, status: any) => {
        if (status === 'OK' && results) {
          resolve({ results });
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });

    if (response.results && response.results.length > 0) {
      const result = response.results[0];
      const location = result.geometry.location;
      const lat = location.lat();
      const lng = location.lng();

      console.log(`📍 Google Maps: Found location: "${result.formatted_address}"`);

      // Validate that coordinates are within India bounds
      if (lat < 8 || lat > 37 || lng < 68 || lng > 97) {
        console.warn(`⚠️ Coordinates outside India bounds: ${lat}, ${lng} for location: "${cleanLocation}"`);
        return null;
      }

      return { lat, lng };
    }

    console.warn(`❌ Google Maps: No coordinates found for location: "${cleanLocation}"`);
    return null;
  } catch (error) {
    console.error('Google Maps geocoding error:', error);
    return null;
  }
};

// Search for address suggestions using Google Maps Places API (New)
export const searchAddressSuggestions = async (query: string): Promise<GoogleMapsSuggestion[]> => {
  if (!query.trim() || query.length < 3) {
    return [];
  }

  try {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      throw new Error('Google Maps API key is not configured');
    }

    console.log('🗺️ Google Maps: Using Places API (New) for suggestions');

    // Use the new Places API (New) with Fetch API
    const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify({
        input: query,
        includedRegionCodes: ['IN'], // Use includedRegionCodes instead of locationRestriction.country
        languageCode: 'en',
        includedPrimaryTypes: ['establishment', 'street_address', 'sublocality', 'locality'],
        sessionToken: generateSessionToken()
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Places API error:', response.status, errorText);
      throw new Error(`Places API failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.suggestions && Array.isArray(data.suggestions)) {
      return data.suggestions
        .filter((suggestion: any) => suggestion.placePrediction)
        .map((suggestion: any) => {
          const prediction = suggestion.placePrediction;
          return {
            description: prediction.text?.text || '',
            place_id: prediction.placeId || '',
            terms: prediction.structuredFormat?.mainText ? [
              { offset: 0, value: prediction.structuredFormat.mainText.text },
              { offset: 0, value: prediction.structuredFormat.secondaryText?.text || '' }
            ] : []
          };
        });
    }

    return [];
  } catch (error) {
    console.error('Google Maps places search error:', error);
    
    // Fallback to the old AutocompleteService for backward compatibility
    try {
      await initializeGoogleMaps();
      return await searchAddressSuggestionsLegacy(query);
    } catch (fallbackError) {
      console.error('Legacy places search also failed:', fallbackError);
      return [];
    }
  }
};

// Generate session token for Places API
const generateSessionToken = (): string => {
  return 'session_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// Legacy fallback using the old AutocompleteService
const searchAddressSuggestionsLegacy = async (query: string): Promise<GoogleMapsSuggestion[]> => {
  console.log('🗺️ Google Maps: Falling back to legacy AutocompleteService');
  
  const service = new window.google.maps.places.AutocompleteService();
  
  const request = {
    input: query,
    componentRestrictions: { country: 'IN' },
    types: ['establishment', 'geocode'],
    language: 'en'
  };

  const response = await new Promise<any>((resolve, reject) => {
    service.getPlacePredictions(request, (predictions: any, status: any) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
        resolve(predictions);
      } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
        resolve([]);
      } else {
        reject(new Error(`Places service failed: ${status}`));
      }
    });
  });

  return (response || []).map((prediction: any) => ({
    description: prediction.description,
    place_id: prediction.place_id,
    terms: prediction.terms || []
  }));
};

// Get place details including coordinates using Places API (New)
export const getPlaceDetails = async (placeId: string): Promise<{ lat: number; lng: number; formattedAddress: string; addressComponents: any[] } | null> => {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      throw new Error('Google Maps API key is not configured');
    }

    console.log('🗺️ Google Maps: Using Places API (New) for place details, placeId:', placeId);

    // Use the new Places API (New) with Fetch API
    const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'location,displayName,formattedAddress,addressComponents'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Place Details API error:', response.status, errorText);
      throw new Error(`Place Details API failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('🗺️ Place details response:', data);

    if (data.location && data.location.latitude && data.location.longitude) {
      return {
        lat: data.location.latitude,
        lng: data.location.longitude,
        formattedAddress: data.formattedAddress || data.displayName?.text || '',
        addressComponents: data.addressComponents || []
      };
    }

    return null;
  } catch (error) {
    console.error('Google Maps place details error:', error);
    
    // Fallback to legacy Places service
    try {
      await initializeGoogleMaps();
      return await getPlaceDetailsLegacy(placeId);
    } catch (fallbackError) {
      console.error('Legacy place details also failed:', fallbackError);
      return null;
    }
  }
};

// Legacy fallback using the old PlacesService
const getPlaceDetailsLegacy = async (placeId: string): Promise<{ lat: number; lng: number; formattedAddress: string; addressComponents: any[] } | null> => {
  console.log('🗺️ Google Maps: Falling back to legacy PlacesService');
  
  const service = new window.google.maps.places.PlacesService(document.createElement('div'));
  
  const request = {
    placeId,
    fields: ['geometry', 'formatted_address', 'address_components']
  };

  const response = await new Promise<any>((resolve, reject) => {
    service.getDetails(request, (place: any, status: any) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
        resolve(place);
      } else {
        reject(new Error(`Place details failed: ${status}`));
      }
    });
  });

  if (response.geometry?.location) {
    const location = response.geometry.location;
    return {
      lat: location.lat(),
      lng: location.lng(),
      formattedAddress: response.formatted_address || '',
      addressComponents: response.address_components || []
    };
  }

  return null;
};

// Reverse geocoding to get address from coordinates
export const reverseGeocode = async (lat: number, lng: number): Promise<{ formattedAddress: string; addressComponents: any[] } | null> => {
  try {
    await initializeGoogleMaps();

    const geocoder = new window.google.maps.Geocoder();
    const latLng = new window.google.maps.LatLng(lat, lng);

    const response = await new Promise<any>((resolve, reject) => {
      geocoder.geocode({ location: latLng }, (results: any, status: any) => {
        if (status === 'OK' && results) {
          resolve({ results });
        } else {
          reject(new Error(`Reverse geocoding failed: ${status}`));
        }
      });
    });

    if (response.results && response.results.length > 0) {
      const result = response.results[0];
      return {
        formattedAddress: result.formatted_address,
        addressComponents: result.address_components
      };
    }

    return null;
  } catch (error) {
    console.error('Google Maps reverse geocoding error:', error);
    return null;
  }
};

// Parse address components from Google Maps response
export const parseGoogleMapsAddressComponents = (components: any[]): Partial<LocationData> => {
  let city = '';
  let state = '';
  let country = 'India';
  let streetNumber = '';
  let route = '';
  let sublocality = '';
  let postalCode = '';

  console.log('🔍 Parsing Google Maps address components:', components);

  components.forEach(component => {
    // Handle both legacy and new API formats
    const types = component.types || [];
    const longName = component.longText || component.long_name || '';
    const shortName = component.shortText || component.short_name || '';
    
    console.log(`Component: ${longName} (${shortName}) - Types:`, types);
    
    // City detection - try multiple types
    if (types.includes('locality')) {
      city = longName;
    } else if (types.includes('administrative_area_level_2') && !city) {
      city = longName;
    } else if (types.includes('sublocality_level_1') && !city) {
      city = longName;
    } else if (types.includes('administrative_area_level_3') && !city) {
      city = longName;
    }
    
    // State detection
    if (types.includes('administrative_area_level_1')) {
      state = longName;
    }
    
    // Country detection
    if (types.includes('country')) {
      country = longName;
    }
    
    // Address components
    if (types.includes('street_number')) {
      streetNumber = longName;
    } else if (types.includes('route')) {
      route = longName;
    } else if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
      sublocality = longName;
    } else if (types.includes('postal_code')) {
      postalCode = longName;
    }
  });

  console.log(`Parsed components - City: "${city}", State: "${state}", Country: "${country}"`);

  // Build a cleaner address
  const addressParts = [];
  if (streetNumber) addressParts.push(streetNumber);
  if (route) addressParts.push(route);
  if (sublocality && sublocality !== city) addressParts.push(sublocality);
  if (postalCode) addressParts.push(postalCode);

  const cleanAddress = addressParts.join(', ');

  return {
    address: cleanAddress,
    city,
    state,
    country
  };
};

// Convert job applicants to map locations (same as existing function)
export const convertApplicantsToMapLocations = async (
  applicants: any[]
): Promise<ApplicantLocation[]> => {
  const locations: ApplicantLocation[] = [];

  for (const applicant of applicants) {
    const locationString = applicant.location;

    if (!locationString) {
      console.warn(`⚠️ No location available for ${applicant.name}, skipping map location`);
      continue;
    }

    console.log(`📍 Google Maps: Geocoding location for ${applicant.name}: "${locationString}"`);

    const coordinates = await geocodeLocation(locationString);
    
    if (coordinates) {
      console.log(`✅ Google Maps: Found coordinates for ${applicant.name}:`, coordinates);
      locations.push({
        id: applicant.id,
        name: applicant.name,
        location: locationString,
        lat: coordinates.lat,
        lng: coordinates.lng,
        status: applicant.status,
        age: applicant.age,
        skills: applicant.skills || [],
        email: applicant.email,
        phone: applicant.phone,
        experience: applicant.experience,
        expectedSalary: applicant.expectedSalary,
      });
    } else {
      console.warn(`❌ Google Maps: No coordinates found for ${applicant.name} at location: "${locationString}" - skipping map location`);
    }
  }

  console.log(`🗺️ Google Maps: Converted ${locations.length} out of ${applicants.length} applicants to map locations`);
  return locations;
};

// Calculate map center based on applicant locations (same as existing function)
export const calculateMapCenter = (locations: ApplicantLocation[]): { lat: number; lng: number } => {
  if (locations.length === 0) {
    return { lat: 20.5937, lng: 78.9629 }; // Center of India
  }

  const totalLat = locations.reduce((sum, loc) => sum + loc.lat, 0);
  const totalLng = locations.reduce((sum, loc) => sum + loc.lng, 0);

  return {
    lat: totalLat / locations.length,
    lng: totalLng / locations.length,
  };
};

// Group applicants by location for clustering (same as existing function)
export const groupApplicantsByLocation = (locations: ApplicantLocation[]): Map<string, ApplicantLocation[]> => {
  const groups = new Map<string, ApplicantLocation[]>();

  locations.forEach(location => {
    const key = `${location.lat.toFixed(2)},${location.lng.toFixed(2)}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(location);
  });

  return groups;
};

// Parse Google Maps URL to extract coordinates
// Supports various formats:
// - google.com/maps/search/15.225113,+74.710605
// - google.com/maps/place/.../@15.225113,74.710605
// - google.com/maps?q=15.225113,74.710605
// - maps.app.goo.gl/... (shortened URLs - requires API call)
// - google.com/maps/dir//15.225113,74.710605
export const parseGoogleMapsUrl = (url: string): { lat: number; lng: number } | null => {
  try {
    console.log('🔍 Parsing Google Maps URL:', url);
    
    // Clean up the URL - handle both full URLs and just the path
    let cleanUrl = url.trim();
    
    // If it doesn't start with http, add it
    if (!cleanUrl.startsWith('http')) {
      if (cleanUrl.startsWith('google.com') || cleanUrl.startsWith('www.google.com')) {
        cleanUrl = 'https://' + cleanUrl;
      } else if (cleanUrl.startsWith('maps.app.goo.gl')) {
        cleanUrl = 'https://' + cleanUrl;
      }
    }
    
    // Pattern 1: Direct coordinate search - google.com/maps/search/LAT,LNG
    // Example: google.com/maps/search/15.225113,+74.710605
    const searchPattern = /maps\/search\/(-?\d+\.?\d*),\s*[\+]?(-?\d+\.?\d*)/i;
    let match = cleanUrl.match(searchPattern);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      console.log('✅ Extracted coordinates from search pattern:', { lat, lng });
      return { lat, lng };
    }
    
    // Pattern 2: Place with coordinates - google.com/maps/place/.../@LAT,LNG,ZOOMz
    // Example: google.com/maps/place/Location+Name/@15.225113,74.710605,17z
    const placePattern = /@(-?\d+\.?\d*),\s*(-?\d+\.?\d*),\s*\d+\.?\d*z/i;
    match = cleanUrl.match(placePattern);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      console.log('✅ Extracted coordinates from place pattern:', { lat, lng });
      return { lat, lng };
    }
    
    // Pattern 3: Query parameter - google.com/maps?q=LAT,LNG
    // Example: google.com/maps?q=15.225113,74.710605
    const queryPattern = /[?&]q=(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/i;
    match = cleanUrl.match(queryPattern);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      console.log('✅ Extracted coordinates from query pattern:', { lat, lng });
      return { lat, lng };
    }
    
    // Pattern 4: Direction destination - google.com/maps/dir//LAT,LNG
    // Example: google.com/maps/dir//15.225113,74.710605
    const dirPattern = /maps\/dir\/\/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/i;
    match = cleanUrl.match(dirPattern);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      console.log('✅ Extracted coordinates from direction pattern:', { lat, lng });
      return { lat, lng };
    }
    
    // Pattern 5: LL parameter - google.com/maps?...&ll=LAT,LNG
    const llPattern = /[?&]ll=(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/i;
    match = cleanUrl.match(llPattern);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      console.log('✅ Extracted coordinates from ll parameter:', { lat, lng });
      return { lat, lng };
    }
    
    // Pattern 6: Center parameter - google.com/maps?...&center=LAT,LNG
    const centerPattern = /[?&]center=(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/i;
    match = cleanUrl.match(centerPattern);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      console.log('✅ Extracted coordinates from center parameter:', { lat, lng });
      return { lat, lng };
    }
    
    // Pattern 7: Coordinates in URL path after @ - handle various formats
    // Example: /@15.225113,74.710605
    const atPattern = /@(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/i;
    match = cleanUrl.match(atPattern);
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      console.log('✅ Extracted coordinates from @ pattern:', { lat, lng });
      return { lat, lng };
    }
    
    console.warn('❌ Could not extract coordinates from Google Maps URL');
    return null;
  } catch (error) {
    console.error('Error parsing Google Maps URL:', error);
    return null;
  }
};

// Check if a string looks like a Google Maps URL
export const isGoogleMapsUrl = (input: string): boolean => {
  if (!input || typeof input !== 'string') {
    return false;
  }
  
  const lowerInput = input.toLowerCase().trim();
  
  // Check for various Google Maps URL patterns
  return (
    lowerInput.includes('google.com/maps') ||
    lowerInput.includes('maps.google.com') ||
    lowerInput.includes('goo.gl/maps') ||
    lowerInput.includes('maps.app.goo.gl')
  );
};

// Check if Google Maps should be used
export const shouldUseGoogleMaps = (): boolean => {
  return import.meta.env.VITE_USE_GOOGLE_MAPS === 'true';
};

// Export Google Maps loader instance for direct use in components
export const getGoogleMapsLoader = (): Loader | null => {
  return googleMapsLoader;
};

// Initialize and return Google Maps instance
export const initializeGoogleMapsInstance = async (): Promise<void> => {
  await initializeGoogleMaps();
};

// Debug function to test Google Maps loading from browser console
// Usage: window.testGoogleMaps()
export const testGoogleMapsLoading = async (): Promise<boolean> => {
  try {
    console.log('🧪 Testing Google Maps loading...');
    await initializeGoogleMaps();
    
    if (window.google && window.google.maps) {
      console.log('✅ Google Maps test successful!');
      console.log('Available Google Maps services:', {
        Map: !!window.google.maps.Map,
        Geocoder: !!window.google.maps.Geocoder,
        places: !!window.google.maps.places
      });
      return true;
    } else {
      console.error('❌ Google Maps not available after loading');
      return false;
    }
  } catch (error) {
    console.error('❌ Google Maps test failed:', error);
    return false;
  }
};

// Make test function available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).testGoogleMaps = testGoogleMapsLoading;
}
