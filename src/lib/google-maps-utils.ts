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

// Initialize Google Maps loader with the new Places API
const initializeGoogleMaps = async (): Promise<void> => {
  if (isGoogleMapsLoaded) return;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
    throw new Error('Google Maps API key is not configured. Please set VITE_GOOGLE_MAPS_API_KEY in your environment variables.');
  }

  if (!googleMapsLoader) {
    googleMapsLoader = new Loader({
      apiKey,
      version: 'weekly',
      libraries: ['places', 'geometry'],
      region: 'IN', // Set region to India
      language: 'en'
    });
  }

  try {
    await googleMapsLoader.load();
    isGoogleMapsLoaded = true;
  } catch (error) {
    console.error('Failed to load Google Maps:', error);
    throw new Error('Failed to initialize Google Maps. Please check your API key and internet connection.');
  }
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

    console.log('🗺️ Google Maps: Using Places API (New) for place details');

    // Use the new Places API (New) with Fetch API
    const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'location,formattedAddress,addressComponents'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Place Details API error:', response.status, errorText);
      throw new Error(`Place Details API failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.location && data.location.latitude && data.location.longitude) {
      return {
        lat: data.location.latitude,
        lng: data.location.longitude,
        formattedAddress: data.formattedAddress || '',
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

  components.forEach(component => {
    const types = component.types;
    
    if (types.includes('locality')) {
      city = component.long_name;
    } else if (types.includes('administrative_area_level_2') && !city) {
      city = component.long_name;
    } else if (types.includes('administrative_area_level_1')) {
      state = component.long_name;
    } else if (types.includes('country')) {
      country = component.long_name;
    } else if (types.includes('street_number')) {
      streetNumber = component.long_name;
    } else if (types.includes('route')) {
      route = component.long_name;
    } else if (types.includes('sublocality') || types.includes('sublocality_level_1')) {
      sublocality = component.long_name;
    } else if (types.includes('postal_code')) {
      postalCode = component.long_name;
    }
  });

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
