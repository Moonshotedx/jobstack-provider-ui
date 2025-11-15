import { createAuthClient } from 'better-auth/react';
import { organizationClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: import.meta.env.VITE_API_ENDPOINT,
  basePath: 'api/v1/auth',
  plugins: [organizationClient()],
});

export const checkSession = async () => {
  return await authClient.getSession(undefined, { credentials: 'include' });
};

// Password reset functionality
export const forgetPassword = async (email: string) => {
  return await authClient.forgetPassword({
    email,
    redirectTo: `${window.location.origin}/auth/reset-password`,
  }, { credentials: 'include' });
};

export const resetPassword = async (token: string, password: string) => {
  return await authClient.resetPassword({
    token,
    newPassword: password,
  }, { credentials: 'include' });
};

export const createOrganisation = async (orgInfo: {
  name: string;
  slug: string;
  logo?: string;
  metadata?: any;
  type?: string;
}) => {
  try {
    // Import the API client dynamically to avoid circular dependencies
    const { default: apiClient } = await import('./api-client');
    
    // Create organization using the authenticated API client
    const createResponse = await apiClient.post('/auth/organization/create', {
      name: orgInfo.name,
      slug: orgInfo.slug,
      logo: orgInfo.logo,
      metadata: orgInfo.metadata,
      type: orgInfo.type,
    });

    return createResponse.data;
  } catch (error: any) {
    // If it's a slug taken error (409 or specific error message)
    if (error.response?.status === 409 || 
        error.response?.data?.message?.includes('already exists') ||
        error.response?.data?.message?.includes('slug')) {
      const error = new Error('Organization Identifier Already Exists');
      (error as any).code = 'SLUG_IS_TAKEN';
      throw error;
    }
    
    // If it's a 401 error, it means the user is not authenticated
    if (error.response?.status === 401) {
      throw new Error('Authentication required. Please log in again.');
    }
    
    // Re-throw other errors
    throw error;
  }
};
