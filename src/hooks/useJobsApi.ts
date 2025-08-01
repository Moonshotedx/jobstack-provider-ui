import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { jobsApi, type CreateJobRequest, type JobPosting, type JobApplication, type ApplicationActionRequest, getOrganizationList } from '@/lib/api-client';


// Query keys for cache management
export const jobsQueryKeys = {
  all: ['jobs'] as const,
  byOrg: (orgId: string) => ['jobs', orgId] as const,
  applications: (orgId: string, jobId: string) => ['jobs', orgId, 'applications', jobId] as const,
};

// Hook to get jobs for a specific organization
export const useGetJobs = (organizationId: string) => {
  return useQuery({
    queryKey: jobsQueryKeys.byOrg(organizationId),
    queryFn: () => jobsApi.getJobs(organizationId),
    enabled: !!organizationId && organizationId.length > 0,
    staleTime: 30 * 1000, // 30 seconds
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

// Hook to create a new job
export const useCreateJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ organizationId, jobData }: { organizationId: string; jobData: CreateJobRequest }) => {
      console.log('🚀 Creating job with payload:', { organizationId, jobData });
      return await jobsApi.createJob(organizationId, jobData);
    },
    onSuccess: (data, variables) => {
      console.log('✅ Job created successfully:', data);
      
      // Invalidate and refetch jobs list
      queryClient.invalidateQueries({
        queryKey: ['jobs', variables.organizationId]
      });
      
      toast.success('Job posted successfully!');
    },
    onError: (error: any) => {
      console.error('❌ Failed to create job:', error);
      toast.error(error?.response?.data?.message || 'Failed to post job. Please try again.');
    }
  });
};

// Hook to duplicate an existing job
export const useDuplicateJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ organizationId, job }: { organizationId: string; job: JobPosting }) => {
      console.log('🔄 Duplicating job:', { organizationId, jobId: job.id });
      return await jobsApi.duplicateJob(organizationId, job);
    },
    onSuccess: (data, variables) => {
      console.log('✅ Job duplicated successfully:', data);
      
      // Invalidate and refetch jobs list
      queryClient.invalidateQueries({
        queryKey: ['jobs', variables.organizationId]
      });
      
      toast.success('Job duplicated successfully!', {
        description: 'A new job has been created with the same details.',
      });
    },
    onError: (error: any) => {
      console.error('❌ Failed to duplicate job:', error);
      toast.error(error?.response?.data?.message || 'Failed to duplicate job. Please try again.');
    }
  });
};

export const useUpdateJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ organizationId, jobId, jobData }: { organizationId: string; jobId: string; jobData: CreateJobRequest }) => {
      console.log('🔄 Updating job with payload:', { organizationId, jobId, jobData });
      return await jobsApi.updateJob(organizationId, jobId, jobData);
    },
    onSuccess: (data, variables) => {
      console.log('✅ Job updated successfully:', data);
      
      // Invalidate and refetch jobs list
      queryClient.invalidateQueries({
        queryKey: ['jobs', variables.organizationId]
      });
      
      toast.success('Job updated successfully!');
    },
    onError: (error: any) => {
      console.error('❌ Failed to update job:', error);
      toast.error(error?.response?.data?.message || 'Failed to update job. Please try again.');
    }
  });
};

// Hook to delete a job
export const useDeleteJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ organizationId, jobId }: { organizationId: string; jobId: string }) => {
      console.log('🗑️ Deleting job:', { organizationId, jobId });
      return await jobsApi.deleteJob(organizationId, jobId);
    },
    onSuccess: (_, variables) => {
      console.log('✅ Job deleted successfully');
      
      // Invalidate and refetch jobs list
      queryClient.invalidateQueries({
        queryKey: ['jobs', variables.organizationId]
      });
      
      toast.success('Job deleted successfully!', {
        description: 'The job has been permanently removed.',
      });
    },
    onError: (error: any) => {
      console.error('❌ Failed to delete job:', error);
      toast.error(error?.response?.data?.message || 'Failed to delete job. Please try again.');
    }
  });
};

