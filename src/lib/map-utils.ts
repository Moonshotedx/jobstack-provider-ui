// Utility functions for map functionality

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

// Geocoding function using OpenStreetMap Nominatim API
export const geocodeLocation = async (location: string): Promise<{ lat: number; lng: number } | null> => {
  if (!location) return null;

  try {
    // Add "India" to the search query to improve accuracy for Indian locations
    const searchQuery = location.includes('India') ? location : `${location}, India`;
    
    console.log(`🔍 Searching for coordinates: "${searchQuery}"`);
    
    // Construct the API URL with better parameters for Indian locations
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&countrycodes=in&addressdetails=1`
    );

    if (!response.ok) {
      console.error('Geocoding API request failed:', response.statusText);
      return null;
    }

    const data = await response.json();

    // If we get a result, return the coordinates
    if (data && data.length > 0) {
      const result = data[0];
      console.log(`📍 Found location: "${result.display_name}"`);
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
      };
    }

    // If no result with "India", try without it
    if (!location.includes('India')) {
      console.log(`🔄 Retrying without "India" suffix: "${location}"`);
      const retryResponse = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1&countrycodes=in&addressdetails=1`
      );

      if (retryResponse.ok) {
        const retryData = await retryResponse.json();
        if (retryData && retryData.length > 0) {
          const result = retryData[0];
          console.log(`📍 Found location (retry): "${result.display_name}"`);
          return {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
          };
        }
      }
    }

    console.warn(`❌ No coordinates found for location: "${location}"`);
    return null;
  } catch (error) {
    console.error('Error during geocoding:', error);
    return null;
  }
};

// Convert job applicants to map locations
export const convertApplicantsToMapLocations = async (
  applicants: any[]
): Promise<ApplicantLocation[]> => {
  const locations: ApplicantLocation[] = [];

  for (const applicant of applicants) {
    // Use the location field that's already set in the applicants mapping
    const locationString = applicant.location || 'Mumbai'; // Default fallback

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
      console.warn(`❌ No coordinates found for ${applicant.name} at location: "${locationString}"`);
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