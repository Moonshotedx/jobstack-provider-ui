import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, MoreHorizontal, MapPin, Calendar, Loader2, Users, Copy, Trash2, AlertTriangle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCurrentOrganizationJobs, useDuplicateJob, useActiveOrganizationId, useDeleteJob } from '@/hooks/useJobsApi';
import type { JobPosting } from '@/lib/api-client';
import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import JobDetailsDialog from './JobDetailsDialog';
import PostJobDialog from './PostJobDialog';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

const MyJobs = () => {
  const { t } = useTranslation('jobs');
  const { data: jobs, isLoading, error } = useCurrentOrganizationJobs();
  const activeOrganizationId = useActiveOrganizationId();
  const isMobile = useIsMobile();
  
  // State for dialogs
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [showEditJob, setShowEditJob] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<JobPosting | null>(null);

  // Duplicate job mutation
  const duplicateJobMutation = useDuplicateJob();

  // Delete job mutation
  const deleteJobMutation = useDeleteJob();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'open': return 'bg-green-100 text-green-800';
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
    return job.location?.city && job.location?.state 
      ? `${job.location.city}, ${job.location.state}`
      : 'Location not specified';
  };

  const getJobSalary = (job: JobPosting) => {
    if (!job.metadata?.jobDetails) return 'Salary not specified';

    const details = job.metadata.jobDetails;
    const parts = [];

    if (details.monthlyInHand) {
      parts.push(`₹${details.monthlyInHand.toLocaleString()} in-hand`);
    }
    if (details.monthlyPfEsicBenefits) {
      parts.push(`₹${details.monthlyPfEsicBenefits.toLocaleString()} benefits`);
    }

    return parts.length > 0 ? parts.join(' + ') : 'Salary not specified';
  };

  const getJobStatus = (job: JobPosting) => {
    // Get status from API response, fallback to metadata
    const apiStatus = job.metadata?.status;
    
    // Map 'open' status to 'active' for display purposes
    if (apiStatus === 'open') {
      return 'active';
    }
    
    return apiStatus || 'Active';
  };

  const getApplicationsCount = (job: JobPosting) => {
    // Use real-time applicationsCount from API response, fallback to metadata if not available
    return job.applicationsCount ? parseInt(job.applicationsCount) : (job.metadata?.applicationsCount || 0);
  };

  const getPayFrequency = (job: JobPosting) => {
    if (job.metadata?.jobDetails?.payFrequency) {
      return job.metadata.jobDetails.payFrequency.charAt(0).toUpperCase() + 
           job.metadata.jobDetails.payFrequency.slice(1);
    }
    return 'Monthly';
  };

  const getPositions = (job: JobPosting) => {
    return job.metadata?.jobDetails?.positions || 1;
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

  // Handle duplicate job
  const handleDuplicateJob = async (job: JobPosting) => {
    if (!activeOrganizationId) {
      toast.error('No active organization found. Please select an organization first.');
      return;
    }

    try {
      await duplicateJobMutation.mutateAsync({
        organizationId: activeOrganizationId,
        job: job
      });
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error('Failed to duplicate job:', error);
    }
  };

  // Handle delete job
  const handleDeleteJob = async (job: JobPosting) => {
    if (!activeOrganizationId) {
      toast.error('No active organization found. Please select an organization first.');
      return;
    }

    setJobToDelete(job);
    setShowDeleteConfirm(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (!jobToDelete || !activeOrganizationId) {
      return;
    }

    try {
      await deleteJobMutation.mutateAsync({
        organizationId: activeOrganizationId,
        jobId: jobToDelete.id
      });
      
      // Close the dialog after successful deletion
      setShowDeleteConfirm(false);
      setJobToDelete(null);
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error('Failed to delete job:', error);
    }
  };

  // Handle cancel delete
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setJobToDelete(null);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">{t('management.title')}</h2>
          <p className="text-sm sm:text-base text-muted-foreground">{t('management.subtitle')}</p>
        </div>
        <Badge variant="secondary" className="text-sm w-fit">
          {t('management.totalJobs', { count: jobs?.length || 0 })}
        </Badge>
      </div>

      {/* Jobs Grid */}
      <div className="grid gap-4">
        {jobs?.map((job) => {
          const jobStatus = getJobStatus(job);
          const payFrequency = getPayFrequency(job);
          const positions = getPositions(job);
          
          return (
            <Card key={job.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 sm:p-6">
                {/* Mobile Layout */}
                {isMobile ? (
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold truncate">{job.title}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge className={`text-xs ${getStatusColor(jobStatus)}`}>
                            {t(`status.${jobStatus}`)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Users className="h-3 w-3 mr-1" />
                            {getApplicationsCount(job)}
                          </Badge>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="p-2">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewJob(job)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
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
                          <DropdownMenuItem onClick={() => handleDuplicateJob(job)}>
                            <Copy className="h-4 w-4 mr-2" />
                            {t('management.duplicateJob')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteJob(job)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('management.deleteJob')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Job Info */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{getJobLocation(job)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 flex-shrink-0" />
                        <span>{t('management.postedOn', { date: formatDate(job.createdAt) })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium">Salary:</span>
                        <span className="truncate">{getJobSalary(job)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium">Positions:</span>
                        <span>{positions}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2 border-t">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 h-8"
                        onClick={() => handleViewJob(job)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1 h-11"
                        asChild
                      >
                        <Link to="/job-applicants/$jobId" params={{ jobId: job.id }}>
                          <Users className="h-4 w-4 mr-2" />
                          Applications
                        </Link>
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Desktop Layout */
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
                        {(jobStatus === 'active' || jobStatus === 'open') && (
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
                          <DropdownMenuItem onClick={() => handleDuplicateJob(job)}>
                            <Copy className="h-4 w-4 mr-2" />
                            {t('management.duplicateJob')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteJob(job)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('management.deleteJob')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )}
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
          </CardContent>
        </Card>
      )}

      {/* Job Details Dialog */}
      <JobDetailsDialog
        isOpen={showJobDetails}
        onClose={handleCloseJobDetails}
        job={selectedJob}
      />

      {/* Edit Job Dialog */}
      <PostJobDialog
        isOpen={showEditJob}
        onClose={handleCloseEditJob}
        skipAuthSteps={true}
        editJobData={selectedJob}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Confirm Delete
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{jobToDelete?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleCancelDelete}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={deleteJobMutation.isPending}
            >
              {deleteJobMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Job'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyJobs; 