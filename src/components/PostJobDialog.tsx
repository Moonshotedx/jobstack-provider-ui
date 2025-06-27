import React, { useState } from 'react';
import RoleSelectionStep from './postJob/RoleSelectionStep';
import JobPostStep from './postJob/JobPostStep';
import type { PostJobDialogProps, JobPostStep as StepType, JobData, OrgData } from '@/types/jobPost';
import { transformJobDataToCreateJobRequest } from '@/types/jobPost';
import { toast } from 'sonner';
import { useCreateJob, useActiveOrganizationId } from '@/hooks/useJobsApi';

const PostJobDialog: React.FC<PostJobDialogProps> = ({ isOpen, onClose, skipAuthSteps = false }) => {
  const [step, setStep] = useState<StepType>(
    skipAuthSteps ? 'roleSelection' : 'login'
  );
  const [selectedJobRole, setSelectedJobRole] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  
  // API hooks
  const createJobMutation = useCreateJob();
  const activeOrganizationId = useActiveOrganizationId();
  
  const [jobData, setJobData] = useState<JobData>({
    title: '',
    location: '',
    jobType: '',
    salary: '',
    payFrequency: '',
    workTimings: '',
    experience: '',
    description: '',
    requirements: [''],
    benefits: [''],
    documentsRequired: [],
    questions: [''],
    positions: 1,
    lastDate: '',
    workDays: '',
    overtime: '',
    overtimePay: '',
    education: '',
    tailorSkills: {
      electricSewingMachine: false,
      machineControl: false,
      stitchFastStraightLine: false
    },
    factoryEnvironment: {
      computedTrustScore: false,
      videoWalkthrough: false,
      videoTestimonial: false,
      videoWalkthroughFile: null,
      videoTestimonialFile: null
    },
    industrialTailorDetails: {
      employmentType: '',
      salaryDisbursementFrequency: '',
      salaryCTC: 0,
      fixedAnnual: 0,
      overtime: '',
      overtimeTerms: '',
      minimumOvertimeCommitted: 0,
      monthlyInHand: 0,
      monthlyPfEsicBenefits: 0,
      monthlyPfEsicExplanation: '',
      salaryAdvanceFacility: '',
      salaryAdvanceTerms: '',
      officePhotos: [],
      testimonialVideos: [],
      weeklyHolidays: '',
      weeklyHolidaysOther: '',
      workingMode: '',
      regionalScope: '',
      genderSpecific: '',
      ageRangeAllowed: ''
    },
    hiringManager: {
      managerName: '',
      phoneNo: '',
      emailId: ''
    }
  });

  const [orgData, setOrgData] = useState<OrgData>({
    name: '',
    address: '',
    gst: '',
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    description: ''
  });

  const handleRoleSelection = (role: string, industry: string) => {
    setSelectedJobRole(role);
    setSelectedIndustry(industry);
  };

  const proceedToJobForm = () => {
    // Pre-populate job title with selected role
    setJobData(prev => ({ ...prev, title: selectedJobRole }));
    setStep('jobPost');
  };

  const handleBackToRoleSelection = () => {
    setStep('roleSelection');
  };

  const handleLogin = () => {
    setStep('orgProfile');
  };

  const handleOrgProfileSubmit = () => {
    setStep('roleSelection');
  };

  const handleJobSubmit = async () => {
    console.log('handleJobSubmit called');
    console.log('activeOrganizationId:', activeOrganizationId);
    
    if (!activeOrganizationId) {
      console.error('No active organization ID found');
      toast.error('No active organization found. Please select an organization first.');
      return;
    }

    try {
      // Transform the job data to match the backend API
      const createJobRequest = transformJobDataToCreateJobRequest(
        jobData,
        selectedIndustry,
        selectedJobRole
        // Note: We're not handling location data yet - can be added later
      );

      console.log('Submitting job request:', {
        organizationId: activeOrganizationId,
        jobData: createJobRequest
      });

      // Submit the job using the API
      await createJobMutation.mutateAsync({
        organizationId: activeOrganizationId,
        jobData: createJobRequest,
      });

      // Close dialog and reset form on success
      onClose();
      resetForm();
    } catch (error) {
      // Error handling is done in the mutation hook
      console.error('Failed to submit job:', error);
    }
  };

  const resetForm = () => {
    setJobData({
      title: '',
      location: '',
      jobType: '',
      salary: '',
      payFrequency: '',
      workTimings: '',
      experience: '',
      description: '',
      requirements: [''],
      benefits: [''],
      documentsRequired: [],
      questions: [''],
      positions: 1,
      lastDate: '',
      workDays: '',
      overtime: '',
      overtimePay: '',
      education: '',
      tailorSkills: {
        electricSewingMachine: false,
        machineControl: false,
        stitchFastStraightLine: false
      },
      factoryEnvironment: {
        computedTrustScore: false,
        videoWalkthrough: false,
        videoTestimonial: false,
        videoWalkthroughFile: null,
        videoTestimonialFile: null
      },
      industrialTailorDetails: {
        employmentType: '',
        salaryDisbursementFrequency: '',
        salaryCTC: 0,
        fixedAnnual: 0,
        overtime: '',
        overtimeTerms: '',
        minimumOvertimeCommitted: 0,
        monthlyInHand: 0,
        monthlyPfEsicBenefits: 0,
        monthlyPfEsicExplanation: '',
        salaryAdvanceFacility: '',
        salaryAdvanceTerms: '',
        officePhotos: [],
        testimonialVideos: [],
        weeklyHolidays: '',
        weeklyHolidaysOther: '',
        workingMode: '',
        regionalScope: '',
        genderSpecific: '',
        ageRangeAllowed: ''
      },
      hiringManager: {
        managerName: '',
        phoneNo: '',
        emailId: ''
      }
    });
    setSelectedJobRole('');
    setSelectedIndustry('');
    setStep(skipAuthSteps ? 'roleSelection' : 'login');
  };

  // Role Selection Step
  if (step === 'roleSelection') {
    return (
      <RoleSelectionStep
        isOpen={isOpen}
        onClose={onClose}
        selectedJobRole={selectedJobRole}
        selectedIndustry={selectedIndustry}
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
      <JobPostStep
        isOpen={isOpen}
        onClose={onClose}
        selectedJobRole={selectedJobRole}
        selectedIndustry={selectedIndustry}
        jobData={jobData}
        setJobData={setJobData}
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