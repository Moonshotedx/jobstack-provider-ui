import React, { useState } from 'react';
import RoleSelectionStep from './postJob/RoleSelectionStep';
import RJSFJobPostStep from './postJob/RJSFJobPostStep';
import type { PostJobDialogProps, JobPostStep as StepType } from '@/types/jobPost';
import { toast } from 'sonner';
import { useCreateJob, useActiveOrganizationId } from '@/hooks/useJobsApi';
import type { JobRoleName } from '@/lib/role-schema-loader';
import { getRoleDisplayInfo } from '@/lib/role-schema-loader';

const PostJobDialog: React.FC<PostJobDialogProps> = ({ isOpen, onClose, skipAuthSteps = false }) => {
  const [step, setStep] = useState<StepType>(
    skipAuthSteps ? 'roleSelection' : 'login'
  );
  const [selectedJobRole, setSelectedJobRole] = useState<JobRoleName | null>(null);
  
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
      
      // Extract address from jobProviderLocation in basicInfo
      const jobProviderLocation = formData.basicInfo?.jobProviderLocation || '';
      
      if (!jobProviderLocation) {
        toast.error('Job Provider Location is required.');
        return;
      }
      
      // Transform RJSF form data to match backend API
      const createJobRequest = {
        title: formData.jobDetails?.title || formData.basicInfo?.title || selectedJobRole,
        description: formData.jobDescription?.description || '',
        location: {
          address: jobProviderLocation, // Use jobProviderLocation as main address
          city: '',
          state: '',
          country: 'India',
          gps: { lat: 0, lng: 0 }
        },
        metadata: {
          ...formData,
          role: selectedJobRole,
          industry: roleInfo.industry,
          status: 'active',
          applicationsCount: 0,
          // Also keep jobProviderLocation in metadata for reference
          jobProviderLocation: jobProviderLocation
        }
      };

      console.log('🚀 Submitting job with payload:', createJobRequest);

      // Submit the job using the API
      await createJobMutation.mutateAsync({
        organizationId: activeOrganizationId,
        jobData: createJobRequest,
      });

      // Close dialog and reset form after successful creation
      onClose();
      resetForm();
      toast.success(`${selectedJobRole} job posted successfully!`);
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
      />
    );
  }

  // For now, if step is not implemented, show a placeholder
  // TODO: Implement other steps (login, orgProfile)
  return null;
};

export default PostJobDialog; 