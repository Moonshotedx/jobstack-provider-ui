import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Search, ZoomIn, ZoomOut, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Extend Leaflet types for marker cluster
declare module 'leaflet' {
  namespace L {
    function markerClusterGroup(options?: any): any;
  }
}

// Fix for default markers in Leaflet
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
  skills: string[];
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
  onApplicantClick?: (applicant: ApplicantLocation) => void;
  selectedApplicant?: ApplicantLocation | null;
  className?: string;
  mapCenter?: LatLng;
  zoom?: number;
}

// Create custom icons for different applicant statuses
const createCustomIcon = (status: string) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'shortlisted':
      case 'closed':
        return '#16a34a'; // green
      case 'rejected':
      case 'archived':
        return '#dc2626'; // red
      case 'interview':
        return '#ea580c'; // orange
      case 'hired':
        return '#2563eb'; // blue
      default:
        return '#6b7280'; // gray
    }
  };

  const color = getStatusColor(status);
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        color: white;
        font-size: 10px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
      ">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

// Custom cluster icon function
const createClusterIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  let size = 40;
  let color = '#3b82f6';
  
  if (count >= 20) {
    size = 50;
    color = '#1e3a8a';
  } else if (count >= 10) {
    size = 45;
    color = '#2563eb';
  } else if (count >= 5) {
    size = 42;
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
        font-size: ${size > 45 ? '14px' : '12px'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      ">
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
  className = "w-full h-full",
  mapCenter = { lat: 20.5937, lng: 78.9629 }, // Center of India
  zoom = 5
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const clusterGroupRef = useRef<any>(null);
  
  // State for filtering and search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  // const [currentZoom, setCurrentZoom] = useState(zoom); // Removed unused
  // const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null); // Removed unused

  // Filter applicants based on search and status
  const filteredApplicants = useMemo(() => {
    return applicants.filter(applicant => {
      const matchesSearch = !searchQuery || 
        applicant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        applicant.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        applicant.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || applicant.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [applicants, searchQuery, statusFilter]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Create map instance
    const map = L.map(mapRef.current, {
      zoomControl: false
    }).setView([mapCenter.lat, mapCenter.lng], zoom);

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Create marker cluster group
    const clusterGroup = (L as any).markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: true,
      zoomToBoundsOnClick: true,
      iconCreateFunction: createClusterIcon,
      animate: true,
      animateAddingMarkers: true,
    });

    clusterGroupRef.current = clusterGroup;
    map.addLayer(clusterGroup);

    // Track zoom and bounds changes
    map.on('zoomend', () => {
      // setCurrentZoom(map.getZoom()); // Removed unused
    });

    map.on('moveend', () => {
      // setMapBounds(map.getBounds()); // Removed unused
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
        <div style="padding: 8px; min-width: 200px; max-width: 280px;">
          <h3 style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${applicant.name}</h3>
          <p style="font-size: 12px; color: #666; margin-bottom: 8px;">${applicant.location}</p>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 14px; font-weight: 500;">${applicant.age} years</span>
            <span style="font-size: 12px; padding: 2px 8px; border-radius: 4px; background-color: ${
              applicant.status === 'shortlisted' || applicant.status === 'closed' ? '#dbeafe; color: #16a34a' :
              applicant.status === 'rejected' || applicant.status === 'archived' ? '#fef2f2; color: #dc2626' :
              applicant.status === 'interview' ? '#fff7ed; color: #ea580c' :
              applicant.status === 'hired' ? '#eff6ff; color: #2563eb' :
              '#f3f4f6; color: #6b7280'
            };">
              ${applicant.status}
            </span>
          </div>
          <div style="font-size: 12px; color: #666; margin-bottom: 8px;">
            <div style="font-weight: 500; margin-bottom: 4px;">Skills:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 2px;">
              ${applicant.skills.slice(0, 3).map(skill => 
                `<span style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 10px;">${skill}</span>`
              ).join('')}
              ${applicant.skills.length > 3 ? `<span style="font-size: 10px; color: #9ca3af;">+${applicant.skills.length - 3} more</span>` : ''}
            </div>
          </div>
          <div style="font-size: 11px; color: #666;">
            <div>📧 ${applicant.email}</div>
            <div>📞 ${applicant.phone}</div>
            ${applicant.expectedSalary ? `<div>💰 Expected: ${applicant.expectedSalary}</div>` : ''}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      // Add click handler
      marker.on('click', () => {
        onApplicantClick?.(applicant);
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

  const handleFitBounds = () => {
    if (mapInstanceRef.current && filteredApplicants.length > 0) {
      const bounds = L.latLngBounds(
        filteredApplicants.map(applicant => [applicant.lat, applicant.lng])
      );
      mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
    }
  };

  // Get status counts for legend
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredApplicants.forEach(applicant => {
      counts[applicant.status] = (counts[applicant.status] || 0) + 1;
    });
    return counts;
  }, [filteredApplicants]);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Map Search and Filter Controls */}
      <div className="absolute z-[1000] top-4 left-4 w-80">
        <Card className="shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Applicant Locations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search applicants..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status ({filteredApplicants.length})</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="shortlisted">Shortlisted</SelectItem>
                <SelectItem value="interview">Interview</SelectItem>
                <SelectItem value="hired">Hired</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            {/* Stats */}
            <div className="text-xs text-muted-foreground">
              Showing {filteredApplicants.length} of {applicants.length} applicants
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Controls */}
      <div className="absolute z-[1000] top-4 right-4 flex flex-col gap-2">
        <Button
          variant="outline"
          size="icon"
          className="bg-white shadow-lg"
          onClick={handleZoomIn}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="bg-white shadow-lg"
          onClick={handleZoomOut}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="bg-white shadow-lg"
          onClick={handleFitBounds}
          disabled={filteredApplicants.length === 0}
        >
          <Users className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Legend */}
      <div className="absolute z-[1000] bottom-4 left-4">
        <Card className="shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Status Legend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-600"></div>
              <span className="text-xs">Shortlisted ({statusCounts.shortlisted || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-600"></div>
              <span className="text-xs">Interview ({statusCounts.interview || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
              <span className="text-xs">Hired ({statusCounts.hired || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-600"></div>
              <span className="text-xs">Rejected ({statusCounts.rejected || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-600"></div>
              <span className="text-xs">Open ({statusCounts.open || 0})</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Applicant Info */}
      {selectedApplicant && (
        <div className="absolute z-[1000] top-4 left-96 w-80">
          <Card className="shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Selected Applicant</span>
                <Badge variant={
                  selectedApplicant.status === 'shortlisted' || selectedApplicant.status === 'closed' ? 'default' :
                  selectedApplicant.status === 'rejected' || selectedApplicant.status === 'archived' ? 'destructive' :
                  selectedApplicant.status === 'interview' ? 'secondary' :
                  selectedApplicant.status === 'hired' ? 'default' :
                  'outline'
                }>
                  {selectedApplicant.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <h4 className="font-medium text-sm">{selectedApplicant.name}</h4>
                <p className="text-xs text-muted-foreground">{selectedApplicant.location}</p>
              </div>
              <div className="text-xs space-y-1">
                <div>Age: {selectedApplicant.age} years</div>
                <div>Email: {selectedApplicant.email}</div>
                <div>Phone: {selectedApplicant.phone}</div>
                {selectedApplicant.expectedSalary && (
                  <div>Expected Salary: {selectedApplicant.expectedSalary}</div>
                )}
              </div>
              <div>
                <div className="text-xs font-medium mb-1">Skills:</div>
                <div className="flex flex-wrap gap-1">
                  {selectedApplicant.skills.slice(0, 5).map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {selectedApplicant.skills.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{selectedApplicant.skills.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ApplicantMapView; 