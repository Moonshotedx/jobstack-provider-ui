import React, { useState, useEffect } from 'react';
import RoleSelectionStep from './postJob/RoleSelectionStep';
import RJSFJobPostStep from './postJob/RJSFJobPostStep';
import type { PostJobDialogProps, JobPostStep as StepType } from '@/types/jobPost';
import type { LocationData } from './postJob/LocationField';
import { toast } from 'sonner';
import { useCreateJob, useUpdateJob, useActiveOrganizationId } from '@/hooks/useJobsApi';
import type { JobRoleName } from '@/lib/role-schema-loader';
import { getRoleDisplayInfo } from '@/lib/role-schema-loader';

const PostJobDialog: React.FC<PostJobDialogProps> = ({ isOpen, onClose, skipAuthSteps = false, editJobData }) => {
  const [step, setStep] = useState<StepType>(
    // If editing a job, skip role selection and go directly to job form
    editJobData ? 'jobPost' : (skipAuthSteps ? 'roleSelection' : 'login')
  );
  const [selectedJobRole, setSelectedJobRole] = useState<JobRoleName | null>(
    editJobData?.metadata?.role || null
  );
  
  // Debug logging for edit flow
  useEffect(() => {
    if (editJobData) {
      console.log('🔧 Edit Job Data:', editJobData);
      console.log('🎯 Job Role from metadata:', editJobData.metadata?.role);
      console.log('📋 Selected Job Role:', selectedJobRole);
      
      // Ensure we have a job role when editing - check multiple possible locations
      if (!selectedJobRole) {
        let jobRole = null;
        
        // Try to get role from different possible locations
        if (editJobData.metadata?.role) {
          jobRole = editJobData.metadata.role;
        } else if (editJobData.metadata?.jobDetails?.role) {
          jobRole = editJobData.metadata.jobDetails.role;
        } else if (editJobData.metadata?.basicInfo?.role) {
          jobRole = editJobData.metadata.basicInfo.role;
        } else if (editJobData.title) {
          // Fallback: try to extract role from title
          const title = editJobData.title.toLowerCase();
          if (title.includes('tailor')) {
            jobRole = 'Industrial Tailor';
          } else if (title.includes('warehouse') || title.includes('loader') || title.includes('picker')) {
            jobRole = 'Warehouse Loader and Picker';
          } else if (title.includes('sales') || title.includes('executive')) {
            jobRole = 'Field Sales Executive';
          } else if (title.includes('promoter') || title.includes('store')) {
            jobRole = 'In Store Promoter';
          } else if (title.includes('recruitment') || title.includes('associate')) {
            jobRole = 'Recruitment Associate';
          }
        }
        
        if (jobRole) {
          console.log('🔄 Setting job role from edit data:', jobRole);
          setSelectedJobRole(jobRole);
        } else {
          console.error('❌ Could not determine job role from edit data');
        }
      }
    }
  }, [editJobData, selectedJobRole]);

  // Reset selectedJobRole when editJobData changes to prevent caching issues
  useEffect(() => {
    if (editJobData) {
      // Reset selectedJobRole to null first to force re-evaluation
      setSelectedJobRole(null);
      
      // Then extract the new job role
      let jobRole = null;
      
      // Try to get role from different possible locations
      if (editJobData.metadata?.role) {
        jobRole = editJobData.metadata.role;
      } else if (editJobData.metadata?.jobDetails?.role) {
        jobRole = editJobData.metadata.jobDetails.role;
      } else if (editJobData.metadata?.basicInfo?.role) {
        jobRole = editJobData.metadata.basicInfo.role;
      } else if (editJobData.title) {
        // Fallback: try to extract role from title
        const title = editJobData.title.toLowerCase();
        if (title.includes('tailor')) {
          jobRole = 'Industrial Tailor';
        } else if (title.includes('warehouse') || title.includes('loader') || title.includes('picker')) {
          jobRole = 'Warehouse Loader and Picker';
        } else if (title.includes('sales') || title.includes('executive')) {
          jobRole = 'Field Sales Executive';
        } else if (title.includes('promoter') || title.includes('store')) {
          jobRole = 'In Store Promoter';
        } else if (title.includes('recruitment') || title.includes('associate')) {
          jobRole = 'Recruitment Associate';
        }
      }
      
      if (jobRole) {
        console.log('🔄 Updating job role for new edit job:', jobRole);
        setSelectedJobRole(jobRole);
      } else {
        console.error('❌ Could not determine job role from new edit data');
      }
    }
  }, [editJobData]);
  
  // Cleanup when dialog closes
  useEffect(() => {
    if (!isOpen) {
      console.log('🧹 Cleaning up PostJobDialog state when dialog closes');
      setSelectedJobRole(null);
      setStep(editJobData ? 'jobPost' : (skipAuthSteps ? 'roleSelection' : 'login'));
    }
  }, [isOpen, editJobData, skipAuthSteps]);
  
  // API hooks
  const createJobMutation = useCreateJob();
  const updateJobMutation = useUpdateJob();
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

  const handleBackOrCancel = () => {
    if (editJobData) {
      // When editing, back button should close the dialog
      onClose();
    } else {
      // When creating new job, go back to role selection
      handleBackToRoleSelection();
    }
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

  const handleJobSubmit = async (formData: any, status: 'open' | 'draft' = 'open') => {
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
          status: status, // Use the passed status instead of hardcoded 'active'
          // Keep original jobProviderLocation in metadata for reference
          jobProviderLocation: formData.basicInfo?.jobProviderLocation
        }
      };

      console.log('🚀 Submitting job with payload:', createJobRequest);

      if (editJobData) {
        // Update existing job using the API
        await updateJobMutation.mutateAsync({
          organizationId: activeOrganizationId,
          jobId: editJobData.id,
          jobData: createJobRequest,
        });
        
        const successMessage = status === 'open' 
          ? `${selectedJobRole} job updated successfully!`
          : `${selectedJobRole} job saved as draft!`;
        toast.success(successMessage);
        
        // Close dialog and reset form after successful update
        onClose();
        resetForm();
      } else {
        // Submit the job using the API
        await createJobMutation.mutateAsync({
          organizationId: activeOrganizationId,
          jobData: createJobRequest,
        });
        
        const successMessage = status === 'open' 
          ? `${selectedJobRole} job posted successfully!`
          : `${selectedJobRole} job saved as draft!`;
        toast.success(successMessage);
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
    setStep(editJobData ? 'jobPost' : (skipAuthSteps ? 'roleSelection' : 'login'));
  };

  // Role Selection Step
  if (step === 'roleSelection') {
    // Skip role selection if we're editing and have a job role
    if (editJobData && selectedJobRole) {
      console.log('⏭️ Skipping role selection for edit mode, going directly to job form');
      setStep('jobPost');
      return null;
    }
    
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
        key={`job-post-${selectedJobRole}-${editJobData?.id || 'new'}`}
        isOpen={isOpen}
        onClose={onClose}
        selectedJobRole={selectedJobRole}
        onSubmit={handleJobSubmit}
        onBack={handleBackOrCancel}
        isSubmitting={editJobData ? updateJobMutation.isPending : createJobMutation.isPending}
        editJobData={editJobData}
      />
    );
  }

  // For now, if step is not implemented, show a placeholder
  // TODO: Implement other steps (login, orgProfile)
  return null;
};

export default PostJobDialog; 