import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

// Structured location data interface
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

interface LocationFieldProps {
  label: string;
  value: string | LocationData;
  onChange: (value: string | LocationData) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  returnStructuredData?: boolean; // New prop to control return type
}

type LocationStatus = 'idle' | 'loading' | 'success' | 'error';

export const LocationField: React.FC<LocationFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  className = '',
  returnStructuredData = false
}) => {
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Helper function to parse address components from Nominatim response
  const parseAddressComponents = (nominatimData: any): Partial<LocationData> => {
    const addressComponents = nominatimData.address || {};
    
    // Extract components based on Nominatim structure
    const city = addressComponents.city || 
                 addressComponents.town || 
                 addressComponents.village || 
                 addressComponents.municipality || 
                 addressComponents.suburb ||
                 addressComponents.neighbourhood ||
                 '';
    
    const state = addressComponents.state || 
                  addressComponents.province || 
                  '';
    
    const country = addressComponents.country || 'India';
    
    // Build a cleaner address without city, state, country repetition
    const addressParts = [];
    
    // Add house number and road
    if (addressComponents.house_number) addressParts.push(addressComponents.house_number);
    if (addressComponents.road) addressParts.push(addressComponents.road);
    
    // Add locality/area details
    if (addressComponents.neighbourhood && addressComponents.neighbourhood !== city) {
      addressParts.push(addressComponents.neighbourhood);
    }
    if (addressComponents.suburb && addressComponents.suburb !== city && addressComponents.suburb !== addressComponents.neighbourhood) {
      addressParts.push(addressComponents.suburb);
    }
    
    // Add postcode if available
    if (addressComponents.postcode) addressParts.push(addressComponents.postcode);
    
    const cleanAddress = addressParts.length > 0 ? addressParts.join(', ') : nominatimData.display_name;
    
    return {
      address: cleanAddress,
      city,
      state,
      country
    };
  };

  // Helper function to geocode address string to get coordinates
  const geocodeAddress = async (addressString: string): Promise<{lat: number, lng: number} | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressString)}&limit=1&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'JobPortal/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to geocode address');
      }

      const data = await response.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        return {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        };
      }
      
      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });

      const { latitude, longitude } = position.coords;
      
      // Use OpenStreetMap Nominatim API for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'JobPortal/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get address information');
      }

      const data = await response.json();
      
      if (data && data.display_name) {
        if (returnStructuredData) {
          // Return structured location data
          const addressComponents = parseAddressComponents(data);
          const locationData: LocationData = {
            address: addressComponents.address || data.display_name,
            city: addressComponents.city || '',
            state: addressComponents.state || '',
            country: addressComponents.country || 'India',
            tag: addressComponents.city || 'job-location', // Use city as tag or default
            gps: {
              lat: latitude,
              lng: longitude
            }
          };
          
          onChange(locationData);
          setStatus('success');
          toast.success('Location detected successfully!');
        } else {
          // Return just the address string (legacy behavior)
          onChange(data.display_name);
          setStatus('success');
          toast.success('Location detected successfully!');
        }
        
        // Reset status after 3 seconds
        setTimeout(() => setStatus('idle'), 3000);
      } else {
        throw new Error('No address found for this location');
      }
    } catch (error: any) {
      setStatus('error');
      
      let message = 'Failed to get current location';
      
      if (error.code === 1) {
        message = 'Location access denied. Please enable location access and try again.';
      } else if (error.code === 2) {
        message = 'Location unavailable. Please check your connection and try again.';
      } else if (error.code === 3) {
        message = 'Location request timed out. Please try again.';
      } else if (error.message) {
        message = error.message;
      }
      
      setErrorMessage(message);
      toast.error(message);
      
      // Reset status after 5 seconds
      setTimeout(() => {
        setStatus('idle');
        setErrorMessage('');
      }, 5000);
    }
  };

  // Handle manual address input with geocoding
  const handleAddressChange = async (inputValue: string) => {
    if (returnStructuredData && inputValue.trim()) {
      // Debounce geocoding for manual input
      setTimeout(async () => {
        const coordinates = await geocodeAddress(inputValue);
        if (coordinates) {
          const locationData: LocationData = {
            address: inputValue,
            city: '', // User will need to fill these manually or we could try to parse
            state: '',
            country: 'India',
            tag: 'job-location', // Default tag for manual input
            gps: coordinates
          };
          onChange(locationData);
        } else {
          // Fallback to basic structure
          const locationData: LocationData = {
            address: inputValue,
            city: '',
            state: '',
            country: 'India',
            tag: 'job-location', // Default tag for fallback
            gps: { lat: 0, lng: 0 }
          };
          onChange(locationData);
        }
      }, 1000);
    } else {
      onChange(inputValue);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return (
          <MapPin 
            className="h-4 w-4 text-blue-600 cursor-pointer hover:text-blue-700 transition-colors" 
            onClick={getCurrentLocation}
          />
        );
    }
  };

  const getInputBorderClass = () => {
    if (!status || status === 'idle') return required && !value ? 'border-red-300' : '';
    
    if (status === 'success') {
      return 'border-green-300 focus:border-green-500';
    } else if (status === 'error') {
      return 'border-red-300 focus:border-red-500';
    } else if (status === 'loading') {
      return 'border-blue-300 focus:border-blue-500';
    }
    
    return '';
  };

  // Get display value for input
  const getDisplayValue = () => {
    if (typeof value === 'string') {
      return value;
    } else if (value && typeof value === 'object' && 'address' in value) {
      // For structured data, show the full formatted address
      const parts = [value.address];
      if (value.city) parts.push(value.city);
      if (value.state) parts.push(value.state);
      if (value.country && value.country !== 'India') parts.push(value.country);
      return parts.join(', ');
    }
    return '';
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor="location-field">
        {label}{required && ' *'}
      </Label>
      
      <div className="space-y-2">
        <div className="relative">
          <Input
            id="location-field"
            value={getDisplayValue()}
            onChange={(e) => handleAddressChange(e.target.value)}
            placeholder={placeholder || "Enter location or click map pin for current location"}
            className={`pr-10 ${getInputBorderClass()}`}
          />
          
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {getStatusIcon()}
          </div>
        </div>

        {/* Status feedback */}
        {status === 'success' && (
          <div className="flex items-center gap-2">
            <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
              Location detected successfully
            </Badge>
          </div>
        )}

        {status === 'error' && errorMessage && (
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
              {errorMessage}
            </Badge>
          </div>
        )}

        {status === 'loading' && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Getting your location...
            </Badge>
          </div>
        )}

        {status === 'idle' && !value && (
          <p className="text-xs text-muted-foreground">
            Click the map pin icon to automatically detect your current location
          </p>
        )}

        {/* Show parsed location components for structured data */}
        {returnStructuredData && value && typeof value === 'object' && 'gps' in value && (
          <div className="mt-2 p-2 bg-gray-50 rounded-md text-xs">
            <div className="grid grid-cols-2 gap-1">
              <span><strong>City:</strong> {value.city || 'Not detected'}</span>
              <span><strong>State:</strong> {value.state || 'Not detected'}</span>
              <span><strong>Country:</strong> {value.country || 'India'}</span>
              <span><strong>GPS:</strong> {value.gps.lat.toFixed(4)}, {value.gps.lng.toFixed(4)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 