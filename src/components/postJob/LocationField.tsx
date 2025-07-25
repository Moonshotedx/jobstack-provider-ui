import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    suburb?: string;
    neighbourhood?: string;
    state?: string;
    province?: string;
    country?: string;
    house_number?: string;
    road?: string;
    postcode?: string;
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
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize input value from props
  useEffect(() => {
    setInputValue(getDisplayValue());
  }, [value]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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



  // Search for address suggestions
  const searchAddressSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&countrycodes=in`,
        {
          headers: {
            'User-Agent': 'JobPortal/1.0'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data = await response.json();
      setSuggestions(data || []);
      setShowSuggestions(data && data.length > 0);
    } catch (error) {
      console.error('Search suggestions error:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsSearching(false);
    }
  };

  // Debounced search function
  const debouncedSearch = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
    
    // Clear previous timeout
    if (debouncedSearch.current) {
      clearTimeout(debouncedSearch.current);
    }

    // Set new timeout for search
    debouncedSearch.current = setTimeout(() => {
      searchAddressSuggestions(newValue);
    }, 300);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: LocationSuggestion) => {
    if (returnStructuredData) {
      const addressComponents = parseAddressComponents(suggestion);
      const locationData: LocationData = {
        address: addressComponents.address || suggestion.display_name,
        city: addressComponents.city || '',
        state: addressComponents.state || '',
        country: addressComponents.country || 'India',
        tag: addressComponents.city || 'job-location',
        gps: {
          lat: parseFloat(suggestion.lat),
          lng: parseFloat(suggestion.lon)
        }
      };
      onChange(locationData);
    } else {
      onChange(suggestion.display_name);
    }
    
    setInputValue(suggestion.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
    setStatus('success');
    
    // Reset status after 3 seconds
    setTimeout(() => setStatus('idle'), 3000);
  };

  // Handle manual entry (when user types and no suggestions are selected)
  const handleManualEntry = async () => {
    if (returnStructuredData) {
      setStatus('loading');
      try {
        // Try to geocode the manual entry to get structured data
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(inputValue)}&limit=1&addressdetails=1&countrycodes=in`,
          {
            headers: {
              'User-Agent': 'JobPortal/1.0'
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to parse address');
        }

        const data = await response.json();
        
        if (data && data.length > 0) {
          // Parse the geocoded result to extract address components
          const result = data[0];
          const addressComponents = parseAddressComponents(result);
          
          const locationData: LocationData = {
            address: addressComponents.address || inputValue,
            city: addressComponents.city || '',
            state: addressComponents.state || '',
            country: addressComponents.country || 'India',
            tag: addressComponents.city || 'job-location',
            gps: {
              lat: parseFloat(result.lat),
              lng: parseFloat(result.lon)
            }
          };
          
          onChange(locationData);
          setStatus('success');
          toast.success('Address parsed successfully!');
        } else {
          // If no geocoding result, use the input as-is but try to parse common patterns
          const parsedComponents = parseManualAddress(inputValue);
          const locationData: LocationData = {
            address: parsedComponents.address,
            city: parsedComponents.city,
            state: parsedComponents.state,
            country: parsedComponents.country,
            tag: parsedComponents.city || 'job-location',
            gps: { lat: 0, lng: 0 } // No coordinates available
          };
          
          onChange(locationData);
          setStatus('success');
          toast.success('Address parsed (coordinates not available)');
        }
      } catch (error) {
        console.error('Manual entry parsing error:', error);
        // Fallback: use the input as-is with basic parsing
        const parsedComponents = parseManualAddress(inputValue);
                 const locationData: LocationData = {
           address: parsedComponents.address,
           city: parsedComponents.city,
           state: parsedComponents.state,
           country: parsedComponents.country,
           tag: parsedComponents.city || 'job-location',
           gps: { lat: 0, lng: 0 }
         };
        
        onChange(locationData);
        setStatus('success');
        toast.success('Address parsed (basic parsing)');
      }
    } else {
      onChange(inputValue);
    }
    
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Reset status after 3 seconds
    setTimeout(() => setStatus('idle'), 3000);
  };

  // Helper function to parse manually typed addresses
  const parseManualAddress = (addressString: string): { address: string; city: string; state: string; country: string } => {
    const address = addressString.trim();
    
    // Common patterns for Indian addresses
    const patterns = [
      // Pattern: "Street, City, State"
      /^(.+?),\s*([^,]+?),\s*([^,]+?)(?:,\s*India)?$/i,
      // Pattern: "Street, City, State, India"
      /^(.+?),\s*([^,]+?),\s*([^,]+?),\s*India$/i,
      // Pattern: "Street, City, State, Country"
      /^(.+?),\s*([^,]+?),\s*([^,]+?),\s*([^,]+)$/i,
      // Pattern: "Street, City"
      /^(.+?),\s*([^,]+?)$/i,
      // Pattern: "City, State"
      /^([^,]+?),\s*([^,]+?)$/i
    ];
    
    for (const pattern of patterns) {
      const match = address.match(pattern);
      if (match) {
        if (match.length === 5) {
          // Full pattern: Street, City, State, Country
          return {
            address: match[1].trim() || '',
            city: match[2].trim() || '',
            state: match[3].trim() || '',
            country: match[4].trim() || 'India'
          };
        } else if (match.length === 4) {
          // Pattern: Street, City, State
          return {
            address: match[1].trim() || '',
            city: match[2].trim() || '',
            state: match[3].trim() || '',
            country: 'India'
          };
        } else if (match.length === 3) {
          // Pattern: Street, City or City, State
          if (address.includes(',')) {
            // Likely Street, City
            return {
              address: match[1].trim() || '',
              city: match[2].trim() || '',
              state: '',
              country: 'India'
            };
          } else {
            // Likely City, State
            return {
              address: '',
              city: match[1].trim() || '',
              state: match[2].trim() || '',
              country: 'India'
            };
          }
        }
      }
    }
    
    // If no pattern matches, treat the entire string as address
    return {
      address: address || '',
      city: '',
      state: '',
      country: 'India'
    };
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
          setInputValue(locationData.address);
          setStatus('success');
          toast.success('Location detected successfully!');
        } else {
          // Return just the address string (legacy behavior)
          onChange(data.display_name);
          setInputValue(data.display_name);
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
          <Tooltip>
            <TooltipTrigger asChild>
              <MapPin 
                className="h-4 w-4 text-blue-600 cursor-pointer hover:text-blue-700 transition-colors" 
                onClick={getCurrentLocation}
              />
            </TooltipTrigger>
            <TooltipContent>
              <p>Get current location</p>
            </TooltipContent>
          </Tooltip>
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
            ref={inputRef}
            id="location-field"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true);
              }
            }}
            onBlur={(e) => {
              // Check for whitespace-only values for required fields
              if (required && typeof inputValue === 'string' && inputValue.trim() === '') {
                toast.error(`${label} cannot be empty or contain only spaces`);
                e.target.classList.add('border-red-300');
              } else {
                e.target.classList.remove('border-red-300');
              }
              
              // Delay hiding suggestions to allow clicking on them
              setTimeout(() => {
                if (!suggestionsRef.current?.contains(document.activeElement)) {
                  setShowSuggestions(false);
                }
              }, 200);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleManualEntry();
              }
            }}
            placeholder={placeholder || "Type to search for locations or click map pin for current location"}
            className={`pr-10 ${getInputBorderClass()} ${required && (!inputValue || (typeof inputValue === 'string' && inputValue.trim() === '')) ? 'border-red-300' : ''}`}
          />
          
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
            {isSearching && (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            )}
            {getStatusIcon()}
          </div>
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div 
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                <div className="text-sm font-medium">{suggestion.display_name}</div>
                {suggestion.address && (
                  <div className="text-xs text-gray-500 mt-1">
                    {suggestion.address.city && `${suggestion.address.city}, `}
                    {suggestion.address.state && `${suggestion.address.state}, `}
                    {suggestion.address.country}
                  </div>
                )}
              </div>
            ))}
            <div className="px-4 py-2 text-xs text-gray-500 border-t border-gray-200">
              Press Enter to use your typed address if no suggestion matches
            </div>
          </div>
        )}

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
            Start typing to search for locations or click the map pin icon to automatically detect your current location
          </p>
        )}

        {/* Show parsed location components for structured data */}
        {returnStructuredData && value && typeof value === 'object' && 'gps' in value && inputValue.trim() !== '' && (
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