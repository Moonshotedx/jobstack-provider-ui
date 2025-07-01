import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { jobsApi, type CreateJobRequest, type JobPosting } from '@/lib/api-client';
import { authClient } from '@/lib/auth-client';

// Query keys for cache management
export const jobsQueryKeys = {
  all: ['jobs'] as const,
  byOrg: (orgId: string) => ['jobs', orgId] as const,
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

// Export types for use in components
export type { CreateJobRequest, JobPosting }; 