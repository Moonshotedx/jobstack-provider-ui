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
}) => {
  const slugCheckResult = await authClient.organization.checkSlug({
    slug: orgInfo.slug,
  }, { credentials: 'include' });

  // Check if the API call failed
  if (slugCheckResult.error) {
    const error = new Error(`Slug check failed: ${slugCheckResult.error.message}`);
    // Preserve the error code if it exists
    if (slugCheckResult.error.code) {
      (error as any).code = slugCheckResult.error.code;
    }
    throw error;
  }

  // The response should be {"status": true} if slug is available
  // {"status": false} or falsy if slug is taken
  const isSlugAvailable = slugCheckResult.data?.status === true;

  if (!isSlugAvailable) {
    // Slug is taken, throw error with code
    const error = new Error('Organization Identifier Already Exists');
    (error as any).code = 'SLUG_IS_TAKEN';
    throw error;
  }

  // Slug is available, create organization
  const org = await authClient.organization.create({
    name: orgInfo.name,
    slug: orgInfo.slug,
    logo: orgInfo.logo,
    metadata: orgInfo.metadata,
  }, { credentials: 'include' });

  if (org.error) {
    const error = new Error(org.error.message);
    // Preserve the error code if it exists
    if (org.error.code) {
      (error as any).code = org.error.code;
    }
    throw error;
  }

  return org.data;
};
