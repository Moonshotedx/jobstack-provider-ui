// Utility functions for map functionality

export interface ApplicantLocation {
  id: string;
  name: string;
  location: string;
  lat: number;
  lng: number;
  status: string;
  age: number;
  skills: string[];
  email: string;
  phone: string;
  experience?: string;
  expectedSalary?: string;
}

// Mock geocoding function - in a real app, you'd use a geocoding service
export const geocodeLocation = async (location: string): Promise<{ lat: number; lng: number } | null> => {
  // This is a mock implementation
  // In a real app, you'd use Google Maps Geocoding API, OpenStreetMap Nominatim, or similar
  
  const mockCoordinates: Record<string, { lat: number; lng: number }> = {
    'mumbai': { lat: 19.0760, lng: 72.8777 },
    'delhi': { lat: 28.7041, lng: 77.1025 },
    'bangalore': { lat: 12.9716, lng: 77.5946 },
    'hyderabad': { lat: 17.3850, lng: 78.4867 },
    'chennai': { lat: 13.0827, lng: 80.2707 },
    'kolkata': { lat: 22.5726, lng: 88.3639 },
    'pune': { lat: 18.5204, lng: 73.8567 },
    'ahmedabad': { lat: 23.0225, lng: 72.5714 },
    'jaipur': { lat: 26.9124, lng: 75.7873 },
    'lucknow': { lat: 26.8467, lng: 80.9462 },
    'kanpur': { lat: 26.4499, lng: 80.3319 },
    'nagpur': { lat: 21.1458, lng: 79.0882 },
    'indore': { lat: 22.7196, lng: 75.8577 },
    'thane': { lat: 19.2183, lng: 72.9781 },
    'bhopal': { lat: 23.2599, lng: 77.4126 },
    'visakhapatnam': { lat: 17.6868, lng: 83.2185 },
    'patna': { lat: 25.5941, lng: 85.1376 },
    'vadodara': { lat: 22.3072, lng: 73.1812 },
    'ghaziabad': { lat: 28.6692, lng: 77.4538 },
    'ludhiana': { lat: 30.9010, lng: 75.8573 },
    'agra': { lat: 27.1767, lng: 78.0081 },
    'nashik': { lat: 19.9975, lng: 73.7898 },
    'faridabad': { lat: 28.4089, lng: 77.3178 },
    'meerut': { lat: 28.9845, lng: 77.7064 },
    'rajkot': { lat: 22.3039, lng: 70.8022 },
    'kalyan': { lat: 19.2437, lng: 73.1355 },
    'vasai': { lat: 19.4259, lng: 72.8225 },
    'vashi': { lat: 19.0759, lng: 72.9986 },
    'aurangabad': { lat: 19.8762, lng: 75.3433 },
    'dombivli': { lat: 19.2183, lng: 73.0931 },
    'amritsar': { lat: 31.6340, lng: 74.8723 },
    'allahabad': { lat: 25.4358, lng: 81.8463 },
    'howrah': { lat: 22.5958, lng: 88.2636 },
    'coimbatore': { lat: 11.0168, lng: 76.9558 },
    'jabalpur': { lat: 23.1815, lng: 79.9864 },
    'gwalior': { lat: 26.2183, lng: 78.1828 },
    'vijayawada': { lat: 16.5062, lng: 80.6480 },
    'jodhpur': { lat: 26.2389, lng: 73.0243 },
    'madurai': { lat: 9.9252, lng: 78.1198 },
    'raipur': { lat: 21.2514, lng: 81.6296 },
    'kota': { lat: 25.2138, lng: 75.8648 },
    'guwahati': { lat: 26.1445, lng: 91.7362 },
    'chandigarh': { lat: 30.7333, lng: 76.7794 },
    'mysore': { lat: 12.2958, lng: 76.6394 },
    'bhubaneswar': { lat: 20.2961, lng: 85.8245 },
    'salem': { lat: 11.6643, lng: 78.1460 },
    'gurgaon': { lat: 28.4595, lng: 77.0266 },
    'aligarh': { lat: 27.8974, lng: 78.0880 },
    'jalandhar': { lat: 31.3260, lng: 75.5762 },
    'bareilly': { lat: 28.3670, lng: 79.4304 },
    'moradabad': { lat: 28.8389, lng: 78.7738 },
    'warangal': { lat: 17.9689, lng: 79.5941 },
    'guntur': { lat: 16.2991, lng: 80.4575 },
    'bhiwandi': { lat: 19.3000, lng: 73.0667 },
    'saharanpur': { lat: 29.9674, lng: 77.5536 },
    'gorakhpur': { lat: 26.7606, lng: 83.3732 },
    'bikaner': { lat: 28.0229, lng: 73.3119 },
    'amravati': { lat: 20.9374, lng: 77.7796 },
    'noida': { lat: 28.5355, lng: 77.3910 },
    'jamshedpur': { lat: 22.8046, lng: 86.2029 },
    'bhilai': { lat: 21.2094, lng: 81.4285 },
    'cuttack': { lat: 20.4625, lng: 85.8830 },
    'firozabad': { lat: 27.1591, lng: 78.3958 },
    'kochi': { lat: 9.9312, lng: 76.2673 },
    'nellore': { lat: 14.4426, lng: 79.9864 },
    'dehradun': { lat: 30.3165, lng: 78.0322 },
    'durgapur': { lat: 23.5204, lng: 87.3119 },
    'asansol': { lat: 23.6889, lng: 86.9661 },
    'rourkela': { lat: 22.2492, lng: 84.8828 },
    'bhagalpur': { lat: 25.2445, lng: 87.0068 },
    'akola': { lat: 20.7096, lng: 77.0021 },
    'kurnool': { lat: 15.8281, lng: 78.0373 },
    'rajahmundry': { lat: 17.0005, lng: 81.8040 },
    'kollam': { lat: 8.8932, lng: 76.6141 },
    'ujjain': { lat: 23.1765, lng: 75.7885 },
    'malegaon': { lat: 20.5575, lng: 74.5279 },
    'jamnagar': { lat: 22.4707, lng: 70.0577 },
    'loni': { lat: 28.7515, lng: 77.2885 },
    'siliguri': { lat: 26.7271, lng: 88.3953 },
    'jhansi': { lat: 25.4484, lng: 78.5685 },
    'ulhasnagar': { lat: 19.2183, lng: 73.1634 },
    'jammu': { lat: 32.7266, lng: 74.8570 },
    'sangli': { lat: 16.8524, lng: 74.5815 },
    'mirzapur': { lat: 25.1449, lng: 82.5653 },
    'raiganj': { lat: 25.6167, lng: 88.1167 },
    'tiruppur': { lat: 11.1085, lng: 77.3411 },
    'karnal': { lat: 29.6857, lng: 76.9905 },
    'bathinda': { lat: 30.2070, lng: 74.9455 },
    'ratlam': { lat: 23.3341, lng: 75.0376 },
    'avadi': { lat: 13.1147, lng: 80.0997 },
    'dindigul': { lat: 10.3623, lng: 77.9802 },
    'ahmednagar': { lat: 19.0952, lng: 74.7496 },
    'eluru': { lat: 16.7131, lng: 81.1034 },
    'rohtak': { lat: 28.8955, lng: 76.6066 },
    'bharatpur': { lat: 27.2172, lng: 77.4901 },
    'panipat': { lat: 29.3909, lng: 76.9635 },
    'dharwad': { lat: 15.4589, lng: 75.0078 },
    'calicut': { lat: 11.2588, lng: 75.7804 },
    'kakinada': { lat: 16.9891, lng: 82.2475 },
    'belgaum': { lat: 15.8497, lng: 74.4977 },
    'tiruchirappalli': { lat: 10.7905, lng: 78.7047 },
    'muzaffarpur': { lat: 26.1209, lng: 85.3647 },
    'mathura': { lat: 27.4924, lng: 77.6737 },
    'kadapa': { lat: 14.4753, lng: 78.8354 },
    'anantapur': { lat: 14.6819, lng: 77.6006 },
    'jalgaon': { lat: 21.0077, lng: 75.5626 },
    'ichalkaranji': { lat: 16.6915, lng: 74.4609 },
    'varanasi': { lat: 25.3176, lng: 82.9739 },
    'sasaram': { lat: 24.9483, lng: 84.0183 },
    'bijapur': { lat: 16.8308, lng: 75.7156 },
    'rampur': { lat: 28.8108, lng: 79.0264 },
    'shimla': { lat: 31.1048, lng: 77.1734 },
    'vellore': { lat: 12.9716, lng: 79.1590 },
    'ajmer': { lat: 26.4499, lng: 74.6399 },
    'ranchi': { lat: 23.3441, lng: 85.3096 },
    'dhanbad': { lat: 23.7957, lng: 86.4304 },
  };

  // Try to find exact match first
  const locationLower = location.toLowerCase();
  if (mockCoordinates[locationLower]) {
    return mockCoordinates[locationLower];
  }

  // Try partial matches
  for (const [city, coords] of Object.entries(mockCoordinates)) {
    if (locationLower.includes(city) || city.includes(locationLower)) {
      return coords;
    }
  }

  // If no match found, return a random coordinate in India
  return {
    lat: 20.5937 + (Math.random() - 0.5) * 10, // Random latitude around India
    lng: 78.9629 + (Math.random() - 0.5) * 10, // Random longitude around India
  };
};

// Convert job applicants to map locations
export const convertApplicantsToMapLocations = async (
  applicants: any[]
): Promise<ApplicantLocation[]> => {
  const locations: ApplicantLocation[] = [];

  for (const applicant of applicants) {
    // Extract location from applicant data
    const locationString = applicant.location || 
                          applicant.experience || 
                          (applicant.whatIHave && applicant.whatIHave.whoIAm?.location) ||
                          'Mumbai'; // Default fallback

    // Geocode the location
    const coordinates = await geocodeLocation(locationString);
    
    if (coordinates) {
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
    }
  }

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