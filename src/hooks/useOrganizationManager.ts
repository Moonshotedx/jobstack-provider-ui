import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';
import { useUserStore } from '@/stores/authStore';
import { toast } from 'sonner';

export interface OrganizationWithMetadata {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  // Extended metadata
  address?: string;
  gstNumber?: string;
  contactPersonName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  description?: string;
  isActive?: boolean;
}

export const useOrganizationManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { updateProfile } = useUserStore();
  const queryClient = useQueryClient();

  // Load organization metadata from better-auth
  const loadOrganizationMetadata = useCallback((org: any) => {
    if (org.metadata) {
      try {
        // If metadata is already an object, return it directly
        // If it's a string, parse it
        return typeof org.metadata === 'string' ? JSON.parse(org.metadata) : org.metadata;
      } catch (error) {
        return {};
      }
    }
    return {};
  }, []);

  // Get organizations with metadata
  const getOrganizationsWithMetadata = useCallback(async (): Promise<OrganizationWithMetadata[]> => {
    try {
      const orgList = await authClient.organization.list({}, { credentials: 'include' });
      if (orgList.error) {
        throw new Error(orgList.error.message);
      }

      const organizations = orgList.data || [];
      return organizations.map(org => ({
        ...org,
        ...loadOrganizationMetadata(org) // Load from better-auth metadata
      }));
    } catch (error) {
      return [];
    }
  }, [loadOrganizationMetadata]);

  // Set active organization
  const setActiveOrganization = useCallback(async (orgId: string) => {
    setIsLoading(true);
    try {
      const result = await authClient.organization.setActive({ organizationId: orgId }, { credentials: 'include' });
      if (result.error) {
        throw new Error(result.error.message);
      }

      // Get organization data from the list instead of non-existent getFullOrganization
      const orgListResponse = await authClient.organization.list({}, { credentials: 'include' });
      if (orgListResponse.error) {
        throw new Error(orgListResponse.error.message);
      }
      
      const organizations = orgListResponse.data || [];
      const selectedOrg = organizations.find(org => org.id === orgId);
      
      if (selectedOrg) {
        const metadata = loadOrganizationMetadata(selectedOrg);
        
        const organizationProfile = {
          name: selectedOrg.name || '',
          address: metadata.address || '',
          gstNumber: metadata.gstNumber || '',
          logo: selectedOrg.logo || '',
          contactPersonName: metadata.contactPersonName || '',
          contactEmail: metadata.contactEmail || '',
          contactPhone: metadata.contactPhone || '',
          website: metadata.website || '',
          description: metadata.description || ''
        };
        updateProfile(organizationProfile);
        
        // Invalidate session and jobs queries to reflect the new active organization
        await queryClient.invalidateQueries({ queryKey: ['session'] });
        await queryClient.invalidateQueries({ queryKey: ['jobs'] });
        
        toast.success(`Organization "${selectedOrg.name}" is now active`);
        return selectedOrg;
      } else {
        throw new Error('Organization not found');
      }
    } catch (error: any) {
      toast.error('Failed to set active organization', {
        description: error.message
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loadOrganizationMetadata, updateProfile]);

  return {
    isLoading,
    getOrganizationsWithMetadata,
    setActiveOrganization,
    loadOrganizationMetadata
  };
}; 