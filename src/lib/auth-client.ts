import { createAuthClient } from 'better-auth/react';
import { organizationClient } from 'better-auth/client/plugins';

export const authClient = createAuthClient({
  /** The base URL of the server (optional if you're using the same domain) */
  baseURL: 'http://localhost:3001',
  basePath: 'api/v1/auth',
  plugins: [organizationClient()],
});

export const checkSession = async () => {
  return await authClient.getSession();
};

export const fetchUser = async () => {};

export const createOrganisation = async (orgInfo: {
  name: string;
  slug: string;
  logo: string;
}) => {
  await authClient.organization.create(orgInfo);
};
