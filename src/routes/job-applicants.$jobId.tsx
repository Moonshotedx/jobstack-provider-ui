import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  MapPin,
  Users,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle,
  XCircle,
  Map
} from 'lucide-react';
import ExportButton from '@/components/ExportButton';
import type { JobApplicant } from '@/types/jobPost';
import CandidateDetails from '@/components/CandidateDetails';
import { MapWrapper } from '@/components/map';
import { useTranslation } from 'react-i18next';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import React from 'react';
import Header from '@/components/Header';
import { useGetJobApplications, useActiveOrganizationId, useGetJobs, useTakeApplicationAction } from '@/hooks/useJobsApi';
import type { JobApplication } from '@/lib/api-client';
import { toast } from 'sonner';
import { convertApplicantsToMapLocations, calculateMapCenter, testGeocoding, geocodeLocation, type ApplicantLocation } from '@/lib/map-utils';

export const Route = createFileRoute('/job-applicants/$jobId')({
  component: JobApplicantsPage,
});

const PAGE_SIZE = 20;
const EMPTY_APPLICATIONS: JobApplication[] = [];
const EMPTY_APPLICANTS: JobApplicant[] = [];
const EMPTY_MAP_LOCATIONS: ApplicantLocation[] = [];

function JobApplicantsPage() {
  // All hooks at the top
  const { jobId } = Route.useParams();
  const { t } = useTranslation('candidates');
  const activeOrganizationId = useActiveOrganizationId();

  // Pagination & server-side filter state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Debounced search — wait 400 ms before sending to API
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // reset to page 1 on new search
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchQuery]);

  // Reset to page 1 when status filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const { 
    data: queryData,
    isLoading, 
    isFetching,
    error, 
    refetch 
  } = useGetJobApplications(activeOrganizationId || '', jobId, {
    page: currentPage,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const applications = queryData?.applications ?? EMPTY_APPLICATIONS;
  const pagination = queryData?.pagination ?? { page: currentPage, limit: PAGE_SIZE, totalCount: 0 };
  const totalPages = Math.max(1, Math.ceil(pagination.totalCount / PAGE_SIZE));

  const { data: jobs } = useGetJobs(activeOrganizationId || '');
  const jobDetails = jobs?.find(job => job.id === jobId);
  const takeActionMutation = useTakeApplicationAction();
  const [loadingStates, setLoadingStates] = useState<Record<string, 'accept' | 'reject' | null>>({});
  const applicants: JobApplicant[] = React.useMemo(() => {
    if (!applications) return EMPTY_APPLICANTS;
    
    console.log('🔄 Transforming applications:', applications.map(app => ({
      appId: app.id,
      metadataId: app.metadata?.id,
      name: app.metadata?.name || app.userName
    })));
    
    return applications
      .filter((app: JobApplication) => app && app.metadata) // Filter out any undefined applications
      .map((app: JobApplication) => {
        // Add null checks for metadata
        if (!app.metadata) {
          console.warn('⚠️ Application missing metadata:', app);
          return null;
        }
        
        // Extract nested metadata if available
        const nestedMetadata = app.metadata.metadata;
        
        // Debug location data
        console.log(`📍 Location data for ${app.metadata.name || app.userName}:`, {
          structuredLocation: app.location,
          whoIAmLocation: nestedMetadata?.whoIAm?.location,
          whoIAmLocationData: nestedMetadata?.whoIAm?.locationData,
          currentLocation: nestedMetadata?.currentLocation,
          extractedLocation: (() => {
            // Use the same location data that's displayed in the table view
            // This comes from metadata.whoIAm.location and locationData
            if (app.metadata?.metadata?.whoIAm?.location) {
              return app.metadata.metadata.whoIAm.location;
            }
            if (app.metadata?.metadata?.whoIAm?.locationData) {
              // If locationData is an object, extract the address
              if (typeof app.metadata.metadata.whoIAm.locationData === 'object') {
                const locationData = app.metadata.metadata.whoIAm.locationData;
                if (locationData.address) {
                  return locationData.address;
                }
                if (locationData.city && locationData.state) {
                  return `${locationData.city}, ${locationData.state}`;
                }
                if (locationData.city) {
                  return locationData.city;
                }
                if (locationData.state) {
                  return locationData.state;
                }
              }
              // If it's a string, use it directly
              if (typeof app.metadata.metadata.whoIAm.locationData === 'string') {
                return app.metadata.metadata.whoIAm.locationData;
              }
            }
            if (app.metadata?.metadata?.currentLocation) {
              return app.metadata.metadata.currentLocation;
            }
            // Fallback to structured location data if whoIAm data is not available
            if (app.location?.city?.name && app.location?.state?.name) {
              return `${app.location.city.name}, ${app.location.state.name}`;
            }
            if (app.location?.address) {
              return app.location.address;
            }
            if (app.location?.city?.name) {
              return app.location.city.name;
            }
            if (app.location?.state?.name) {
              return app.location.state.name;
            }
            return null;
          })(),
        });
        
        return {
          id: app.id, // Use the unique application ID as the primary identifier
          name: app.metadata.name || app.userName || 'Unknown Candidate',
          email: app.contact?.email || '',
          phone: app.contact?.phone || '',
          location: (() => {
            // Use the same location data that's displayed in the table view
            // This comes from metadata.whoIAm.location and locationData
            if (app.metadata?.metadata?.whoIAm?.location) {
              return app.metadata.metadata.whoIAm.location;
            }
            if (app.metadata?.metadata?.whoIAm?.locationData) {
              // If locationData is an object, extract the address
              if (typeof app.metadata.metadata.whoIAm.locationData === 'object') {
                const locationData = app.metadata.metadata.whoIAm.locationData;
                if (locationData.address) {
                  return locationData.address;
                }
                if (locationData.city && locationData.state) {
                  return `${locationData.city}, ${locationData.state}`;
                }
                if (locationData.city) {
                  return locationData.city;
                }
                if (locationData.state) {
                  return locationData.state;
                }
              }
              // If it's a string, use it directly
              if (typeof app.metadata.metadata.whoIAm.locationData === 'string') {
                return app.metadata.metadata.whoIAm.locationData;
              }
            }
            if (app.metadata?.metadata?.currentLocation) {
              return app.metadata.metadata.currentLocation;
            }
            // Fallback to structured location data if whoIAm data is not available
            if (app.location?.city?.name && app.location?.state?.name) {
              return `${app.location.city.name}, ${app.location.state.name}`;
            }
            if (app.location?.address) {
              return app.location.address;
            }
            if (app.location?.city?.name) {
              return app.location.city.name;
            }
            if (app.location?.state?.name) {
              return app.location.state.name;
            }
            // If no location data is available, return null instead of a hardcoded fallback
            return null;
          })(),
          age: parseInt(app.metadata.age) || 0,
          appliedFor: jobDetails?.title || `Job ${jobId}`, // Use job title from API
          applicationDate: app.appliedAt || new Date().toISOString(),
          status: (() => {
            const apiStatus = app.status || 'applied';
            // Map API statuses to display statuses for consistency
            if (apiStatus === 'closed') {
              return 'shortlisted';
            }
            if (apiStatus === 'rejected' || apiStatus === 'archived') {
              return 'rejected';
            }
            return apiStatus;
          })(),
          experience: nestedMetadata?.whoIAm?.location || '',
          skills: app.metadata.skills || [],
          avatar: undefined, // No avatar in new API
          resume: undefined, // No resume in new API
          coverLetter: undefined, // No cover letter in new API
          expectedSalary: nestedMetadata?.whatIWant?.monthlyInHandPreferred?.toString() || '',
          noticePeriod: undefined, // No notice period in new API
          currentCompany: undefined, // No current company in new API
          currentRole: undefined, // No current role in new API
          education: undefined, // No education in new API
          languages: app.metadata.languages?.map(lang => lang.name) || [],
          certifications: nestedMetadata?.certificates || [],
          portfolio: undefined, // No portfolio in new API
          socialLinks: undefined, // No social links in new API
          applicationNotes: undefined, // No application notes in new API
          interviewScheduled: undefined, // No interview scheduled in new API
          interviewNotes: undefined, // No interview notes in new API
          feedback: undefined, // No feedback in new API
          lastContacted: undefined, // No last contacted in new API
          tags: app.metadata.tags?.map(tag => tag.descriptor.name) || [],
          // Add the new fields for export
          whoIAm: nestedMetadata?.whoIAm,
          whatIHave: nestedMetadata?.whatIHave,
          whatIWant: nestedMetadata?.whatIWant,
          // Store job details for export
          jobDetails: nestedMetadata?.jobDetails ? {
            role: nestedMetadata.jobDetails.tags?.role || nestedMetadata.jobDetails.role,
            status: nestedMetadata.jobDetails.tags?.status || nestedMetadata.jobDetails.status,
            tags: nestedMetadata.jobDetails.tags
          } : undefined,
          // Store the original application ID for API calls
          applicationId: app.id
        };
      })
      .filter(Boolean) as JobApplicant[]; // Remove any null entries
  }, [applications, jobId, jobDetails]);
  const filteredApplicants = React.useMemo(() => applicants, [applicants]);
  const [selectedCandidate, setSelectedCandidate] = useState<JobApplication | null>(null);
  const [showCandidateDetails, setShowCandidateDetails] = useState(false);
  
  // Map-related state
  const [applicantLocations, setApplicantLocations] = useState<ApplicantLocation[]>([]);
  const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lng: 78.9629 });
  const [mapZoom, setMapZoom] = useState(5); // Default zoom level for India
  const [selectedMapApplicantId, setSelectedMapApplicantId] = useState<string | null>(null);
  const selectedMapApplicant = React.useMemo(() => {
    if (!selectedMapApplicantId) {
      return null;
    }
    return applicantLocations.find((applicant) => applicant.id === selectedMapApplicantId) || null;
  }, [applicantLocations, selectedMapApplicantId]);
  const [isLoadingMap, setIsLoadingMap] = useState(true); // Start with true to prevent early mounting
  const [jobLocationData, setJobLocationData] = useState<{ title: string; location: string; lat: number; lng: number } | null>(null);
  // --- DYNAMIC TABLE COLUMN LOGIC START ---
  // Helper to format any cell value for safe rendering
  const formatValue = (value: any) => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'object') {
      if (Array.isArray(value)) return value.join(', ');
      // join object primitive values
      return Object.values(value).join(', ');
    }
    return String(value);
  };

  // Collect all unique keys from whatIWant across all applicants
  const allWhatIWantKeys = React.useMemo(() => {
    const keysSet = new Set<string>();
    applicants.forEach(applicant => {
      if (applicant.whatIWant && typeof applicant.whatIWant === 'object') {
        Object.keys(applicant.whatIWant).forEach(key => keysSet.add(key));
      }
    });
    return Array.from(keysSet);
  }, [applicants]);

  // Debug logging
  React.useEffect(() => {
    console.log('🔍 Job Applications Debug:', {
      organizationId: activeOrganizationId,
      jobId,
      jobDetails,
      applications,
      isLoading,
      error,
      applicantsCount: applicants?.length || 0
    });
  }, [activeOrganizationId, jobId, jobDetails, applications, isLoading, error, applicants]);
  // Helper function to get job location (same logic as MyJobs component)
  const getJobLocation = (job: any) => {
    return job?.location?.city && job?.location?.state 
      ? `${job.location.city}, ${job.location.state}`
      : 'Location not specified';
  };

  // Set map center based on job location
  useEffect(() => {
    const setJobLocationCenter = async () => {
      if (jobDetails) {
        const jobLocation = getJobLocation(jobDetails);
        if (jobLocation && jobLocation !== 'Location not specified') {
          console.log(`🗺️ Setting map center based on job location: "${jobLocation}"`);
          const coordinates = await geocodeLocation(jobLocation);
          if (coordinates) {
            console.log(`✅ Found coordinates for job location:`, coordinates);
            setMapCenter(coordinates);
            setMapZoom(10); // Set city-level zoom for job location
            
            // Set job location data for the map
            setJobLocationData({
              title: jobDetails.title || `Job ${jobId}`,
              location: jobLocation,
              lat: coordinates.lat,
              lng: coordinates.lng
            });
          } else {
            console.warn(`❌ Could not geocode job location: "${jobLocation}"`);
          }
        }
      }
    };

    setJobLocationCenter();
  }, [jobDetails, jobId]);

  // Convert applicants to map locations
  useEffect(() => {
    const convertToMapLocations = async () => {
      if (applicants.length === 0) {
        setApplicantLocations((prev) => (prev.length === 0 ? prev : EMPTY_MAP_LOCATIONS));
        setIsLoadingMap(false); // Set to false when no applicants to process
        return;
      }

      setIsLoadingMap(true);
      try {
        console.log('🗺️ Starting map conversion for applicants:', applicants.map(a => ({
          name: a.name,
          location: a.location
        })));
        
        // Temporary debugging: test geocoding for first 3 applicants
        if (applicants.length > 0) {
          console.log('🧪 Testing geocoding for first few applicants...');
          for (let i = 0; i < Math.min(3, applicants.length); i++) {
            const applicant = applicants[i];
            if (applicant.location) {
              await testGeocoding(applicant.location);
            }
          }
        }
        
        const locations = await convertApplicantsToMapLocations(applicants);
        console.log('🗺️ Map conversion result:', locations.map(l => ({
          name: l.name,
          location: l.location,
          coordinates: { lat: l.lat, lng: l.lng }
        })));
        
        setApplicantLocations(locations);
        
        // Only update map center based on applicant locations if no job location was set
        // This preserves the job location as the primary center point
        const hasJobLocation = jobDetails && getJobLocation(jobDetails) !== 'Location not specified';
        if (locations.length > 0 && !hasJobLocation && mapCenter.lat === 20.5937 && mapCenter.lng === 78.9629) {
          const center = calculateMapCenter(locations);
          setMapCenter(center);
          setMapZoom(8); // Zoom to show all applicants when no job location
        }
      } catch (error) {
        console.error('Error converting applicants to map locations:', error);
      } finally {
        setIsLoadingMap(false);
      }
    };

    convertToMapLocations();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicants]); // mapCenter intentionally excluded: including it causes infinite re-runs
  
  const handleViewCandidate = (candidate: JobApplicant) => {
    // Find the original JobApplication data using the application ID
    const originalApplication = applications?.find(app => 
      app.id === candidate.id
    );
    if (originalApplication) {
      setSelectedCandidate(originalApplication);
      setShowCandidateDetails(true);
    }
  };

  const handleCloseCandidateDetails = () => {
    setShowCandidateDetails(false);
    setSelectedCandidate(null);
  };

  // Map click handler
  const handleMapApplicantClick = (applicant: ApplicantLocation | null) => {
    if (applicant === null) {
      // Clear the selected applicant
      setSelectedMapApplicantId(null);
      setSelectedCandidate(null);
      setShowCandidateDetails(false);
      return;
    }
    
    setSelectedMapApplicantId(applicant.id);
    
    // Find the corresponding JobApplicant but DON'T open the modal
    // Only set the candidate data for the map card display
    const correspondingApplicant = applicants.find(app => app.id === applicant.id);
    if (correspondingApplicant) {
      const originalApplication = applications?.find(app => app.id === correspondingApplicant.id);
      if (originalApplication) {
        setSelectedCandidate(originalApplication);
        // Don't open the modal - just show the map card
        setShowCandidateDetails(false);
      }
    }
  };


  // Handle application actions (accept/reject)
  const handleTakeAction = async (applicant: JobApplicant, action: 'accept' | 'reject') => {
    if (!activeOrganizationId || !applicant.applicationId) {
      console.error('Missing organization ID or application ID');
      return;
    }

    console.log('🎯 Taking action on candidate:', {
      candidateId: applicant.id,
      candidateName: applicant.name,
      action,
      applicationId: applicant.applicationId
    });

    // Set loading state for this specific candidate
    setLoadingStates(prev => ({ ...prev, [applicant.id]: action }));

    const actionData = {
      applicationId: applicant.applicationId,
      applicationStatus: action === 'accept' ? 'Shortlisted' : 'Rejected',
      action: action
    };

    try {
      await takeActionMutation.mutateAsync({
        organizationId: activeOrganizationId,
        jobId: jobId,
        actionData
      });
      
      console.log('✅ Action taken on candidate:', {
        candidateId: applicant.id,
        candidateName: applicant.name,
        action
      });
      
    } catch (error) {
      console.error('Failed to take action on application:', error);
      // Show error toast
      toast.error('Failed to take action', {
        description: 'Please try again later.',
      });
    } finally {
      // Clear loading state for this candidate
      setLoadingStates(prev => ({ ...prev, [applicant.id]: null }));
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Helper function to get action button state for a specific candidate
  const getActionButtonState = (applicantId: string) => {
    return loadingStates[applicantId] || null;
  };
  


  // Helper function to render action buttons based on candidate status
  const renderActionButtons = (applicant: JobApplicant) => {
    const loadingState = getActionButtonState(applicant.id);
    const isAcceptLoading = loadingState === 'accept';
    const isRejectLoading = loadingState === 'reject';
    
    // Use the mapped status from the applicant object (consistent with map view)
    const status = applicant.status;

    // If status is "shortlisted", show "Shortlisted"
    if (status === 'shortlisted') {
      return (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-600">Shortlisted</span>
        </div>
      );
    }

    // If status is "rejected", show "Rejected"
    if (status === 'rejected') {
      return (
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-600" />
          <span className="text-sm font-medium text-red-600">Rejected</span>
        </div>
      );
    }

    // If status is not "open", show the status as read-only
    if (status !== 'open') {
      const statusDisplay = status.charAt(0).toUpperCase() + status.slice(1);
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-muted-foreground">{statusDisplay}</span>
        </div>
      );
    }

    // Show action buttons for other statuses
    return (
      <div className="flex gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-green-600 hover:text-green-700" 
          onClick={(e) => {
            e.stopPropagation();
            handleTakeAction(applicant, 'accept');
          }} 
          disabled={isAcceptLoading || isRejectLoading}
        >
          {isAcceptLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              {t('actions.accepting')}
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-1" />
              {t('actions.accept')}
            </>
          )}
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-red-600 hover:text-red-700" 
          onClick={(e) => {
            e.stopPropagation();
            handleTakeAction(applicant, 'reject');
          }} 
          disabled={isAcceptLoading || isRejectLoading}
        >
          {isRejectLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              {t('actions.rejecting')}
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 mr-1" />
              {t('actions.reject')}
            </>
          )}
        </Button>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading applications...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-medium mb-2 text-red-600">Error Loading Applications</h3>
              <p className="text-muted-foreground mb-4">
                {error.message || 'Failed to load job applications. Please try again.'}
              </p>
              <Button onClick={() => refetch()}>Retry</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // No applications state
  if (!isLoading && pagination.totalCount === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-6">
          {/* Back Button and Breadcrumb */}
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Link to="/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </div>
            
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/dashboard">My Job Postings</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage>Candidate List</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                  <Users className="h-8 w-8" />
                  Candidate List
                </h1>
                <p className="text-muted-foreground mt-1">
                  No applications found for this job
                </p>
              </div>
              <div className="flex items-center gap-2">
                <ExportButton 
                  data={[]}
                  jobTitle={jobDetails?.title || `job-${jobId}`}
                  disabled={true}
                />
              </div>
            </div>
          </div>

          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No Applications Yet</h3>
              <p className="text-muted-foreground mb-4">
                This job hasn't received any applications yet. Check back later or share the job posting to attract candidates.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // In a real app, you would fetch the job details using the jobId
  // For now, we'll use a placeholder job title
  // TODO: Use jobId to fetch actual job details from API
  const jobTitle = jobDetails?.title || `Job ${jobId}`; // Use job title from API

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-2 xs:px-4 py-4 sm:py-6">
        {/* Back Button and Breadcrumb - Mobile Responsive */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-4 mb-3 sm:mb-4">
            <Link to="/dashboard">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Back to Dashboard</span>
                <span className="xs:hidden">Back</span>
              </Button>
            </Link>
          </div>
          
          <Breadcrumb>
            <BreadcrumbList>
              
              
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/dashboard">My Job Postings</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>
              <BreadcrumbItem>
                <BreadcrumbPage>Candidate List</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header - Mobile Responsive */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 flex-shrink-0" />
                <span className="hidden sm:inline">Candidate List</span>
                <span className="sm:hidden">Candidates</span>
              </h1>
              <p className="text-muted-foreground mt-1 text-xs sm:text-sm truncate">
                {jobDetails?.title ? (
                  <>
                    <span className="hidden sm:inline">Applications for: {jobDetails.title}</span>
                    <span className="sm:hidden">{jobDetails.title}</span>
                    <span className="hidden xs:inline"> • {filteredApplicants.length} found</span>
                  </>
                ) : (
                  `Job ${jobId} • {filteredApplicants.length} candidates`
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <ExportButton 
                data={filteredApplicants}
                jobTitle={jobDetails?.title || `job-${jobId}`}
                disabled={filteredApplicants.length === 0}
              />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder={t('search.placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Table and Map Views */}
        <Tabs defaultValue="table" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="table" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Table View
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <Map className="h-4 w-4" />
              Map View
            </TabsTrigger>
          </TabsList>

          <TabsContent value="table" className="mt-6">
            {/* Applicants Table */}
            <Card>
              <CardHeader>
                <CardTitle>Applicants</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-medium">Name</th>
                        <th className="text-left p-4 font-medium">Location</th>
                        <th className="text-left p-4 font-medium">Age</th>
                        {/* Dynamically render whatIWant columns */}
                        {allWhatIWantKeys.map(key => (
                          <th key={key} className="text-left p-4 font-medium">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</th>
                        ))}
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredApplicants.length > 0 ? (
                        filteredApplicants.map((applicant) => (
                          <tr 
                            key={applicant.id} 
                            className="border-b hover:bg-muted/50 cursor-pointer"
                            onClick={() => handleViewCandidate(applicant)}
                          >
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={applicant.avatar} alt={applicant.name} />
                                  <AvatarFallback>{getInitials(applicant.name)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{applicant.name}</p>
                                  <p className="text-sm text-muted-foreground">{applicant.experience}</p>
                                </div>
                              </div>
                            </td>
                            {/* Use the location field from the applicant object */}
                            <td className="p-4">
                              <div className="flex items-center gap-1 text-sm">
                                <MapPin className="h-3 w-3" />
                                {applicant.location || applicant.experience || 'N/A'}
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="text-sm font-medium">{applicant.age} years</span>
                            </td>
                            {/* Render all whatIWant fields */}
                            {allWhatIWantKeys.map(key => (
                              <td key={key} className="p-4">
                                <span className="text-sm text-muted-foreground">{formatValue(applicant.whatIWant ? (applicant.whatIWant as any)[key] : undefined)}</span>
                              </td>
                            ))}
                            <td className="p-4">
                              {renderActionButtons(applicant)}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="p-8 text-center">
                            <h3 className="text-lg font-medium mb-2">{t('search.noResults')}</h3>
                            <p className="text-muted-foreground">
                              No applicants found matching your criteria.
                            </p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Pagination Controls */}
            {pagination.totalCount > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-1">
                {/* Page info */}
                <p className="text-sm text-muted-foreground order-2 sm:order-1">
                  Showing{' '}
                  <span className="font-medium">
                    {Math.min((currentPage - 1) * PAGE_SIZE + 1, pagination.totalCount)}
                  </span>
                  {' '}–{' '}
                  <span className="font-medium">
                    {Math.min(currentPage * PAGE_SIZE, pagination.totalCount)}
                  </span>
                  {' '}of{' '}
                  <span className="font-medium">{pagination.totalCount}</span>{' '}
                  applicant{pagination.totalCount !== 1 ? 's' : ''}
                </p>

                {/* Prev / page indicator / Next */}
                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1 || isFetching}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>

                  <span className="text-sm font-medium px-2">
                    Page {currentPage} of {totalPages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages || isFetching}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="map" className="mt-6">
            {/* Map View - Mobile Responsive */}
            <Card>
              <CardHeader className="pb-3 px-4 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Map className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden xs:inline">Applicant Locations</span>
                  <span className="xs:hidden">Locations</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[350px] xs:h-[450px] sm:h-[600px] w-full map-container">
                  {isLoadingMap ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin" />
                      <span className="ml-2 text-sm sm:text-base">Loading map...</span>
                    </div>
                  ) : (
                    <MapWrapper
                      applicants={applicantLocations}
                      onApplicantClick={handleMapApplicantClick}
                      selectedApplicant={selectedMapApplicant}
                      selectedCandidateDetails={selectedCandidate}
                      mapCenter={mapCenter}
                      zoom={mapZoom}
                      jobLocation={jobLocationData || undefined}
                      onTakeAction={async (applicantId: string, action: 'accept' | 'reject') => {
                        // Find the corresponding JobApplicant
                        const correspondingApplicant = applicants.find(app => app.id === applicantId);
                        if (correspondingApplicant) {
                          await handleTakeAction(correspondingApplicant, action);
                        }
                      }}
                      loadingStates={loadingStates}
                      enableFullscreen={true} // Enable fullscreen functionality
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Candidate Details Dialog */}
      {selectedCandidate && (
        <CandidateDetails
          isOpen={showCandidateDetails}
          onClose={handleCloseCandidateDetails}
          candidate={selectedCandidate}
          jobTitle={jobTitle}
        />
      )}
    </div>
  );
} 