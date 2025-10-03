import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
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
import { useTakeApplicationAction, useActiveOrganizationId } from '@/hooks/useJobsApi';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { JobApplication } from '@/lib/api-client';


delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

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
}

interface LatLng {
  lat: number;
  lng: number;
}

interface ApplicantMapViewProps {
  applicants: ApplicantLocation[];
  onApplicantClick?: (applicant: ApplicantLocation | null) => void;
  selectedApplicant?: ApplicantLocation | null;
  selectedCandidateDetails?: JobApplication | null; // Add detailed candidate data
  className?: string;
  mapCenter?: LatLng;
  zoom?: number;
  onTakeAction?: (applicantId: string, action: 'accept' | 'reject') => Promise<void>;
  loadingStates?: Record<string, 'accept' | 'reject' | null>;
}

// Create custom icons for different applicant statuses
const createCustomIcon = (_status: string) => {
  const getStatusColor = () => {
    // Use consistent blue color for all job applicant markers
    return '#3b82f6'; // blue for all statuses
  };

  const color = getStatusColor();
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.2s ease;
      " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
        1
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

// Custom cluster icon function
const createClusterIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  let size = 44;
  let color = '#3b82f6';
  
  if (count >= 20) {
    size = 52;
    color = '#1e3a8a';
  } else if (count >= 10) {
    size = 48;
    color = '#2563eb';
  } else if (count >= 5) {
    size = 46;
    color = '#1d4ed8';
  }
  
  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        border: 4px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: ${size > 48 ? '16px' : '14px'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        cursor: pointer;
        transition: transform 0.2s ease;
      " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
        ${count}
      </div>
    `,
    className: 'custom-cluster',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const ApplicantMapView: React.FC<ApplicantMapViewProps> = ({
  applicants = [],
  onApplicantClick,
  selectedApplicant,
  selectedCandidateDetails,
  className = "w-full h-full",
  mapCenter = { lat: 20.5937, lng: 78.9629 }, // Center of India
  zoom = 5,
  onTakeAction,
  loadingStates = {}
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const clusterGroupRef = useRef<any>(null);
  const currentLocationMarkerRef = useRef<L.Marker | null>(null);
  const takeApplicationAction = useTakeApplicationAction();
  const activeOrganizationId = useActiveOrganizationId();

  const handleAccept = async () => {
    if (selectedApplicant) {
      if (onTakeAction) {
        try {
          await onTakeAction(selectedApplicant.id, 'accept');
          toast.success('Applicant accepted successfully');
        } catch (error) {
          toast.error('Failed to accept applicant');
        }
      } else if (activeOrganizationId) {
        try {
          await takeApplicationAction.mutateAsync({
            organizationId: activeOrganizationId,
            actionData: {
              applicationId: selectedApplicant.id,
              action: 'accept',
              applicationStatus: 'Shortlisted',
            },
          });
          toast.success('Applicant accepted successfully');
        } catch (error) {
          toast.error('Failed to accept applicant');
        }
      }
    }
  };

  const handleReject = async () => {
    if (selectedApplicant) {
      if (onTakeAction) {
        try {
          await onTakeAction(selectedApplicant.id, 'reject');
          toast.success('Applicant rejected successfully');
        } catch (error) {
          toast.error('Failed to reject applicant');
        }
      } else if (activeOrganizationId) {
        try {
          await takeApplicationAction.mutateAsync({
            organizationId: activeOrganizationId,
            actionData: {
              applicationId: selectedApplicant.id,
              action: 'reject',
              applicationStatus: 'Rejected',
            },
          });
          toast.success('Applicant rejected successfully');
        } catch (error) {
          toast.error('Failed to reject applicant');
        }
      }
    }
  };
  
  // State for filtering and search
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  // const [currentZoom, setCurrentZoom] = useState(zoom); // Removed unused
  // const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null); // Removed unused

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
      const allUrls = value.every(item => typeof item === 'string');
      
      if (allUrls && value.length > 0) {
        return (
          <div className="space-y-1">
            {value.map((url, index) => {
              const isVerificationLink = isVerificationUrl(url);

              if (isVerificationLink) {
                return (
                  <a 
                    key={index}
                    href={url.startsWith('http') ? url : `https://${url}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-green-600 hover:text-green-800 underline break-all font-medium flex items-center gap-1 mb-1 text-xs"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {url}
                    <Maximize2 className="h-3 w-3 text-green-500" />
                  </a>
                );
              }

              // Don't render non-verification URLs as clickable links
              return (
                <span key={index} className="block mb-1 text-xs">
                  {url}
                </span>
              );
            })}
          </div>
        );
      }
      
      return value.join(', ');
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
      
      // Only make verification links clickable, not regular text
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
      
      // For all other values, just display as plain text (no hyperlinks)
      
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

  // Filter applicants based on search only
  const filteredApplicants = useMemo(() => {
    return applicants.filter(applicant => {
      const matchesSearch = !searchQuery || 
        applicant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        applicant.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        applicant.skills.some(skill => {
          // Handle both string and object skills
          if (typeof skill === 'string') {
            return skill.toLowerCase().includes(searchQuery.toLowerCase());
          } else if (skill && typeof skill === 'object' && 'name' in skill) {
            return skill.name.toLowerCase().includes(searchQuery.toLowerCase());
          }
          return false;
        });
      
      return matchesSearch;
    });
  }, [applicants, searchQuery]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create map instance
    const map = L.map(mapRef.current, {
      zoomControl: false,
      doubleClickZoom: false, // Disable double-click zoom on mobile
      dragging: true,
      touchZoom: true,
      scrollWheelZoom: true,
      boxZoom: false,
      keyboard: false,
      bounceAtZoomLimits: false
    }).setView([mapCenter.lat, mapCenter.lng], zoom);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Create marker cluster group
    const clusterGroup = (L as any).markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: function (zoom: number) {
        // Dynamic cluster radius based on zoom level for better clustering behavior
        if (zoom <= 10) return 80;
        if (zoom <= 12) return 60;
        if (zoom <= 13) return 40;
        return 20; // Very small clusters at high zoom levels
      },
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false, // Disable for better mobile experience
      zoomToBoundsOnClick: true,
      iconCreateFunction: createClusterIcon,
      animate: true,
      animateAddingMarkers: true,
      disableClusteringAtZoom: 15, // Disable clustering at zoom level 15 and above
      spiderfyDistanceMultiplier: 2, // Increase distance for better touch targets
      removeOutsideVisibleBounds: true, // Improve performance
      spiderfyDistanceSurplus: 25, // Extra distance for spiderfy
      polygonOptions: {
        fillColor: '#3b82f6',
        color: '#1e40af',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.5
      }
    });

    clusterGroupRef.current = clusterGroup;
    map.addLayer(clusterGroup);

    // Track zoom and bounds changes for better clustering behavior
    map.on('zoomend', () => {
      // Force refresh clusters when zooming to ensure proper behavior
      if (clusterGroupRef.current) {
        clusterGroupRef.current.refreshClusters();
      }
    });

    map.on('moveend', () => {
      // Refresh clusters after map movement for consistent display
      if (clusterGroupRef.current) {
        clusterGroupRef.current.refreshClusters();
      }
    });

    // Add touch-friendly interactions
    map.on('click', () => {
      // Close any open popups when clicking on the map
      map.closePopup();
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map center and zoom
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([mapCenter.lat, mapCenter.lng], zoom, { animate: true });
    }
  }, [mapCenter.lat, mapCenter.lng, zoom]);

  // Update applicant markers
  useEffect(() => {
    if (!mapInstanceRef.current || !clusterGroupRef.current) return;

    // Clear existing markers from cluster group
    clusterGroupRef.current.clearLayers();
    markersRef.current = [];

    // Add applicant location markers to cluster group
    filteredApplicants.forEach(applicant => {
      const marker = L.marker([applicant.lat, applicant.lng], {
        icon: createCustomIcon(applicant.status)
      });

      // Add popup
      const popupContent = `
        <div style="
          padding: 12px; 
          min-width: 200px; 
          max-width: 280px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        ">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
            <h3 style="font-weight: 600; font-size: 14px; margin: 0; color: #1f2937;">${applicant.name}</h3>
            <button style="
              background: none;
              border: none;
              color: #6b7280;
              cursor: pointer;
              font-size: 18px;
              padding: 0;
              line-height: 1;
              width: 20px;
              height: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              border-radius: 4px;
              transition: background-color 0.2s;
            " onmouseover="this.style.backgroundColor='#f3f4f6'" onmouseout="this.style.backgroundColor='transparent'" onclick="this.closest('.leaflet-popup').remove()">×</button>
          </div>
          <p style="font-size: 12px; color: #6b7280; margin-bottom: 8px; line-height: 1.4;">${applicant.location}</p>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 13px; font-weight: 500; color: #374151;">${applicant.age} years</span>
            <span style="font-size: 11px; padding: 3px 8px; border-radius: 12px; font-weight: 500; ${
              applicant.status === 'shortlisted' || applicant.status === 'closed' ? 'background-color: #dcfce7; color: #166534' :
              applicant.status === 'rejected' || applicant.status === 'archived' ? 'background-color: #fef2f2; color: #dc2626' :
              applicant.status === 'interview' ? 'background-color: #fff7ed; color: #c2410c' :
              applicant.status === 'hired' ? 'background-color: #dbeafe; color: #1e40af' :
              'background-color: #f3f4f6; color: #374151'
            };">
              ${applicant.status}
            </span>
          </div>
          <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px;">
            <div style="font-weight: 500; margin-bottom: 4px; color: #374151;">Skills:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 3px;">
              ${applicant.skills.slice(0, 3).map(skill => 
                `<span style="background: #f9fafb; padding: 2px 6px; border-radius: 8px; font-size: 10px; color: #374151; border: 1px solid #e5e7eb;">${typeof skill === 'string' ? skill : skill.name}</span>`
              ).join('')}
              ${applicant.skills.length > 3 ? `<span style="font-size: 10px; color: #9ca3af;">+${applicant.skills.length - 3} more</span>` : ''}
            </div>
          </div>
          <div style="font-size: 11px; color: #6b7280; line-height: 1.4;">
            <div style="margin-bottom: 2px;">📧 ${applicant.email}</div>
            <div style="margin-bottom: 2px;">📞 ${applicant.phone}</div>
            ${applicant.expectedSalary ? `<div>💰 Expected: ${applicant.expectedSalary}</div>` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent, {
        closeButton: false,
        autoClose: false,
        className: 'custom-popup',
        offset: [0, -35], // Position popup further above the marker to avoid covering it
        maxWidth: 300,
        minWidth: 200,
        maxHeight: 400,
        keepInView: true,
        autoPan: true,
        autoPanPadding: [50, 50]
      });

      // Add click handler
      marker.on('click', () => {
        onApplicantClick?.(applicant);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([applicant.lat, applicant.lng], 15, { // Zoom to level 15
            animate: true,
            duration: 1,
          });
        }
      });

      clusterGroupRef.current.addLayer(marker);
      markersRef.current.push(marker);
    });
  }, [filteredApplicants, onApplicantClick]);

  // Map control handlers
  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleFindLocation = () => {
    if (mapInstanceRef.current && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const latLng = { lat: latitude, lng: longitude };

          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo(latLng, 15);

            // Add or move the current location marker
            if (currentLocationMarkerRef.current) {
              currentLocationMarkerRef.current.setLatLng(latLng);
            } else {
              const customIcon = L.divIcon({
                className: 'current-location-marker',
                html: `<div style="background-color: #ff4b4b; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px #ff4b4b;"></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              });
              currentLocationMarkerRef.current = L.marker(latLng, { icon: customIcon }).addTo(mapInstanceRef.current);
            }
          }
        },
        (error) => {
          console.error("Error getting current location:", error);
          // Optionally, show an error message to the user
        }
      );
    }
  };

  

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Map Search and Filter Controls - Mobile Responsive */}
      <div className="absolute z-[800] top-4 left-4 right-4 md:w-80 md:right-auto map-search-card">
        <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
          {/* Mobile: Minimized header */}
          <div className="md:hidden">
            <CardHeader className="pb-2 px-3 pt-3 cursor-pointer" onClick={() => setIsSearchExpanded(!isSearchExpanded)}>
              <CardTitle className="text-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>Locations ({filteredApplicants.length})</span>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  {isSearchExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
              </CardTitle>
            </CardHeader>
            {isSearchExpanded && (
              <CardContent className="space-y-3 px-3 pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search applicants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-9"
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  Showing {filteredApplicants.length} of {applicants.length} applicants
                </div>
              </CardContent>
            )}
          </div>
          
          {/* Desktop: Full header */}
          <div className="hidden md:block">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Applicant Locations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search applicants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10 md:h-9"
                />
              </div>
              <div className="text-xs text-muted-foreground">
                Showing {filteredApplicants.length} of {applicants.length} applicants
              </div>
            </CardContent>
          </div>
        </Card>
      </div>

      {/* Map Controls - Mobile Responsive */}
      <div className="absolute z-[800] top-4 right-4 flex flex-col gap-2 map-controls">
        <Button
          variant="outline"
          size="icon"
          className="bg-white/95 backdrop-blur-sm shadow-lg border-0 h-10 w-10 md:h-9 md:w-9"
          onClick={handleZoomIn}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="bg-white/95 backdrop-blur-sm shadow-lg border-0 h-10 w-10 md:h-9 md:w-9"
          onClick={handleZoomOut}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="bg-white/95 backdrop-blur-sm shadow-lg border-0 h-10 w-10 md:h-9 md:w-9"
          onClick={handleFindLocation}
        >
          <Crosshair className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Selected Applicant Info - Mobile Responsive with Enhanced Details */}
      {selectedApplicant && (
        <div className="absolute z-[800] bottom-4 left-4 right-4 md:top-4 md:left-96 md:w-80 md:right-auto md:bottom-auto map-applicant-card">
          <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm max-h-[70vh] md:max-h-[80vh] overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Selected Applicant</span>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    selectedApplicant.status === 'shortlisted' || selectedApplicant.status === 'closed' ? 'default' :
                    selectedApplicant.status === 'rejected' || selectedApplicant.status === 'archived' ? 'destructive' :
                    selectedApplicant.status === 'interview' ? 'secondary' :
                    selectedApplicant.status === 'hired' ? 'default' :
                    'outline'
                  }>
                    {selectedApplicant.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onApplicantClick?.(null);
                    }}
                    className="h-8 w-8 p-0 hover:bg-muted"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 map-applicant-info overflow-y-auto max-h-[calc(70vh-100px)] md:max-h-[calc(80vh-100px)]">
              {/* Basic Info Header */}
              <div className="border-b pb-3">
                <h4 className="font-medium text-sm">{selectedApplicant.name}</h4>
                <p className="text-xs text-muted-foreground">{selectedApplicant.location}</p>
                <div className="text-xs space-y-1 mt-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Age: {selectedApplicant.age} years
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" />
                    {selectedApplicant.email}
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {selectedApplicant.phone}
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
              {!selectedCandidateDetails?.metadata?.metadata && (
                <div>
                  <div className="text-xs font-medium mb-1">Skills:</div>
                  <div className="flex flex-wrap gap-1 map-skills">
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

              {/* Action Buttons - Show for open/applied status */}
              {(selectedApplicant.status === 'open' || selectedApplicant.status === 'applied') && (
                <div className="flex gap-2 mt-4 pt-3 border-t map-action-buttons">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReject}
                    disabled={loadingStates[selectedApplicant.id] === 'reject' || loadingStates[selectedApplicant.id] === 'accept'}
                    className="flex-1 h-10 md:h-8"
                  >
                    {loadingStates[selectedApplicant.id] === 'reject' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-1" />
                        Reject
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAccept}
                    disabled={loadingStates[selectedApplicant.id] === 'accept' || loadingStates[selectedApplicant.id] === 'reject'}
                    className="flex-1 h-10 md:h-8"
                  >
                    {loadingStates[selectedApplicant.id] === 'accept' ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        Accepting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Accept
                      </>
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

export default ApplicantMapView;