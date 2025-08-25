import React from 'react';
import { ApplicantMapView, GoogleApplicantMapView } from './index';

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

interface MapWrapperProps {
  applicants: ApplicantLocation[];
  onApplicantClick?: (applicant: ApplicantLocation | null) => void;
  selectedApplicant?: ApplicantLocation | null;
  className?: string;
  mapCenter?: LatLng;
  zoom?: number;
  onTakeAction?: (applicantId: string, action: 'accept' | 'reject') => Promise<void>;
  loadingStates?: Record<string, 'accept' | 'reject' | null>;
}

// Check if Google Maps should be used
const shouldUseGoogleMaps = (): boolean => {
  return import.meta.env.VITE_USE_GOOGLE_MAPS === 'true';
};

const MapWrapper: React.FC<MapWrapperProps> = (props) => {
  if (shouldUseGoogleMaps()) {
    return <GoogleApplicantMapView {...props} />;
  } else {
    return <ApplicantMapView {...props} />;
  }
};

export default MapWrapper;
