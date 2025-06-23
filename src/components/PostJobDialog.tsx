import React, { useState } from 'react';
import RoleSelectionStep from './postJob/RoleSelectionStep';
import JobPostStep from './postJob/JobPostStep';
import type { PostJobDialogProps, JobPostStep as StepType, JobData, OrgData } from '@/types/jobPost';
import { toast } from 'sonner';

const PostJobDialog: React.FC<PostJobDialogProps> = ({ isOpen, onClose, skipAuthSteps = false }) => {
  const [step, setStep] = useState<StepType>(
    skipAuthSteps ? 'roleSelection' : 'login'
  );
  const [selectedJobRole, setSelectedJobRole] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  
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

  const handleJobSubmit = () => {
    console.log('Submitting job:', jobData);
    toast.success("Job posted successfully!");
    onClose();
    
    // Reset form
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
      />
    );
  }

  // For now, if step is not implemented, show a placeholder
  // TODO: Implement other steps (login, orgProfile)
  return null;
};

export default PostJobDialog; 