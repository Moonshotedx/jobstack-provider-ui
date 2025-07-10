import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { jobsApi, type CreateJobRequest, type JobPosting, type JobApplication, type ApplicationActionRequest } from '@/lib/api-client';
import { authClient } from '@/lib/auth-client';

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
    mutationFn: ({ organizationId, jobData }: { organizationId: string; jobData: CreateJobRequest }) =>
      jobsApi.createJob(organizationId, jobData),
    onSuccess: async (newJob, { organizationId }) => {
      // First, invalidate session to ensure it's current
      await queryClient.invalidateQueries({ queryKey: ['session'] });
      
      // Then invalidate and refetch jobs queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: jobsQueryKeys.byOrg(organizationId) }),
        queryClient.invalidateQueries({ queryKey: jobsQueryKeys.all }),
      ]);
      
      // Force immediate refetch of jobs for this organization
      await queryClient.refetchQueries({ queryKey: jobsQueryKeys.byOrg(organizationId) });

      toast.success('Job posted successfully!', {
        description: `"${newJob.title}" has been created.`,
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || 
                          error?.message || 
                          'Failed to create job posting';
      
      toast.error('Failed to post job', {
        description: errorMessage,
      });
    },
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
  const { data: session, isLoading: sessionLoading, error: sessionError } = useQuery({
    queryKey: ['session'],
    queryFn: () => authClient.getSession(undefined, { credentials: 'include' }),
    staleTime: 0, // Always fetch fresh session data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 2,
  });

  const activeOrgId = session?.data?.session?.activeOrganizationId;
  const jobsQuery = useGetJobs(activeOrgId || '');
  
  return {
    ...jobsQuery,
    isLoading: sessionLoading || (!!activeOrgId && jobsQuery.isLoading),
    error: sessionError || (!activeOrgId && !sessionLoading ? new Error('No active organization found') : jobsQuery.error),
    data: activeOrgId ? jobsQuery.data : [],
  };
};

// Hook to get active organization ID
export const useActiveOrganizationId = () => {
  const { data: session, isLoading } = useQuery({
    queryKey: ['session'],
    queryFn: () => authClient.getSession(undefined, { credentials: 'include' }),
    staleTime: 0, // Always fetch fresh session data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 2,
  });

  if (isLoading) {
    return undefined;
  }

  const isLoggedIn = !!session?.data?.user;
  if (!isLoggedIn) {
    return undefined;
  }

  return session?.data?.session?.activeOrganizationId;
};

// Hook to take action on a job application (accept/reject)
export const useTakeApplicationAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, actionData }: { organizationId: string; actionData: ApplicationActionRequest }) =>
      jobsApi.takeApplicationAction(organizationId, actionData),
    onSuccess: async (response, { organizationId, actionData }) => {
      // Invalidate and refetch applications queries to update the UI
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: jobsQueryKeys.applications(organizationId, actionData.applicationId) }),
        queryClient.invalidateQueries({ queryKey: jobsQueryKeys.byOrg(organizationId) }),
      ]);

      // Show success toast based on action
      const actionType = actionData.action === 'accept' ? 'accepted' : 'rejected';
      const statusType = actionData.applicationStatus === 'Hired' ? 'hired' : 'rejected';
      
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

// Export types for use in components
export type { CreateJobRequest, JobPosting, JobApplication, ApplicationActionRequest }; 