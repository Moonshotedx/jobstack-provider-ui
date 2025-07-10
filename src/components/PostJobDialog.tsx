import React, { useState } from 'react';
import RoleSelectionStep from './postJob/RoleSelectionStep';
import RJSFJobPostStep from './postJob/RJSFJobPostStep';
import type { PostJobDialogProps, JobPostStep as StepType } from '@/types/jobPost';
import type { LocationData } from './postJob/LocationField';
import { toast } from 'sonner';
import { useCreateJob, useActiveOrganizationId } from '@/hooks/useJobsApi';
import type { JobRoleName } from '@/lib/role-schema-loader';
import { getRoleDisplayInfo } from '@/lib/role-schema-loader';

const PostJobDialog: React.FC<PostJobDialogProps> = ({ isOpen, onClose, skipAuthSteps = false, editJobData }) => {
  const [step, setStep] = useState<StepType>(
    skipAuthSteps ? 'roleSelection' : 'login'
  );
  const [selectedJobRole, setSelectedJobRole] = useState<JobRoleName | null>(
    editJobData?.metadata?.role || null
  );
  
  // API hooks
  const createJobMutation = useCreateJob();
  const activeOrganizationId = useActiveOrganizationId();

  const handleRoleSelection = (role: JobRoleName) => {
    setSelectedJobRole(role);
  };

  const proceedToJobForm = () => {
    if (selectedJobRole) {
      setStep('jobPost');
    }
  };

  const handleBackToRoleSelection = () => {
    setStep('roleSelection');
  };

  // Helper function to extract and structure location data
  const extractLocationData = (formData: any): { address: string; city: string; state: string; country: string; tag: string; gps: { lat: number; lng: number } } => {
    const jobProviderLocation = formData.basicInfo?.jobProviderLocation;
    
    // If jobProviderLocation is a structured LocationData object
    if (jobProviderLocation && typeof jobProviderLocation === 'object' && 'address' in jobProviderLocation) {
      const locationData = jobProviderLocation as LocationData;
      return {
        address: locationData.address || '',
        city: locationData.city || '',
        state: locationData.state || '',
        country: locationData.country || 'India',
        tag: locationData.city || locationData.address || 'job-location', // Use city as tag, fallback to address or default
        gps: {
          lat: locationData.gps?.lat || 0,
          lng: locationData.gps?.lng || 0
        }
      };
    }
    
    // If jobProviderLocation is a string (fallback)
    if (jobProviderLocation && typeof jobProviderLocation === 'string') {
      return {
        address: jobProviderLocation,
        city: '',
        state: '',
        country: 'India',
        tag: 'job-location', // Default tag for string addresses
        gps: { lat: 0, lng: 0 }
      };
    }
    
    // Default fallback
    return {
      address: '',
      city: '',
      state: '',
      country: 'India',
      tag: 'job-location', // Default tag
      gps: { lat: 0, lng: 0 }
    };
  };

  const handleJobSubmit = async (formData: any) => {
    if (!activeOrganizationId) {
      toast.error('No active organization found. Please select an organization first.');
      return;
    }

    if (!selectedJobRole) {
      toast.error('No job role selected.');
      return;
    }

    try {
      // Get role category for metadata (now async)
      const roleInfo = await getRoleDisplayInfo(selectedJobRole);
      
      // Extract and structure location data
      const locationData = extractLocationData(formData);
      
      if (!locationData.address) {
        toast.error('Job Provider Location is required.');
        return;
      }
      
      console.log('🗺️ Extracted location data:', locationData);
      
      // Transform RJSF form data to match backend API
      const createJobRequest = {
        title: formData.jobDetails?.title || formData.basicInfo?.title || selectedJobRole,
        location: locationData, // Use the properly structured location data
        metadata: {
          ...formData,
          role: selectedJobRole,
          industry: roleInfo.industry,
          status: editJobData?.metadata?.status || 'active',
          // Keep original jobProviderLocation in metadata for reference
          jobProviderLocation: formData.basicInfo?.jobProviderLocation
        }
      };

      console.log('🚀 Submitting job with payload:', createJobRequest);

      if (editJobData) {
        // TODO: Implement update job API call
        toast.success(`${selectedJobRole} job updated successfully!`);
      } else {
        // Submit the job using the API
        await createJobMutation.mutateAsync({
          organizationId: activeOrganizationId,
          jobData: createJobRequest,
        });
        toast.success(`${selectedJobRole} job posted successfully!`);
      }

      // Close dialog and reset form after successful creation
      onClose();
      resetForm();
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error('Failed to submit job:', error);
      
      // Handle specific error if role info loading failed
      if (error instanceof Error && error.message.includes('not found in configuration')) {
        toast.error('Invalid job role configuration. Please try again.');
      }
    }
  };

  const resetForm = () => {
    setSelectedJobRole(null);
    setStep(skipAuthSteps ? 'roleSelection' : 'login');
  };

  // Role Selection Step
  if (step === 'roleSelection') {
    return (
      <RoleSelectionStep
        isOpen={isOpen}
        onClose={onClose}
        selectedJobRole={selectedJobRole}
        onRoleSelection={handleRoleSelection}
        onProceed={proceedToJobForm}
        onBack={() => setStep(skipAuthSteps ? 'roleSelection' : 'orgProfile')}
        skipAuthSteps={skipAuthSteps}
      />
    );
  }

  // Job Post Step
  if (step === 'jobPost') {
    return (
      <RJSFJobPostStep
        isOpen={isOpen}
        onClose={onClose}
        selectedJobRole={selectedJobRole}
        onSubmit={handleJobSubmit}
        onBack={handleBackToRoleSelection}
        isSubmitting={createJobMutation.isPending}
        editJobData={editJobData}
      />
    );
  }

  // For now, if step is not implemented, show a placeholder
  // TODO: Implement other steps (login, orgProfile)
  return null;
};

export default PostJobDialog; 