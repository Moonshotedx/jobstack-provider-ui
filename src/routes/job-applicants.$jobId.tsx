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
  Loader2
} from 'lucide-react';
import type { JobApplicant } from '@/types/jobPost';
import CandidateDetails from '@/components/CandidateDetails';
import { useTranslation } from 'react-i18next';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import React from 'react';
import Header from '@/components/Header';
import { useGetJobApplications, useActiveOrganizationId, useGetJobs } from '@/hooks/useJobsApi';
import type { JobApplication } from '@/lib/api-client';

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
  
  // Transform API data to match the existing JobApplicant interface
  const applicants: JobApplicant[] = React.useMemo(() => {
    if (!applications) return [];
    
    return applications
      .filter((app: JobApplication) => app && app.candidate) // Filter out any undefined applications
      .map((app: JobApplication) => {
        // Add null checks for candidate data
        if (!app.candidate) {
          console.warn('⚠️ Application missing candidate data:', app);
          return null;
        }
        
        return {
          id: app.candidate.id || `candidate-${app.id}`,
          name: app.candidate.name || 'Unknown Candidate',
          email: app.candidate.email || '',
          phone: app.candidate.phone || '',
          location: app.candidate.location || '',
          age: app.candidate.age || 0,
          appliedFor: jobDetails?.title || `Job ${jobId}`, // Use job title from API
          applicationDate: app.appliedAt || new Date().toISOString(),
          status: app.status || 'applied',
          trustScore: app.candidate.trustScore || 0,
          matchScore: app.candidate.matchScore || 0,
          experience: app.candidate.experience || '',
          skills: app.candidate.skills || [],
          avatar: app.candidate.avatar,
          resume: app.candidate.resume,
          coverLetter: app.candidate.coverLetter,
          expectedSalary: app.candidate.expectedSalary,
          noticePeriod: app.candidate.noticePeriod,
          currentCompany: app.candidate.currentCompany,
          currentRole: app.candidate.currentRole,
          education: app.candidate.education,
          languages: app.candidate.languages || [],
          certifications: app.candidate.certifications || [],
          portfolio: app.candidate.portfolio,
          socialLinks: app.candidate.socialLinks,
          applicationNotes: app.candidate.applicationNotes,
          interviewScheduled: app.candidate.interviewScheduled,
          interviewNotes: app.candidate.interviewNotes,
          feedback: app.candidate.feedback,
          lastContacted: app.candidate.lastContacted,
          tags: app.candidate.tags || []
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
  const [selectedCandidate, setSelectedCandidate] = useState<JobApplicant | null>(null);
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
        applicant.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
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
    setSelectedCandidate(candidate);
    setShowCandidateDetails(true);
  };

  const handleCloseCandidateDetails = () => {
    setShowCandidateDetails(false);
    setSelectedCandidate(null);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
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
                    <th className="text-left p-4 font-medium">What I Have</th>
                    <th className="text-left p-4 font-medium">What I Have</th>
                    <th className="text-left p-4 font-medium">What I Have</th>
                    <th className="text-left p-4 font-medium">What I Have</th>
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
                          <span className="text-sm text-muted-foreground">-</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">-</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">-</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm text-muted-foreground">-</span>
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
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700">
                              Approve
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              Reject
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={10} className="p-8 text-center">
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