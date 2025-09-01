import { useState, useEffect } from 'react';
import { useGetOrganizationList } from './useJobsApi';

export interface OrganizationPrepopulationData {
  jobProviderName: string;
  jobProviderRegistration: string;
}

/**
 * Custom hook to fetch organization data and prepare prepopulation values
 * for job posting forms
 */
export const useOrganizationPrepopulation = () => {
  const [prepopulationData, setPrepopulationData] = useState<OrganizationPrepopulationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { data: organizations, isLoading: isOrgLoading, error: orgError } = useGetOrganizationList();

  useEffect(() => {
    if (isOrgLoading) {
      setIsLoading(true);
      return;
    }

    if (orgError) {
      setError('Failed to fetch organization data');
      setIsLoading(false);
      return;
    }

    if (!organizations || organizations.length === 0) {
      setError('No organizations found');
      setIsLoading(false);
      return;
    }

    try {
      // For now, use the first organization as the active one
      // In the future, this can be enhanced to use actual active organization selection
      const currentOrg = organizations[0];
      
      let metadata: any = {};
      
      // Parse metadata if it's a string
      if (currentOrg.metadata) {
        if (typeof currentOrg.metadata === 'string') {
          try {
            metadata = JSON.parse(currentOrg.metadata);
          } catch (parseError) {
            console.warn('Failed to parse organization metadata:', parseError);
            metadata = {};
          }
        } else {
          metadata = currentOrg.metadata;
        }
      }
      
      // Extract name and GST number for prepopulation
      const jobProviderName = currentOrg.name || '';
      
      // Get GST number from metadata, only use if it has a value other than empty or null
      let jobProviderRegistration = '';
      if (metadata.gstNumber && 
          metadata.gstNumber.trim() !== '' && 
          metadata.gstNumber.toLowerCase() !== 'null') {
        jobProviderRegistration = metadata.gstNumber.trim();
      }
      
      setPrepopulationData({
        jobProviderName,
        jobProviderRegistration
      });
      
      setError(null);
    } catch (err) {
      console.error('Error processing organization data:', err);
      setError('Failed to process organization data');
    } finally {
      setIsLoading(false);
    }
  }, [organizations, isOrgLoading, orgError]);

  return {
    prepopulationData,
    isLoading,
    error
  };
};
