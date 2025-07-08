import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, MoreHorizontal, MapPin, Calendar, Loader2, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCurrentOrganizationJobs } from '@/hooks/useJobsApi';
import type { JobPosting } from '@/lib/api-client';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import JobDetailsDialog from './JobDetailsDialog';
import PostJobDialog from './PostJobDialog';

const MyJobs = () => {
  const { t } = useTranslation('jobs');
  const { data: jobs, isLoading, error } = useCurrentOrganizationJobs();
  
  // State for dialogs
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [showEditJob, setShowEditJob] = useState(false);

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
    return job.location?.city + ', ' + job.location?.state || 'Location not specified';
  };

  const getJobSalary = (job: JobPosting) => {
    // For Industrial Tailor, check CTC first, then regular salary
    // if (job.metadata?.industrialTailorDetails?.salaryCTC) {
    //   return `₹${job.metadata.industrialTailorDetails.salaryCTC.toLocaleString()} CTC`;
    // }
    // if (job.metadata?.industrialTailorDetails?.monthlyInHand) {
    //   return `₹${job.metadata.industrialTailorDetails.monthlyInHand.toLocaleString()}/month`;
    // }
    return job.metadata?.jobDetails?.salaryCTC || 'Salary not specified';
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
    return job.metadata?.jobDetails?.positions || job.metadata?.positions || 1;
  };

  // Handler functions for dialogs
  const handleViewJob = (job: JobPosting) => {
    setSelectedJob(job);
    setShowJobDetails(true);
  };

  const handleEditJob = (job: JobPosting) => {
    setSelectedJob(job);
    setShowEditJob(true);
  };

  const handleCloseJobDetails = () => {
    setShowJobDetails(false);
    setSelectedJob(null);
  };

  const handleCloseEditJob = () => {
    setShowEditJob(false);
    setSelectedJob(null);
  };

  // Function to render job details dynamically
  const renderJobDetails = (jobDetails: any) => {
    if (!jobDetails || typeof jobDetails !== 'object') return null;

    const excludeFields = ['title', 'positions', 'salaryCTC'];
    const details: React.ReactElement[] = [];

    const processObject = (obj: any, prefix = '') => {
      Object.entries(obj).forEach(([key, value]) => {
        const fullKey = prefix ? `${prefix}.${key}` : key;
        
        // Skip excluded fields
        if (excludeFields.includes(key)) return;

        if (value !== null && value !== undefined && value !== '') {
          if (typeof value === 'object' && !Array.isArray(value)) {
            // Recursively process nested objects
            processObject(value, fullKey);
          } else if (Array.isArray(value)) {
            // Handle arrays
            const displayValue = value.length > 0 ? value.join(', ') : 'None';
            details.push(
              <div key={fullKey} className="text-sm text-muted-foreground">
                <span className="font-medium">{key.charAt(0).toUpperCase() + key.slice(1)}:</span> {displayValue}
              </div>
            );
          } else {
            // Handle primitive values
            let displayValue = String(value);
            
            // Format specific fields
            if (typeof value === 'number' && (key.includes('salary') || key.includes('pay') || key.includes('amount'))) {
              displayValue = `₹${value.toLocaleString()}`;
            } else if (key.includes('date') || key.includes('Date')) {
              try {
                displayValue = new Date(String(value)).toLocaleDateString();
              } catch {
                // Keep original value if date parsing fails
              }
            }
            
            details.push(
              <div key={fullKey} className="text-sm text-muted-foreground">
                <span className="font-medium">{key.charAt(0).toUpperCase() + key.slice(1)}:</span> {displayValue}
              </div>
            );
          }
        }
      });
    };

    processObject(jobDetails);
    return details;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">{t('management.loadingJobs')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    let errorTitle = t('management.errorLoadingJobs');
    let errorDescription = t('management.errorLoadingDesc');
    
    if (error.message === 'No active organization found') {
      errorTitle = 'No Organization Selected';
      errorDescription = 'Please create or select an organization to view jobs.';
    }
    
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium mb-2 text-red-600">{errorTitle}</h3>
            <p className="text-muted-foreground mb-4">{errorDescription}</p>
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
          <h2 className="text-2xl font-bold">{t('management.title')}</h2>
          <p className="text-muted-foreground">{t('management.subtitle')}</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {t('management.totalJobs', { count: jobs?.length || 0 })}
        </Badge>
      </div>

      <div className="grid gap-4">
        {jobs?.map((job) => {
          const jobStatus = getJobStatus(job);
          const payFrequency = getPayFrequency(job);
          const industryRole = getIndustryAndRole(job);
          const positions = getPositions(job);
          
          return (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{job.title}</h3>
                      <Badge className={getStatusColor(jobStatus)}>
                        {t(`status.${jobStatus}`)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {getApplicationsCount(job)} applications
                      </Badge>
                      {/* {industryRole && (
                        <Badge variant="outline" className="text-xs">
                          {industryRole}
                        </Badge>
                      )} */}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {getJobLocation(job)}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {t('management.postedOn', { date: formatDate(job.createdAt) })}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <span>{getJobSalary(job)}</span>
                          {payFrequency && (
                            <span className="text-xs text-muted-foreground">
                              {payFrequency}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {getJobType(job)}
                        </Badge>
                      </div> */}
                    </div>

                    {/* Additional Details Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                      <div>
                        <span className="font-medium">Positions:</span> {positions}
                      </div>
                    </div>

                    {/* Dynamic Job Details */}
                    {job.metadata?.jobDetails && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-muted-foreground mb-3">
                        {renderJobDetails(job.metadata.jobDetails)}
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      {jobStatus === 'active' && (
                        <span className="text-sm text-green-600">{t('management.jobActive')}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewJob(job)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {t('management.viewJob')}
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewJob(job)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Job Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditJob(job)}>
                          <Edit className="h-4 w-4 mr-2" />
                          {t('management.editJob')}
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/job-applicants/$jobId" params={{ jobId: job.id }}>
                            <Users className="h-4 w-4 mr-2" />
                            {t('management.viewApplications')}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          {t('management.duplicateJob')}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          {t('management.closeJob')}
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
            <h3 className="text-lg font-medium mb-2">{t('management.noJobsYet')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('management.noJobsDesc')}
            </p>
            <Button>{t('management.createFirstJob')}</Button>
          </CardContent>
        </Card>
      )}

      {/* Job Details Dialog */}
      <JobDetailsDialog
        isOpen={showJobDetails}
        onClose={handleCloseJobDetails}
        job={selectedJob}
        onEdit={() => {
          handleCloseJobDetails();
          handleEditJob(selectedJob!);
        }}
      />

      {/* Edit Job Dialog */}
      <PostJobDialog
        isOpen={showEditJob}
        onClose={handleCloseEditJob}
        skipAuthSteps={true}
        editJobData={selectedJob}
      />

    </div>
  );
};

export default MyJobs; 