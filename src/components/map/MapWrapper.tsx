import React from 'react';
import { ApplicantMapView } from './index';
import ReliableMapWrapper from './ReliableMapWrapper';
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

interface MapWrapperProps {
  applicants: ApplicantLocation[];
  onApplicantClick?: (applicant: ApplicantLocation | null) => void;
  selectedApplicant?: ApplicantLocation | null;
  selectedCandidateDetails?: JobApplication | null; // Add detailed candidate data
  className?: string;
  mapCenter?: LatLng;
  zoom?: number;
  onTakeAction?: (applicantId: string, action: 'accept' | 'reject') => Promise<void>;
  loadingStates?: Record<string, 'accept' | 'reject' | null>;
  jobLocation?: JobLocation; // Add job location data
}

// Check if Google Maps should be used
const shouldUseGoogleMaps = (): boolean => {
  return import.meta.env.VITE_USE_GOOGLE_MAPS === 'true';
};


const MapWrapper: React.FC<MapWrapperProps> = (props) => {

  console.log('🗺️ MapWrapper rendering, useGoogleMaps:', shouldUseGoogleMaps());
  
  if (shouldUseGoogleMaps()) {
    // Use the new reliable implementation with @react-google-maps/api
    return (
      <ReliableMapWrapper 
        {...props}
        active={true} // Always active by default
        className={props.className || "w-full h-full"}
        jobLocation={props.jobLocation}
        selectedCandidateDetails={props.selectedCandidateDetails}
      />
    );
  } else {
    return <ApplicantMapView {...props} />;
  }
};

export default MapWrapper;
