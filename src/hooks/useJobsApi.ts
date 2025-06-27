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
    staleTime: 5 * 60 * 1000, // 5 minutes
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
      console.error('Failed to create job:', error);
      
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
  const { data: session, isLoading, error } = useQuery({
    queryKey: ['session'],
    queryFn: () => authClient.getSession(),
    staleTime: 5 * 60 * 1000,
  });

  // Debug logging
  console.log('Session debug:', {
    isLoading,
    error,
    sessionData: session,
    fullSessionStructure: JSON.stringify(session, null, 2)
  });

  // Access the correct path based on the session structure
  const activeOrgId = session?.data?.session?.activeOrganizationId;

  console.log('Active organization ID:', activeOrgId);

  return useGetJobs(activeOrgId || '');
};

// Hook to get active organization ID
export const useActiveOrganizationId = () => {
  const { data: session, isLoading, error } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      console.log('Fetching session...');
      const sessionData = await authClient.getSession();
      console.log('Raw session response:', sessionData);
      return sessionData;
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  // Debug logging
  console.log('useActiveOrganizationId debug:', {
    isLoading,
    error,
    hasSessionData: !!session,
    sessionDataKeys: session ? Object.keys(session) : [],
    fullSessionStructure: JSON.stringify(session, null, 2)
  });

  // Check if user is actually logged in
  const isLoggedIn = !!session?.data?.user;
  const activeOrgId = session?.data?.session?.activeOrganizationId;

  console.log('Authentication status:', {
    isLoggedIn,
    hasUser: !!session?.data?.user,
    hasSession: !!session?.data?.session,
    activeOrgId,
    userEmail: session?.data?.user?.email
  });

  if (!isLoggedIn) {
    console.warn('User is not logged in - no session found');
    return undefined;
  }

  if (!activeOrgId) {
    console.warn('No active organization ID found in session');
  }

  return activeOrgId;
};

// Export types for use in components
export type { CreateJobRequest, JobPosting }; 