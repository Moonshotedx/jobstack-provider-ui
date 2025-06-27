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
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000, // Reduced to 2 minutes for more frequent updates
    retry: 2,
  });
};

// Hook to create a new job
export const useCreateJob = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ organizationId, jobData }: { organizationId: string; jobData: CreateJobRequest }) =>
      jobsApi.createJob(organizationId, jobData),
    onSuccess: (newJob, { organizationId }) => {
      // Invalidate and refetch jobs for this organization
      queryClient.invalidateQueries({ queryKey: jobsQueryKeys.byOrg(organizationId) });
      
      // Optionally update the cache directly
      queryClient.setQueryData<JobPosting[]>(
        jobsQueryKeys.byOrg(organizationId),
        (oldData) => {
          if (oldData) {
            return [newJob, ...oldData];
          }
          return [newJob];
        }
      );

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
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: () => authClient.getSession(),
    staleTime: 30 * 1000, // Reduced to 30 seconds
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  // Access the correct path based on the session structure
  const activeOrgId = session?.data?.session?.activeOrganizationId;

  return useGetJobs(activeOrgId || '');
};

// Hook to get active organization ID
export const useActiveOrganizationId = () => {
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const sessionData = await authClient.getSession();
      return sessionData;
    },
    staleTime: 30 * 1000, // Reduced to 30 seconds
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  // Check if user is actually logged in
  const isLoggedIn = !!session?.data?.user;
  const activeOrgId = session?.data?.session?.activeOrganizationId;

  if (!isLoggedIn) {
    return undefined;
  }

  return activeOrgId;
};

// Export types for use in components
export type { CreateJobRequest, JobPosting }; 