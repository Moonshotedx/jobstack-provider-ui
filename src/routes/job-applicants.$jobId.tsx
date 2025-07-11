import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  MapPin,
  Star,
  TrendingUp,
  Users,
  ArrowLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import type { JobApplicant } from '@/types/jobPost';
import CandidateDetails from '@/components/CandidateDetails';
import { useTranslation } from 'react-i18next';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import React from 'react';
import Header from '@/components/Header';
import { useGetJobApplications, useActiveOrganizationId, useGetJobs, useTakeApplicationAction } from '@/hooks/useJobsApi';
import type { JobApplication } from '@/lib/api-client';
import { toast } from 'sonner';

export const Route = createFileRoute('/job-applicants/$jobId')({
  component: JobApplicantsPage,
});

function JobApplicantsPage() {
  const { jobId } = Route.useParams();
  const { t } = useTranslation('candidates');
  const activeOrganizationId = useActiveOrganizationId();
  
  // Fetch job applications using the API with the job ID from route params
  const { 
    data: applications, 
    isLoading, 
    error, 
    refetch 
  } = useGetJobApplications(activeOrganizationId || '', jobId);
  
  // Get job details from the existing jobs list (we'll need to fetch this)
  const { data: jobs } = useGetJobs(activeOrganizationId || '');
  const jobDetails = jobs?.find(job => job.id === jobId);
  
  // Application action mutation
  const takeActionMutation = useTakeApplicationAction();
  
  // Track loading states for individual candidates
  const [loadingStates, setLoadingStates] = useState<Record<string, 'accept' | 'reject' | null>>({});
  
  // Track status updates that should persist across refetches
  const [statusUpdates, setStatusUpdates] = useState<Record<string, 'shortlisted' | 'rejected'>>({});
  
  // Transform API data to match the existing JobApplicant interface
  const applicants: JobApplicant[] = React.useMemo(() => {
    if (!applications) return [];
    
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
        
        return {
          id: app.id, // Use the unique application ID as the primary identifier
          name: app.metadata.name || app.userName || 'Unknown Candidate',
          email: app.contact?.email || '',
          phone: app.contact?.phone || '',
          location: app.location?.city?.name && app.location?.state?.name 
            ? `${app.location.city.name}, ${app.location.state.name}`
            : app.location?.address || '',
          age: parseInt(app.metadata.age) || 0,
          appliedFor: jobDetails?.title || `Job ${jobId}`, // Use job title from API
          applicationDate: app.appliedAt || new Date().toISOString(),
          status: statusUpdates[app.id] || app.status || 'applied', // Use persisted status if available
          trustScore: 85, // Default trust score - you can calculate this based on your logic
          matchScore: 78, // Default match score - you can calculate this based on your logic
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
          // Add the new fields for table display
          whatIHave: nestedMetadata?.whatIHave,
          whatIWant: nestedMetadata?.whatIWant,
          // Store the original application ID for API calls
          applicationId: app.id
        };
      })
      .filter(Boolean) as JobApplicant[]; // Remove any null entries
  }, [applications, jobId, jobDetails]);

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

  const [filteredApplicants, setFilteredApplicants] = useState<JobApplicant[]>(applicants);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCandidate, setSelectedCandidate] = useState<JobApplication | null>(null);
  const [showCandidateDetails, setShowCandidateDetails] = useState(false);
  // Sorting state
  const [sortBy, setSortBy] = useState<'trustScore' | 'matchScore' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Update filtered applicants when applicants data changes
  React.useEffect(() => {
    setFilteredApplicants(applicants);
  }, [applicants]);

  // Sorting handler
  const handleSort = (column: 'trustScore' | 'matchScore') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  // Filter and sort applicants
  React.useEffect(() => {
    let filtered = applicants;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(applicant =>
        applicant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        applicant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        applicant.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase())) ||
        applicant.whatIHave?.jukiMachineExperience?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        applicant.whatIWant?.stayPreferences?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        applicant.whatIWant?.readyToMigrate?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(applicant => applicant.status === statusFilter);
    }

    // Sorting
    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortBy] ?? 0;
        const bVal = b[sortBy] ?? 0;
        if (sortOrder === 'asc') return aVal - bVal;
        return bVal - aVal;
      });
    }

    setFilteredApplicants(filtered);
  }, [applicants, searchQuery, statusFilter, sortBy, sortOrder]);

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
        actionData
      });
      
      // Update the status in our persistent state
      const newStatus = action === 'accept' ? 'shortlisted' : 'rejected';
      setStatusUpdates(prev => ({
        ...prev,
        [applicant.id]: newStatus
      }));
      
      console.log('✅ Updated status for candidate:', {
        candidateId: applicant.id,
        candidateName: applicant.name,
        newStatus,
        allStatusUpdates: { ...statusUpdates, [applicant.id]: newStatus }
      });
      
      // Don't refetch immediately - let the local state handle the UI
      // The API call has already succeeded, so we can trust our local state
      // Refetch will happen automatically when the user navigates or refreshes
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
  
  // Helper function to get the current status considering updates
  const getCurrentStatus = (applicantId: string, originalStatus: string) => {
    return statusUpdates[applicantId] || originalStatus;
  };

  // Helper function to render action buttons based on candidate status
  const renderActionButtons = (applicant: JobApplicant) => {
    const loadingState = getActionButtonState(applicant.id);
    const isAcceptLoading = loadingState === 'accept';
    const isRejectLoading = loadingState === 'reject';
    const currentStatus = getCurrentStatus(applicant.id, applicant.status);

    // If candidate is already shortlisted or rejected, show status instead of buttons
    if (currentStatus === 'shortlisted') {
      return (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-600">Shortlisted</span>
        </div>
      );
    }

    if (currentStatus === 'rejected') {
      return (
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-600" />
          <span className="text-sm font-medium text-red-600">Rejected</span>
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
  if (!isLoading && (!applications || applications.length === 0)) {
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
                    <Link to="/dashboard">Dashboard</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
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
                {jobDetails?.title ? `Applications for: ${jobDetails.title}` : `Job ${jobId}`} • {filteredApplicants.length} candidates found
              </p>
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
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="shortlisted">Shortlisted</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="hired">Hired</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

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
                    <th className="text-left p-4 font-medium">Quality Score</th>
                    <th className="text-left p-4 font-medium">Stitching Speed</th>
                    <th className="text-left p-4 font-medium">Juki Experience</th>
                    <th className="text-left p-4 font-medium">Monthly In-Hand</th>
                    <th className="text-left p-4 font-medium">Work Hours/Day</th>
                    <th className="text-left p-4 font-medium">
                      <div className="flex items-center gap-1">
                        Trust Score
                        <button
                          type="button"
                          className={sortBy === 'trustScore' ? 'text-blue-600' : 'text-gray-400'}
                          onClick={e => { e.stopPropagation(); handleSort('trustScore'); }}
                        >
                          {sortBy === 'trustScore' && sortOrder === 'desc' ? <ArrowDown className="inline h-4 w-4" /> : <ArrowUp className="inline h-4 w-4" />}
                        </button>
                      </div>
                    </th>
                    <th className="text-left p-4 font-medium">
                      <div className="flex items-center gap-1">
                        Match Score
                        <button
                          type="button"
                          className={sortBy === 'matchScore' ? 'text-green-600' : 'text-gray-400'}
                          onClick={e => { e.stopPropagation(); handleSort('matchScore'); }}
                        >
                          {sortBy === 'matchScore' && sortOrder === 'desc' ? <ArrowDown className="inline h-4 w-4" /> : <ArrowUp className="inline h-4 w-4" />}
                        </button>
                      </div>
                    </th>
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
                        <td className="p-4">
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            {applicant.location}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="text-sm font-medium">{applicant.age} years</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">{applicant.whatIHave?.qualityScore || 'N/A'}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">{applicant.whatIHave?.stitchingSpeed || 'N/A'}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">{applicant.whatIHave?.jukiMachineExperience || 'N/A'}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">{applicant.whatIWant?.monthlyInHandPreferred || 'N/A'}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">{applicant.whatIWant?.workHoursPerDay || 'N/A'}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-blue-600" />
                            <span className="text-sm font-medium">{applicant.trustScore}%</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3 text-green-600" />
                            <span className="text-sm font-medium">{applicant.matchScore}%</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {renderActionButtons(applicant)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={11} className="p-8 text-center">
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