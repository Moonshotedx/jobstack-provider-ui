import { authClient } from '@/lib/auth-client';
import { useQuery } from '@tanstack/react-query';

export const useUserSession = () => {
  return useQuery({
    queryKey: ['userSession'],
    queryFn: async () => {
      const listSessions = await authClient.listSessions();

      if (!listSessions.data) {
        throw new Error(listSessions.error?.message || 'No sessions found');
      }

      const session = await authClient.getSession();

      if (session.error) {
        throw new Error(session.error.message);
      }

      if (!session.data?.user) {
        throw new Error('User not found in session');
      }

      return session.data.user;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2, // retry up to 2 times on failure
  });
};
