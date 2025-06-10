// src/hooks/useUserMetadata.ts
import { useQuery } from '@tanstack/react-query';
import Session from 'supertokens-web-js/recipe/session';

export const useUserMetadata = () => {
  return useQuery({
    queryKey: ['userMetadata'],
    queryFn: async () => {
      // Only fetch if user is logged in
      if (await Session.doesSessionExist()) {
        return fetchUserMetadata();
      }
      return null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });
};

export const fetchUserMetadata = async () => {
  const response = await fetch(
    `${import.meta.env.VITE_API_ENDPOINT}/api/v1/user/metadata`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // SuperTokens will automatically add the session tokens
      },
      credentials: 'include', // Important for session cookies
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch user metadata');
  }

  return response.json();
};
