import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, MoreHorizontal, MapPin, Calendar, DollarSign, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrentOrganizationJobs } from '@/hooks/useJobsApi';
import type { JobPosting } from '@/lib/api-client';

const MyJobs = () => {
  const { data: jobs, isLoading, error } = useCurrentOrganizationJobs();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-green-100 text-green-800'; // Default to active for now
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper functions to extract data from job metadata
  const getJobLocation = (job: JobPosting) => {
    // Try to get location from metadata first, fallback to basic description
    return job.metadata?.location || 'Location not specified';
  };

  const getJobSalary = (job: JobPosting) => {
    // For Industrial Tailor, check CTC first, then regular salary
    if (job.metadata?.industrialTailorDetails?.salaryCTC) {
      return `₹${job.metadata.industrialTailorDetails.salaryCTC.toLocaleString()} CTC`;
    }
    if (job.metadata?.industrialTailorDetails?.monthlyInHand) {
      return `₹${job.metadata.industrialTailorDetails.monthlyInHand.toLocaleString()}/month`;
    }
    return job.metadata?.salary || 'Salary not specified';
  };

  const getJobType = (job: JobPosting) => {
    // For Industrial Tailor, use employment type if available
    if (job.metadata?.industrialTailorDetails?.employmentType) {
      return job.metadata.industrialTailorDetails.employmentType;
    }
    return job.metadata?.jobType || 'Full-time';
  };

  const getJobStatus = (job: JobPosting) => {
    return job.metadata?.status || 'active';
  };

  const getApplicationsCount = (job: JobPosting) => {
    return job.metadata?.applicationsCount || 0;
  };

  const getExperience = (job: JobPosting) => {
    return job.metadata?.experience || 'Not specified';
  };

  const getPayFrequency = (job: JobPosting) => {
    // For Industrial Tailor, check salary disbursement frequency
    if (job.metadata?.industrialTailorDetails?.salaryDisbursementFrequency) {
      return job.metadata.industrialTailorDetails.salaryDisbursementFrequency;
    }
    return job.metadata?.payFrequency || '';
  };

  const getIndustryAndRole = (job: JobPosting) => {
    const industry = job.metadata?.industry;
    const role = job.metadata?.role;
    if (industry && role && industry !== role) {
      return `${industry} - ${role}`;
    }
    return industry || role || '';
  };

  const getPositions = (job: JobPosting) => {
    return job.metadata?.positions || 1;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading your job postings...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium mb-2 text-red-600">Error loading jobs</h3>
            <p className="text-muted-foreground mb-4">
              There was an error loading your job postings. Please try again.
            </p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Job Postings</h2>
          <p className="text-muted-foreground">Manage and track your job postings</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {jobs?.length || 0} Total Jobs
        </Badge>
      </div>

      <div className="grid gap-4">
        {jobs?.map((job) => {
          const jobStatus = getJobStatus(job);
          const payFrequency = getPayFrequency(job);
          const industryRole = getIndustryAndRole(job);
          const experience = getExperience(job);
          const positions = getPositions(job);
          
          return (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{job.title}</h3>
                      <Badge className={getStatusColor(jobStatus)}>
                        {jobStatus.charAt(0).toUpperCase() + jobStatus.slice(1)}
                      </Badge>
                      {industryRole && (
                        <Badge variant="outline" className="text-xs">
                          {industryRole}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {getJobLocation(job)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Posted {formatDate(job.createdAt)}
                      </div>
                      <div className="flex items-center gap-2">
                        {/* <DollarSign className="h-4 w-4" /> */}
                        <div className="flex flex-col">
                          <span>{getJobSalary(job)}</span>
                          {payFrequency && (
                            <span className="text-xs text-muted-foreground">
                              {payFrequency}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getJobType(job)}
                        </Badge>
                      </div>
                    </div>

                    {/* Additional Details Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground mb-3">
                      <div>
                        <span className="font-medium">Experience:</span> {experience}
                      </div>
                      <div>
                        <span className="font-medium">Positions:</span> {positions}
                      </div>
                      <div>
                        <span className="font-medium">Applications:</span> {getApplicationsCount(job)}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {jobStatus === 'active' && (
                        <span className="text-sm text-green-600">● Active</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Job
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          View Applications
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          Duplicate Job
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          Close Job
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {(!jobs || jobs.length === 0) && (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium mb-2">No job postings yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by creating your first job posting to attract candidates.
            </p>
            <Button>Create Your First Job</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyJobs; 