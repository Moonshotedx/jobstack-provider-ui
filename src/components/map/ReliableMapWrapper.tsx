import React, { useEffect, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { 
  Search, 
  ZoomIn, 
  ZoomOut, 
  MapPin, 
  Crosshair, 
  X, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  ChevronUp, 
  ChevronDown,
  User,
  Briefcase,
  Heart,
  Mail,
  Phone,
  Calendar,
  Info,
  Star,
  Clock,
  DollarSign,
  Car,
  Home,
  Target,
  Zap,
  Building2,
  Award,
  Globe,
  MapPinIcon,
  FileVideo,
  Maximize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { JobApplication } from '@/lib/api-client';

interface ApplicantLocation {
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
  groupIndex?: number;
  groupSize?: number;
  originalLat?: number;
  originalLng?: number;
  globalIndex?: number; // Add globalIndex for consistent numbering
  groupMembers?: ApplicantLocation[]; // Add groupMembers for group info
}

interface LatLng {
  lat: number;
  lng: number;
}

interface JobLocation {
  title: string;
  location: string;
  lat: number;
  lng: number;
}

type ReliableMapWrapperProps = {
  applicants?: ApplicantLocation[];
  onApplicantClick?: (applicant: ApplicantLocation | null) => void;
  selectedApplicant?: ApplicantLocation | null;
  selectedCandidateDetails?: JobApplication | null; // Add detailed candidate data
  mapCenter?: LatLng;
  zoom?: number;
  className?: string;
  minHeight?: string;
  active?: boolean; // use this if inside a tab/collapsible
  onTakeAction?: (applicantId: string, action: 'accept' | 'reject') => Promise<void>;
  loadingStates?: Record<string, 'accept' | 'reject' | null>;
  jobLocation?: JobLocation; // Add job location data
};

const ReliableMapWrapper: React.FC<ReliableMapWrapperProps> = ({
  applicants = [],
  onApplicantClick,
  selectedApplicant,
  selectedCandidateDetails, // Currently not used in this implementation
  mapCenter = { lat: 20.5937, lng: 78.9629 }, // Center of India
  zoom = 5,
  className = "w-full h-[600px]",
  minHeight = "600px",
  active = true,
  onTakeAction,
  loadingStates = {},
  jobLocation
}) => {
  // Note: selectedCandidateDetails is prepared for future enhancement but not yet implemented
  console.log('ReliableMapWrapper selectedCandidateDetails:', selectedCandidateDetails ? 'Available' : 'Not available');

  // Helper functions for detailed candidate display (adapted from CandidateDetails)
  const isVerificationUrl = (url: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    
    const verificationIndicators = [
      'verify.',
      'verification',
      'credential',
      'qr',
      'scan',
      '/jobs/',
      'dhiway.net',
      'onest.dhiway.net',
      'verify.jobs.onest.dhiway.net',
      'verify.jobs'
    ];
    
    return verificationIndicators.some(indicator => 
      url.toLowerCase().includes(indicator.toLowerCase())
    );
  };

  const isMediaUrl = (url: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    if (isVerificationUrl(url)) return false;
    
    const mediaExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.avi', '.mov', '.wmv', '.mkv', '.webm'];
    const hasExtension = mediaExtensions.some(ext => url.toLowerCase().includes(ext));
    const isGCS = url.includes('storage.googleapis.com');
    const isMediaPattern = url.includes('/video/') || url.includes('/image/') || url.includes('/media/') || 
                          url.includes('/uploads/') || url.includes('/assets/');
    
    return hasExtension || isGCS || isMediaPattern;
  };

  const formatFieldName = (fieldName: string, value?: any) => {
    let formatted = fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
    
    if (fieldName === 'taskVideo') {
      formatted = 'Task Media';
    }
    
    if (fieldName === 'qrCodeScan') {
      formatted = 'Verification Links';
    }
    
    if (typeof value === 'string' && isVerificationUrl(value)) {
      formatted = 'Verification Link';
    } else if (Array.isArray(value) && value.length > 0 && 
               value.every(item => typeof item === 'string' && isVerificationUrl(item))) {
      formatted = 'Verification Links';
    }
    
    return formatted;
  };

  const formatFieldValue = (value: any, fieldName: string): React.ReactNode => {
    if (value === null || value === undefined) return 'N/A';
    
    if (Array.isArray(value)) {
      return (
        <div className="space-y-1">
          {value.map((item, index) => {
            if (typeof item === 'string') {
              const isVerificationLink = isVerificationUrl(item);
              
              if (isVerificationLink) {
                return (
                  <a 
                    key={index}
                    href={item.startsWith('http') ? item : `https://${item}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-800 underline break-all font-medium flex items-center gap-1 mb-1 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {item}
                    <Maximize2 className="h-3 w-3 text-green-500" />
                  </a>
                );
              }
              
              // Non-verification strings - display as plain text (no hyperlinks)
              return (
                <span key={index} className="block mb-1 text-xs">
                  {item}
                </span>
              );
            }
            
            // Non-string items
            return (
              <span key={index} className="block mb-1 text-xs">
                {String(item)}
              </span>
            );
          })}
        </div>
      );
    }
    
    if (typeof value === 'string') {
      const trimmedValue = value.trim();
      const isVerificationLink = isVerificationUrl(trimmedValue);
      
      if (trimmedValue.includes('verify.jobs') || trimmedValue.includes('dhiway.net')) {
        return (
          <a 
            href={trimmedValue.startsWith('http') ? trimmedValue : `https://${trimmedValue}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-green-600 hover:text-green-800 underline break-all font-medium inline-flex items-center gap-1 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            {trimmedValue}
            <Maximize2 className="h-3 w-3 text-green-500" />
          </a>
        );
      }
      
      if (isVerificationLink) {
        return (
          <a 
            href={trimmedValue.startsWith('http') ? trimmedValue : `https://${trimmedValue}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-green-600 hover:text-green-800 underline break-all font-medium inline-flex items-center gap-1 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            {trimmedValue}
            <Maximize2 className="h-3 w-3 text-green-500" />
          </a>
        );
      }
      
      // Add currency symbol for money fields
      if (fieldName.toLowerCase().includes('cost') || fieldName.toLowerCase().includes('salary') || 
          fieldName.toLowerCase().includes('preferred') || fieldName.toLowerCase().includes('pfesic')) {
        return `₹${trimmedValue}`;
      }
      
      if (fieldName.toLowerCase().includes('hours')) {
        return `${trimmedValue} hours`;
      }
      
      if (fieldName.toLowerCase().includes('age')) {
        return `${trimmedValue} years`;
      }
      
      if (fieldName.toLowerCase().includes('score')) {
        return `${trimmedValue}/10`;
      }
      
      return trimmedValue;
    }
    
    return String(value);
  };

  const getFieldIcon = (fieldName: string, value?: any) => {
    const iconMap: Record<string, React.ReactNode> = {
      name: <User className="h-3 w-3 text-muted-foreground" />,
      age: <Calendar className="h-3 w-3 text-muted-foreground" />,
      phone: <Phone className="h-3 w-3 text-muted-foreground" />,
      email: <Mail className="h-3 w-3 text-muted-foreground" />,
      location: <MapPin className="h-3 w-3 text-muted-foreground" />,
      currentLocation: <MapPinIcon className="h-3 w-3 text-muted-foreground" />,
      desiredLocation: <Globe className="h-3 w-3 text-muted-foreground" />,
      qualityScore: <Star className="h-3 w-3 text-muted-foreground" />,
      stitchingSpeed: <Zap className="h-3 w-3 text-muted-foreground" />,
      jukiMachineExperience: <Target className="h-3 w-3 text-muted-foreground" />,
      monthlyPFESIC: <DollarSign className="h-3 w-3 text-muted-foreground" />,
      readyToMigrate: <Car className="h-3 w-3 text-muted-foreground" />,
      stayPreferences: <Home className="h-3 w-3 text-muted-foreground" />,
      workHoursPerDay: <Clock className="h-3 w-3 text-muted-foreground" />,
      maxCostPerSharingBed: <DollarSign className="h-3 w-3 text-muted-foreground" />,
      monthlyOTExpectation: <Clock className="h-3 w-3 text-muted-foreground" />,
      monthlyInHandPreferred: <DollarSign className="h-3 w-3 text-muted-foreground" />,
      machinesOperated: <Briefcase className="h-3 w-3 text-muted-foreground" />,
      qualityScoreExplanation: <Info className="h-3 w-3 text-muted-foreground" />,
      taskVideo: <FileVideo className="h-3 w-3 text-muted-foreground" />,
      interestedRole: <Briefcase className="h-3 w-3 text-muted-foreground" />,
      interestedIndustry: <Building2 className="h-3 w-3 text-muted-foreground" />,
      qrCode: <Award className="h-3 w-3 text-green-600" />,
      qrCodeScan: <Award className="h-3 w-3 text-green-600" />,
    };
    
    if (fieldName.toLowerCase().includes('qr') || 
        fieldName.toLowerCase().includes('scan') ||
        fieldName.toLowerCase().includes('verification') ||
        fieldName.toLowerCase().includes('credential') ||
        fieldName.toLowerCase().includes('vc')) {
      return <Award className="h-3 w-3 text-green-600" />;
    }
    
    if (typeof value === 'string' && isVerificationUrl(value)) {
      return <Award className="h-3 w-3 text-green-600" />;
    }
    
    return iconMap[fieldName] || <Info className="h-3 w-3 text-muted-foreground" />;
  };

  const isEmptyValue = (value: any): boolean => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === 'object' && Object.keys(value).length === 0) return true;
    return false;
  };

  const renderDetailSection = (title: string, data: any, icon: React.ReactNode) => {
    if (!data || typeof data !== 'object') return null;

    const fields = Object.entries(data).filter(([key, value]) => {
      if (typeof value === 'string' && isMediaUrl(value)) return false;
      if (isEmptyValue(value)) return false;
      if (key === 'isNameVerified' || key === 'isAgeVerified' || key === 'isPhoneVerified' || key === 'isLocationVerified') return false;
      if (key.toLowerCase().includes('verified')) return false;
      // Skip locationData field (it's an object that causes [object] display)
      if (key === 'locationData') return false;
      return true;
    });

    if (fields.length === 0) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 border-b pb-1">
          {icon}
          <span className="font-medium text-sm">{title}</span>
        </div>
        <div className="space-y-2">
          {fields.map(([key, value]) => (
            <div key={key} className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                {getFieldIcon(key, value)}
                <span className="font-medium text-xs">{formatFieldName(key, value)}:</span>
              </div>
              <div className="text-xs text-muted-foreground ml-4">
                {formatFieldValue(value, key)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"]
  });

  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarker, setSelectedMarker] = useState<ApplicantLocation | null>(null);
  const [selectedJobLocation, setSelectedJobLocation] = useState<JobLocation | null>(null);
  const [currentZoom, setCurrentZoom] = useState(zoom);
  const [defaultMapCenter, setDefaultMapCenter] = useState(mapCenter);
  const [defaultMapZoom, setDefaultMapZoom] = useState(zoom);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  // Update default map center when props change (for job location)
  useEffect(() => {
    setDefaultMapCenter(mapCenter);
    setDefaultMapZoom(zoom);
  }, [mapCenter, zoom]);


  // 🔄 Fix for when map is inside hidden tab/collapsible
  useEffect(() => {
    if (active && mapRef && window.google) {
      window.google.maps.event.trigger(mapRef, "resize");
      mapRef.setCenter(mapCenter);
    }
  }, [active, mapRef, mapCenter]);

  const containerStyle = {
    width: "100%",
    height: "100%",
    minHeight,
  };

  const mapOptions = {
    disableDefaultUI: false,
    zoomControl: false, // We'll use custom controls
    mapTypeControl: false,
    scaleControl: true,
    streetViewControl: false,
    rotateControl: false,
    fullscreenControl: false,
    restriction: {
      latLngBounds: {
        north: 37.09024,
        south: 8.0883064,
        west: 68.1766451,
        east: 97.4025619,
      },
      strictBounds: false,
    },
  };

  // Create marker icon with optional count indicator - CIRCLE STYLE (original)
  const createMarkerIcon = useCallback((_status: string, count: number = 1, isGroupCenter: boolean = false) => {
    const getStatusColor = () => {
      // Use consistent blue color for all job applicant markers
      return '#3b82f6';
    };

    const color = getStatusColor();
    const size = count > 1 && isGroupCenter ? 36 : 28; // Larger for group centers
    const radius = count > 1 && isGroupCenter ? 14 : 10;
    const fontSize = count > 1 && isGroupCenter ? 12 : 10;
    const textY = count > 1 && isGroupCenter ? size/2 + 4 : 18;
    
    // Show count for group centers, always '1' for individual markers
    let displayText: string;
    if (count > 1 && isGroupCenter) {
      displayText = count.toString();
    } else {
      displayText = '1'; // Always show '1' for individual markers
    }
    
    const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="${color}" stroke="white" stroke-width="3"/>
      <text x="${size/2}" y="${textY}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" text-anchor="middle" fill="white">${displayText}</text>
    </svg>`;

    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: new window.google.maps.Size(size, size),
      anchor: new window.google.maps.Point(size/2, size/2),
    };
  }, []);

    // Create job location icon - PIN STYLE for job postings
  const createJobLocationIcon = useCallback(() => {
    const color = '#f59e0b'; // Amber color for job locations
    const pinWidth = 36;
    const pinHeight = 44;
    const circleRadius = 16;
    
    const svg = `<svg width="${pinWidth}" height="${pinHeight}" viewBox="0 0 ${pinWidth} ${pinHeight}" xmlns="http://www.w3.org/2000/svg">
      <!-- Pin shape -->
      <path d="M${pinWidth/2} ${pinHeight} Q${pinWidth/2} ${pinHeight-10} ${pinWidth/2} ${circleRadius+4} A${circleRadius} ${circleRadius} 0 1 1 ${pinWidth/2} ${circleRadius+4} Z" fill="${color}" stroke="white" stroke-width="3"/>
      <!-- Circle at top -->
      <circle cx="${pinWidth/2}" cy="${circleRadius+4}" r="${circleRadius}" fill="${color}" stroke="white" stroke-width="3"/>
      <!-- Text -->
      <text x="${pinWidth/2}" y="${circleRadius+4+3}" font-family="Arial, sans-serif" font-size="10" font-weight="bold" text-anchor="middle" fill="white">JOB</text>
    </svg>`;

    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: new google.maps.Size(pinWidth, pinHeight),
      anchor: new google.maps.Point(pinWidth / 2, pinHeight), // Anchor at bottom point
      zIndex: 500 // Lower z-index than before, but still above regular markers
    };
  }, []);

  // Filter applicants
  const filteredApplicants = React.useMemo(() => {
    return applicants.filter(applicant => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        applicant.name.toLowerCase().includes(query) ||
        applicant.location.toLowerCase().includes(query) ||
        applicant.skills.some(skill => 
          (typeof skill === 'string' ? skill : skill.name).toLowerCase().includes(query)
        )
      );
    });
  }, [applicants, searchQuery]);

  // Handle search functionality
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      // Return to default view when search is cleared
      setIsSearchActive(false);
      if (mapRef) {
        mapRef.panTo(defaultMapCenter);
        mapRef.setZoom(defaultMapZoom);
      }
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    
    // Find matching applicant
    const matchingApplicant = filteredApplicants.find(applicant =>
      applicant.name.toLowerCase().includes(query) ||
      applicant.location.toLowerCase().includes(query) ||
      applicant.email.toLowerCase().includes(query) ||
      applicant.skills.some(skill => {
        const skillName = typeof skill === 'string' ? skill : skill.name;
        return skillName.toLowerCase().includes(query);
      })
    );

    if (matchingApplicant && mapRef) {
      setIsSearchActive(true);
      // Navigate to the matching applicant
      mapRef.panTo({ lat: matchingApplicant.lat, lng: matchingApplicant.lng });
      mapRef.setZoom(15); // Close zoom for individual applicant
      setSelectedMarker(matchingApplicant);
      
      // Clear search query after navigation
      setTimeout(() => {
        setSearchQuery('');
      }, 1000);
    } else {
      // Try geocoding the search query as a location
      const tryGeocodeSearch = async () => {
        try {
          const { geocodeLocation } = await import('@/lib/map-utils');
          const coordinates = await geocodeLocation(query);
          if (coordinates && mapRef) {
            setIsSearchActive(true);
            mapRef.panTo(coordinates);
            mapRef.setZoom(12); // City-level zoom for location search
            
            // Clear search query after navigation
            setTimeout(() => {
              setSearchQuery('');
            }, 1000);
          }
        } catch (error) {
          console.warn('Could not geocode search query:', query);
        }
      };
      
      tryGeocodeSearch();
    }
  }, [searchQuery, filteredApplicants, mapRef, defaultMapCenter, defaultMapZoom]);

  // Handle search input changes
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    
    // If search is cleared, return to default view
    if (!value.trim() && isSearchActive) {
      setIsSearchActive(false);
      if (mapRef) {
        mapRef.panTo(defaultMapCenter);
        mapRef.setZoom(defaultMapZoom);
      }
    }
  }, [isSearchActive, mapRef, defaultMapCenter, defaultMapZoom]);

  // Handle Enter key press
  const handleSearchKeyPress = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSearch();
    }
  }, [handleSearch]);

  // Group applicants by location and create offset positions to avoid overlapping markers
  const applicantsWithOffsets = React.useMemo(() => {
    const locationGroups = new Map<string, ApplicantLocation[]>();
    
    // Calculate clustering precision based on zoom level
    // Lower zoom = less precision = more clustering
    const getClusteringPrecision = (zoomLevel: number) => {
      if (zoomLevel <= 5) return 0; // Country/continent level - cluster all nearby cities
      if (zoomLevel <= 7) return 1; // State/region level - cluster nearby districts  
      if (zoomLevel <= 10) return 2; // City level - cluster nearby areas
      return 3; // Street level - cluster only very close locations (≈100m)
    };

    const precision = getClusteringPrecision(currentZoom);

    // Group applicants by their coordinates with zoom-based clustering tolerance
    filteredApplicants.forEach((applicant, globalIndex) => {
      // Use dynamic precision for clustering based on zoom level
      const locationKey = `${applicant.lat.toFixed(precision)},${applicant.lng.toFixed(precision)}`;
      if (!locationGroups.has(locationKey)) {
        locationGroups.set(locationKey, []);
      }

      locationGroups.get(locationKey)!.push({ ...applicant, globalIndex: globalIndex + 1 });
    });
    
    // Create offset positions for applicants at the same location
    const offsetApplicants: (ApplicantLocation & { originalLat: number; originalLng: number; groupSize: number; groupIndex: number; globalIndex: number })[] = [];
    
    locationGroups.forEach((group, _) => {
      if (group.length === 1) {
        // Single applicant, show individual marker
        offsetApplicants.push({
          ...group[0],
          originalLat: group[0].lat,
          originalLng: group[0].lng,
          groupSize: 1,
          groupIndex: 0,
          globalIndex: (group[0] as any).globalIndex
        });
      } else {
        // Multiple applicants at the same location, show ONLY ONE clustered marker
        // Use the centroid of all locations in the group for better representation
        const centerLat = group.reduce((sum, app) => sum + app.lat, 0) / group.length;
        const centerLng = group.reduce((sum, app) => sum + app.lng, 0) / group.length;
        
        offsetApplicants.push({
          ...group[0], // Use first applicant as group representative for other data
          lat: centerLat, // Use calculated center for marker position
          lng: centerLng,
          originalLat: centerLat,
          originalLng: centerLng,
          groupSize: group.length,
          groupIndex: 0, // This will be treated as group center
          globalIndex: (group[0] as any).globalIndex,
          // Store all group members for info window
          groupMembers: group
        });
      }
    });
    
    return offsetApplicants;
  }, [filteredApplicants, currentZoom]);

  // Action handlers
  const handleAccept = async (applicant: ApplicantLocation) => {
    if (!onTakeAction) return;
    
    try {
      await onTakeAction(applicant.id, 'accept');
      toast.success('Applicant accepted successfully');
    } catch (error) {
      toast.error('Failed to accept applicant');
    }
  };

  const handleReject = async (applicant: ApplicantLocation) => {
    if (!onTakeAction) return;
    
    try {
      await onTakeAction(applicant.id, 'reject');
      toast.success('Applicant rejected successfully');
    } catch (error) {
      toast.error('Failed to reject applicant');
    }
  };

  // Map controls
  const handleZoomIn = () => {
    if (mapRef) {
      const currentZoom = mapRef.getZoom() || 5;
      mapRef.setZoom(currentZoom + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapRef) {
      const currentZoom = mapRef.getZoom() || 5;
      mapRef.setZoom(Math.max(currentZoom - 1, 1));
    }
  };

  const handleFindLocation = () => {
    if (mapRef && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const latLng = { lat: latitude, lng: longitude };
          mapRef.panTo(latLng);
          mapRef.setZoom(15);
        },
        () => {
          toast.error("Could not get your current location");
        }
      );
    }
  };

  // Handle load error
  if (loadError) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full h-full flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg">
          <div className="text-center p-8 max-w-md">
            <div className="text-red-600 mb-4 text-4xl">⚠️</div>
            <div className="text-gray-700 text-sm mb-4 font-medium">Google Maps Load Error</div>
            <div className="text-gray-600 text-xs mb-4 bg-red-50 p-3 rounded border text-left">
              {loadError.message}
            </div>
            <div className="text-gray-500 text-xs space-y-1 mb-4">
              <div>Please check:</div>
              <div>• Google Maps API key configuration</div>
              <div>• API key permissions and restrictions</div>
              <div>• Network connectivity</div>
            </div>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Reload Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (!isLoaded) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full h-full flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
            <div className="text-gray-600 text-sm">Loading Google Maps...</div>
            <div className="text-gray-500 text-xs mt-2">Please wait</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={mapCenter}
        zoom={zoom}
        onLoad={(map) => {
          console.log('✅ Google Map loaded successfully');
          setMapRef(map);
          setCurrentZoom(map.getZoom() || zoom);
          
          // Listen for zoom changes to update clustering
          map.addListener('zoom_changed', () => {
            const newZoom = map.getZoom() || zoom;
            setCurrentZoom(newZoom);
          });
        }}
        options={mapOptions}
      >
        {/* Render Markers with offset positions */}
        {applicantsWithOffsets.map((applicant) => {
          const isGroupCenter = applicant.groupIndex === 0 && applicant.groupSize! > 1;
          const title = applicant.groupSize! > 1 && isGroupCenter 
            ? `${applicant.groupSize} applicants at this location` 
            : `Applicant #${applicant.globalIndex}: ${applicant.name}`;
          
          return (
            <Marker
              key={applicant.id}
              position={{ lat: applicant.lat, lng: applicant.lng }}
              title={title}
              icon={createMarkerIcon(
                applicant.status, 
                applicant.groupSize!, 

                isGroupCenter

              )}
              onClick={() => {
                setSelectedMarker(applicant);
                // Don't trigger onApplicantClick here - only show info window
                if (mapRef) {
                  // Pan to original location for group centers, or offset location for individuals
                  const panLat = isGroupCenter ? applicant.originalLat! : applicant.lat;
                  const panLng = isGroupCenter ? applicant.originalLng! : applicant.lng;
                  mapRef.panTo({ lat: panLat, lng: panLng });
                  mapRef.setZoom(15);
                }
              }}
            />
          );
        })}

        {/* Job Location Marker */}
        {jobLocation && (
          <Marker
            key="job-location"
            position={{ 
              lat: jobLocation.lat + 0.0001, // Slight offset to avoid perfect overlap
              lng: jobLocation.lng + 0.0001 
            }}
            title={`Job Location: ${jobLocation.title} - ${jobLocation.location}`}
            icon={createJobLocationIcon()}
            zIndex={500}
            onClick={() => {
              setSelectedJobLocation(jobLocation);
              setSelectedMarker(null); // Close any open applicant info window
              if (mapRef) {
                mapRef.panTo({ lat: jobLocation.lat, lng: jobLocation.lng });
                mapRef.setZoom(12);
              }
            }}
          />
        )}
        {/* Info Window for Job Location - Mobile Responsive */}
        {selectedJobLocation && (
          <InfoWindow
            position={{ lat: selectedJobLocation.lat, lng: selectedJobLocation.lng }}
            onCloseClick={() => {
              setSelectedJobLocation(null);
            }}
            options={{
              maxWidth: 300,
              pixelOffset: new google.maps.Size(0, -10)
            }}
          >
            <div className="p-3 min-w-[200px] max-w-[280px] sm:max-w-[300px] font-sans">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-sm sm:text-base m-0 text-gray-800 pr-2 leading-tight">
                  {selectedJobLocation.title}
                </h3>
                <span className="text-xs px-2 py-1 rounded-full font-medium bg-amber-100 text-amber-800 whitespace-nowrap">
                  Job Location
                </span>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 mb-2 flex items-center">
                <span className="mr-1.5">📍</span>
                <span className="break-words">{selectedJobLocation.location}</span>
              </div>
              <div className="text-xs text-gray-600 italic">
                💼 This is where the job is located. Candidates nearby may be ideal for this position.
              </div>
            </div>
          </InfoWindow>
        )}
        {/* Info Window for Selected Marker - Mobile Responsive */}
        {selectedMarker && (() => {
          const isGroupCenter = selectedMarker.groupSize! > 1;
          const sameLocationApplicants = isGroupCenter && selectedMarker.groupMembers 
            ? selectedMarker.groupMembers
            : [selectedMarker];
          
          return (
            <InfoWindow
              position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
              onCloseClick={() => {
                setSelectedMarker(null);
              }}
              options={{
                maxWidth: 320,
                pixelOffset: new google.maps.Size(0, -10)
              }}
            >
              <div className="p-3 min-w-[200px] max-w-[300px] sm:max-w-[320px] font-sans">
                {isGroupCenter ? (
                  // Group info window - Mobile Responsive
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-sm m-0 text-gray-800 pr-2">
                        {selectedMarker.groupSize} Applicants
                      </h3>
                      <span className="text-xs px-2 py-1 rounded-full font-medium bg-blue-100 text-blue-800">
                        Group
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-3 break-words">{selectedMarker.location}</p>
                    <div className="max-h-[180px] overflow-y-auto">
                      {sameLocationApplicants.map((applicant, index) => (
                        <div 
                          key={applicant.id} 
                          className={`mb-2 p-2 rounded cursor-pointer hover:bg-gray-50 transition-colors ${
                            index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                          }`}
                          onClick={() => {
                            onApplicantClick?.(applicant);
                          }}
                        >
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-xs text-gray-800 truncate pr-2">
                              {applicant.name}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-lg text-white whitespace-nowrap ${
                              {
                                'shortlisted': 'bg-green-500', 'closed': 'bg-green-500',
                                'rejected': 'bg-red-500', 'archived': 'bg-red-500',
                                'interview': 'bg-orange-500',
                                'hired': 'bg-blue-500'
                              }[applicant.status.toLowerCase()] || 'bg-gray-500'
                            }`}>
                              {applicant.status}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600">
                            Age: {applicant.age} • {applicant.email.length > 20 ? 
                              applicant.email.substring(0, 20) + '...' : 
                              applicant.email
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-gray-600 mt-2 italic">
                      💡 Tap any applicant to view details
                    </div>
                  </>
                ) : (
                  // Individual applicant info window - Mobile Responsive
                  <div 
                    className="cursor-pointer" 
                    onClick={() => {
                      onApplicantClick?.(selectedMarker);
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-sm m-0 text-gray-800 pr-2 leading-tight">
                        {selectedMarker.name}
                      </h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        {
                          'shortlisted': 'bg-green-100 text-green-800', 'closed': 'bg-green-100 text-green-800',
                          'rejected': 'bg-red-100 text-red-800', 'archived': 'bg-red-100 text-red-800',
                          'interview': 'bg-orange-100 text-orange-800',
                          'hired': 'bg-blue-100 text-blue-800'
                        }[selectedMarker.status.toLowerCase()] || 'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedMarker.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-2 break-words">{selectedMarker.location}</p>
                    <div className="text-xs text-gray-700">Age: {selectedMarker.age} years</div>
                    <div className="text-xs text-gray-600 mt-2 space-y-1">
                      <div className="break-all">📧 {selectedMarker.email}</div>
                      <div>📞 {selectedMarker.phone}</div>
                    </div>
                    {selectedMarker.groupSize! > 1 && (
                      <div className="text-xs text-gray-600 mt-2 italic">
                        💡 Part of a group of {selectedMarker.groupSize} applicants
                      </div>
                    )}
                    <div className="text-xs text-gray-600 mt-2 italic">
                      💡 Tap here to view full details
                    </div>
                  </div>
                )}
              </div>
            </InfoWindow>
          );
        })()}
      </GoogleMap>

      {/* Search Controls - Mobile Responsive */}
      <div className="absolute z-[800] top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-auto sm:w-80">
        <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          {/* Mobile: Minimized header - always visible */}
          <div className="sm:hidden">
            <CardHeader className="pb-2 px-3 pt-3 cursor-pointer" onClick={() => setIsSearchExpanded(!isSearchExpanded)}>
              <CardTitle className="text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  <span>Locations ({filteredApplicants.length})</span>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  {isSearchExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              </CardTitle>
            </CardHeader>
            {isSearchExpanded && (
              <CardContent className="space-y-2 px-3 pb-3">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3" />
                  <Input
                    placeholder="Search applicants..."
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                    className="pl-8 h-8 text-sm"
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  Showing {filteredApplicants.length} of {applicants.length}
                </div>
              </CardContent>
            )}
          </div>
          
          {/* Desktop: Full header - always expanded */}
          <div className="hidden sm:block">
            <CardHeader className="pb-2 sm:pb-3 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm flex items-center gap-2">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden xs:inline">Applicant Locations</span>
                <span className="xs:hidden">Locations</span>
                <span className="text-xs">({filteredApplicants.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3 px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="relative">
                <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-3 w-3 sm:h-4 sm:w-4" />
                <Input
                  placeholder="Search applicants..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onKeyPress={handleSearchKeyPress}
                  className="pl-8 sm:pl-10 h-8 sm:h-9 text-sm"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Showing {filteredApplicants.length} of {applicants.length}
              </div>
            </CardContent>
          </div>
        </Card>
      </div>

      {/* Map Controls - Mobile Responsive */}
      <div className="absolute z-[800] top-2 right-2 sm:top-4 sm:right-4 flex flex-col gap-1 sm:gap-2">
        <Button 
          variant="outline" 
          size="icon" 
          className="bg-white/95 backdrop-blur-sm shadow-lg border-0 h-8 w-8 sm:h-9 sm:w-9 touch-manipulation" 
          onClick={handleZoomIn}
        >
          <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className="bg-white/95 backdrop-blur-sm shadow-lg border-0 h-8 w-8 sm:h-9 sm:w-9 touch-manipulation" 
          onClick={handleZoomOut}
        >
          <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          className="bg-white/95 backdrop-blur-sm shadow-lg border-0 h-8 w-8 sm:h-9 sm:w-9 touch-manipulation" 
          onClick={handleFindLocation}
        >
          <Crosshair className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>
      
      {/* Selected Applicant Panel - Mobile Responsive */}
      {selectedApplicant && (
        <div className="absolute z-[800] bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 md:top-4 md:left-96 md:w-80 md:right-auto md:bottom-auto">
          <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm max-h-[70vh] md:max-h-[80vh] overflow-hidden">
            <CardHeader className="pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm flex items-center justify-between">
                <span>Selected Applicant</span>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Badge variant="outline" className="text-xs px-1 sm:px-2">{selectedApplicant.status}</Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onApplicantClick?.(null)} 
                    className="h-6 w-6 sm:h-8 sm:w-8 p-0 touch-manipulation"
                  >
                    <X className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 sm:space-y-3 px-3 sm:px-6 pb-3 sm:pb-6 overflow-y-auto max-h-[calc(70vh-100px)] md:max-h-[calc(80vh-100px)]">
              {/* Basic Info Header */}
              <div className="border-b pb-3">
                <h4 className="font-medium text-xs sm:text-sm truncate">{selectedApplicant.name}</h4>
                <p className="text-xs text-muted-foreground truncate">{selectedApplicant.location}</p>
                <div className="text-xs space-y-1 mt-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Age: {selectedApplicant.age} years
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{selectedApplicant.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    <span className="truncate">{selectedApplicant.phone}</span>
                  </div>
                  {selectedApplicant.expectedSalary && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Expected: {selectedApplicant.expectedSalary}
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Information from selectedCandidateDetails */}
              {selectedCandidateDetails?.metadata?.metadata && (
                <div className="space-y-4">
                  {/* Who I Am Section */}
                  {selectedCandidateDetails.metadata.metadata.whoIAm && 
                   renderDetailSection('Who I Am', selectedCandidateDetails.metadata.metadata.whoIAm, <User className="h-4 w-4" />)}

                  {/* What I Have Section */}
                  {selectedCandidateDetails.metadata.metadata.whatIHave && 
                   renderDetailSection('What I Have', selectedCandidateDetails.metadata.metadata.whatIHave, <Briefcase className="h-4 w-4" />)}

                  {/* What I Want Section */}
                  {selectedCandidateDetails.metadata.metadata.whatIWant && 
                   renderDetailSection('What I Want', selectedCandidateDetails.metadata.metadata.whatIWant, <Heart className="h-4 w-4" />)}
                </div>
              )}

              {/* Fallback to basic skills display if no detailed data */}
              {!selectedCandidateDetails?.metadata?.metadata && selectedApplicant.skills && (
                <div>
                  <div className="text-xs font-medium mb-1">Skills:</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedApplicant.skills.slice(0, 5).map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {typeof skill === 'string' ? skill : skill.name}
                      </Badge>
                    ))}
                    {selectedApplicant.skills.length > 5 && (
                      <Badge variant="outline" className="text-xs">
                        +{selectedApplicant.skills.length - 5} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}
              
              {onTakeAction && (selectedApplicant.status === 'open' || selectedApplicant.status === 'applied') && (
                <div className="flex gap-2 mt-3 sm:mt-4 pt-3 border-t">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleReject(selectedApplicant)} 
                    disabled={!!loadingStates[selectedApplicant.id]} 
                    className="flex-1 h-8 sm:h-9 text-xs sm:text-sm touch-manipulation"
                  >
                    {loadingStates[selectedApplicant.id] === 'reject' ? (
                      <><Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 animate-spin" />Rejecting...</>
                    ) : (
                      <><XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />Reject</>
                    )}
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={() => handleAccept(selectedApplicant)} 
                    disabled={!!loadingStates[selectedApplicant.id]} 
                    className="flex-1 h-8 sm:h-9 text-xs sm:text-sm touch-manipulation"
                  >
                    {loadingStates[selectedApplicant.id] === 'accept' ? (
                      <><Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 animate-spin" />Accepting...</>
                    ) : (
                      <><CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />Accept</>
                    )}
                  </Button>
                </div>
              )}
              
              {/* Show status for other statuses */}
              {(selectedApplicant.status === 'shortlisted' || selectedApplicant.status === 'rejected') && (
                <div className="flex items-center gap-2 mt-4 p-2 bg-muted rounded">
                  {selectedApplicant.status === 'shortlisted' ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-600">Shortlisted</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-600">Rejected</span>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReliableMapWrapper;