// Hook to get job applications for a specific job
export const useGetJobApplications = (organizationId: string, jobId: string) => {
  return useQuery({
    queryKey: jobsQueryKeys.applications(organizationId, jobId),
    queryFn: () => jobsApi.getJobApplications(organizationId, jobId),
    enabled: !!organizationId && !!jobId && organizationId.length > 0 && jobId.length > 0,
    staleTime: 30 * 1000, // 30 seconds
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

// Hook to get the current active organization's jobs
export const useCurrentOrganizationJobs = () => {
  const activeOrgId = useActiveOrganizationId();
  const jobsQuery = useGetJobs(activeOrgId || '');
  
  return {
    ...jobsQuery,
    isLoading: !activeOrgId || jobsQuery.isLoading,
    error: !activeOrgId ? new Error('No active organization found') : jobsQuery.error,
    data: activeOrgId ? jobsQuery.data : [],
  };
};

// Hook to get active organization ID
export const useActiveOrganizationId = () => {
  const { data: organizations, isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      // Check for auth token first
      const authToken = localStorage.getItem('auth-token') || sessionStorage.getItem('auth-token');
      
      if (!authToken) {
        return [];
      }
      
      // Get organization list
      const { getOrganizationList } = await import('@/lib/api-client');
      return await getOrganizationList();
    },
    staleTime: 0, // Always fetch fresh session data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 2,
  });

  if (isLoading) {
    return undefined;
  }

  // For now, we'll use the first organization as active
  // In the future, we can implement proper active organization selection
  return organizations?.[0]?.id || null;
};

// Hook to take action on a job application (accept/reject)
export const useTakeApplicationAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, actionData }: { organizationId: string; actionData: ApplicationActionRequest }) =>
      jobsApi.takeApplicationAction(organizationId, actionData),
    onSuccess: async (_, { organizationId, actionData }) => {
      // Invalidate and refetch applications queries to update the UI
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: jobsQueryKeys.applications(organizationId, actionData.applicationId) }),
        queryClient.invalidateQueries({ queryKey: jobsQueryKeys.byOrg(organizationId) }),
      ]);

      // Show success toast based on action
      const actionType = actionData.action === 'accept' ? 'accepted' : 'rejected';
      const statusType = actionData.applicationStatus === 'Shortlisted' ? 'shortlisted' : 'rejected';
      
      toast.success(`Candidate ${actionType} successfully!`, {
        description: `Application status updated to ${statusType}.`,
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Failed to take action on application';
      
      toast.error('Failed to take action', {
        description: errorMessage,
      });
    },
  });
};

// Organization hooks
export const useGetOrganizationList = () => {
  return useQuery({
    queryKey: ['organizations'],
    queryFn: () => getOrganizationList(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateOrganization = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ organizationId, organizationData }: {
      organizationId: string;
      organizationData: {
        name: string;
        logo?: string;
        metadata: Record<string, any>;
        slug?: string;
      };
    }) => {
      console.log('🔄 Updating organization with jobs API:', { organizationId, organizationData });
      
      // Use apiClient with the correct jobs endpoint
      const { default: apiClient } = await import('@/lib/api-client');
      const response = await apiClient.post(`/auth/organization/update`, {
        data: {
          name: organizationData.name,
          logo: organizationData.logo,
          metadata: organizationData.metadata,
          slug: organizationData.slug
        },
        organizationId: organizationId
      });

      console.log('✅ Organization updated successfully:', response.data);
      return response.data;
    },
    onSuccess: (data) => {
      console.log('Organization update success:', data);
      // Invalidate and refetch organization list
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organizations-with-metadata'] });
      queryClient.invalidateQueries({ queryKey: ['session'] });
    },
    onError: (error: any) => {
      console.error('❌ Failed to update organization:', error);
    }
  });
};

// Export types for use in components
export type { CreateJobRequest, JobPosting, JobApplication, ApplicationActionRequest }; 

// Helper function to get all applications for an organization across all jobs
export const useGetAllOrganizationApplications = (organizationId: string) => {
  const { data: jobs } = useGetJobs(organizationId);
  
  return useQuery({
    queryKey: ['organizationApplications', organizationId],
    queryFn: async () => {
      if (!jobs || jobs.length === 0) return [];
      
      // Fetch applications for all jobs in parallel
      const applicationPromises = jobs.map(job => 
        jobsApi.getJobApplications(organizationId, job.id)
      );
      
      const allApplicationsArrays = await Promise.all(applicationPromises);
      // Flatten the arrays into a single array
      return allApplicationsArrays.flat();
    },
    enabled: !!organizationId && !!jobs && jobs.length > 0,
    staleTime: 30 * 1000, // 30 seconds
  });
};

// Helper function to calculate candidates statistics based on application status
export const useOrganizationCandidateStats = (organizationId: string) => {
  const { data: applications, isLoading } = useGetAllOrganizationApplications(organizationId);
  
  return {
    isLoading,
    stats: {
      shortlisted: applications?.filter(app => app.status === 'closed').length || 0,
      rejected: applications?.filter(app => app.status === 'rejected' || app.status === 'archived').length || 0,
      totalApplications: applications?.length || 0,
    }
  };
}; 