// Utility functions for map functionality
import * as GoogleMapsUtils from './google-maps-utils';

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

// Check if Google Maps should be used
const shouldUseGoogleMaps = (): boolean => {
  return import.meta.env.VITE_USE_GOOGLE_MAPS === 'true';
};

// Geocoding function using OpenStreetMap Nominatim API (existing implementation)
const geocodeLocationNominatim = async (location: string): Promise<{ lat: number; lng: number } | null> => {
  if (!location) return null;

  try {
    // Clean and validate the location string
    const cleanLocation = location.trim();
    if (!cleanLocation) return null;

    console.log(`🔍 Nominatim: Searching for coordinates: "${cleanLocation}"`);
    
    // First, try with the exact location string
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanLocation)}&format=json&limit=5&addressdetails=1&countrycodes=in&bounded=1&viewbox=68.1766451,8.0883064,97.4025619,37.09024`
    );

    if (!response.ok) {
      console.error('Geocoding API request failed:', response.statusText);
      return null;
    }

    const data = await response.json();

    // If we get results, find the best match
    if (data && data.length > 0) {
      // Look for an exact or close match
      const bestMatch = data.find((result: any) => {
        const displayName = result.display_name.toLowerCase();
        const searchTerms = cleanLocation.toLowerCase().split(',').map(term => term.trim());
        
        // Check if the location string appears in the result
        return searchTerms.some(term => displayName.includes(term));
      }) || data[0]; // Fallback to first result if no exact match

      console.log(`📍 Nominatim: Found location: "${bestMatch.display_name}"`);
      
      // Validate that we're not getting a generic Indian location
      const displayName = bestMatch.display_name.toLowerCase();
      if (displayName.includes('bangalore') && !cleanLocation.toLowerCase().includes('bangalore')) {
        console.warn(`⚠️ Got Bangalore coordinates for non-Bangalore location: "${cleanLocation}"`);
        return null;
      }
      
      // Additional validation: check if coordinates are within India bounds
      const lat = parseFloat(bestMatch.lat);
      const lng = parseFloat(bestMatch.lon);
      
      // India bounds: approximately 8°N to 37°N and 68°E to 97°E
      if (lat < 8 || lat > 37 || lng < 68 || lng > 97) {
        console.warn(`⚠️ Coordinates outside India bounds: ${lat}, ${lng} for location: "${cleanLocation}"`);
        return null;
      }
      
      return { lat, lng };
    }

    // If no result, try with "India" suffix
    if (!cleanLocation.includes('India')) {
      console.log(`🔄 Retrying with "India" suffix: "${cleanLocation}, India"`);
      const retryResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cleanLocation + ', India')}&format=json&limit=5&addressdetails=1&countrycodes=in&bounded=1&viewbox=68.1766451,8.0883064,97.4025619,37.09024`
      );

      if (retryResponse.ok) {
        const retryData = await retryResponse.json();
        if (retryData && retryData.length > 0) {
          const bestMatch = retryData.find((result: any) => {
            const displayName = result.display_name.toLowerCase();
            const searchTerms = cleanLocation.toLowerCase().split(',').map(term => term.trim());
            return searchTerms.some(term => displayName.includes(term));
          }) || retryData[0];

          console.log(`📍 Nominatim: Found location (retry): "${bestMatch.display_name}"`);
          
          // Validate that we're not getting a generic Indian location
          const displayName = bestMatch.display_name.toLowerCase();
          if (displayName.includes('bangalore') && !cleanLocation.toLowerCase().includes('bangalore')) {
            console.warn(`⚠️ Got Bangalore coordinates for non-Bangalore location: "${cleanLocation}"`);
            return null;
          }
          
          // Additional validation: check if coordinates are within India bounds
          const lat = parseFloat(bestMatch.lat);
          const lng = parseFloat(bestMatch.lon);
          
          // India bounds: approximately 8°N to 37°N and 68°E to 97°E
          if (lat < 8 || lat > 37 || lng < 68 || lng > 97) {
            console.warn(`⚠️ Coordinates outside India bounds: ${lat}, ${lng} for location: "${cleanLocation}"`);
            return null;
          }
          
          return { lat, lng };
        }
      }
    }

    console.warn(`❌ Nominatim: No coordinates found for location: "${cleanLocation}"`);
    return null;
  } catch (error) {
    console.error('Error during geocoding:', error);
    return null;
  }
};

// Main geocoding function that delegates to the appropriate service
export const geocodeLocation = async (location: string): Promise<{ lat: number; lng: number } | null> => {
  if (shouldUseGoogleMaps()) {
    console.log('🗺️ Using Google Maps for geocoding');
    return GoogleMapsUtils.geocodeLocation(location);
  } else {
    console.log('🗺️ Using Nominatim for geocoding');
    return geocodeLocationNominatim(location);
  }
};

// Test function to debug geocoding issues
export const testGeocoding = async (location: string) => {
  console.log(`🧪 Testing geocoding for: "${location}"`);
  
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=5&addressdetails=1&countrycodes=in&bounded=1&viewbox=68.1766451,8.0883064,97.4025619,37.09024`
    );

    if (!response.ok) {
      console.error('API request failed:', response.statusText);
      return null;
    }

    const data = await response.json();
    console.log('API Response:', data);
    
    if (data && data.length > 0) {
      console.log('First result:', data[0]);
      return data[0];
    }
    
    return null;
  } catch (error) {
    console.error('Test geocoding error:', error);
    return null;
  }
};

// Convert job applicants to map locations
export const convertApplicantsToMapLocations = async (
  applicants: any[]
): Promise<ApplicantLocation[]> => {
  if (shouldUseGoogleMaps()) {
    console.log('🗺️ Using Google Maps for converting applicants to map locations');
    return GoogleMapsUtils.convertApplicantsToMapLocations(applicants);
  }

  // Use Nominatim (existing implementation)
  console.log('🗺️ Using Nominatim for converting applicants to map locations');
  const locations: ApplicantLocation[] = [];

  for (const applicant of applicants) {
    // Use the location field that's already set in the applicants mapping
    const locationString = applicant.location;

    // Skip if no location is available
    if (!locationString) {
      console.warn(`⚠️ No location available for ${applicant.name}, skipping map location`);
      continue;
    }

    console.log(`📍 Geocoding location for ${applicant.name}: "${locationString}"`);

    // Geocode the location
    const coordinates = await geocodeLocation(locationString);
    
    if (coordinates) {
      console.log(`✅ Found coordinates for ${applicant.name}:`, coordinates);
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
      console.warn(`❌ No coordinates found for ${applicant.name} at location: "${locationString}" - skipping map location`);
    }
  }

  console.log(`🗺️ Converted ${locations.length} out of ${applicants.length} applicants to map locations`);
  return locations;
};

// Calculate map center based on applicant locations
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

// Group applicants by location for clustering
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