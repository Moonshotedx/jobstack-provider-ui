import type { JobPosting } from '@/lib/api-client';

export type JobPostStep = 'login' | 'orgProfile' | 'roleSelection' | 'jobPost';

export interface JobData {
  title: string;
  location: string;
  jobType: string;
  salary: string;
  payFrequency: string;
  workTimings: string;
  experience: string;
  description: string;
  requirements: string[];
  benefits: string[];
  documentsRequired: string[];
  questions: string[];
  positions: number;
  lastDate: string;
  workDays: string;
  // Job Provider Information
  jobProviderName: string;
  jobProviderRegistration: string;
  jobProviderLogo?: File | null;
  // Overtime fields for Textile -> Tailor role
  overtime?: string;
  overtimePay?: string;
  // Education field for Textile -> Tailor role
  education?: string;
  // Skills fields for Textile -> Tailor role
  tailorSkills?: {
    electricSewingMachine: boolean;
    machineControl: boolean;
    stitchFastStraightLine: boolean;
  };
  // Factory Environment fields for Textile -> Tailor role
  factoryEnvironment?: {
    computedTrustScore: boolean;
    videoWalkthrough: boolean;
    videoTestimonial: boolean;
    videoWalkthroughFile?: File | null;
    videoTestimonialFile?: File | null;
  };
  // New fields for Industrial Tailor role
  industrialTailorDetails?: {
    // Employment Type
    employmentType?: string;
    // Salary details
    salaryDisbursementFrequency?: string;
    salaryCTC?: number;
    fixedAnnual?: number;
    overtime?: string;
    overtimeTerms?: string;
    minimumOvertimeCommitted?: number;
    monthlyInHand?: number;
    monthlyPfEsicBenefits?: number;
    monthlyPfEsicExplanation?: string;
    // Salary advance
    salaryAdvanceFacility?: string;
    salaryAdvanceTerms?: string;
    // Media uploads
    officePhotos?: Array<{
      file: File;
      description: string;
    }>;
    testimonialVideos?: Array<{
      file: File;
      description: string;
    }>;
    // Work details
    weeklyHolidays?: string;
    weeklyHolidaysOther?: string;
    workingMode?: string;
    regionalScope?: string;
    genderSpecific?: string;
    ageRangeAllowed?: string;
    // New fields for revised Industrial Tailor form
    jobDetailsVideo?: File;
    jobLocationPhotos?: File[];
    workingHoursPerDay?: number;
    monthlyAverageOT?: string;
    stayProvided?: string;
    costPerSharingBed?: string;
    // Job Needs section
    ageAllowedLowerLimit?: number;
    ageAllowedUpperLimit?: number;
    sampleTaskVideo?: File;
    sampleTaskImage?: File;
    speedBenchmarkMins?: number;
    proofsAcceptableForIntentToJoin?: string;
  };
  // Hiring Manager Details
  hiringManager: {
    managerName: string;
    phoneNo: string;
    emailId: string;
  };
}

export interface OrgData {
  name: string;
  address: string;
  gst: string;
  contactPerson: string;
  email: string;
  phone: string;
  website: string;
  description: string;
}

export interface PostJobDialogProps {
  isOpen: boolean;
  onClose: () => void;
  skipAuthSteps?: boolean;
  editJobData?: JobPosting | null;
}

// Location data structure to match backend schema
export interface LocationData {
  address: string;
  city: string;
  state: string;
  country: string;
  tag: string; // Required by backend for location categorization
  gps: {
    lat: number;
    lng: number;
  };
}

// Utility function to transform frontend JobData to backend CreateJobRequest
export const transformJobDataToCreateJobRequest = (
  jobData: JobData,
  selectedIndustry: string,
  selectedJobRole: string,
  locationData?: LocationData
) => {
  // Build metadata object with all additional job information
  const metadata: Record<string, any> = {
    // Basic job information
    location: jobData.location,
    jobType: jobData.jobType,
    salary: jobData.salary,
    payFrequency: jobData.payFrequency,
    workTimings: jobData.workTimings,
    experience: jobData.experience,
    requirements: jobData.requirements.filter(req => req.trim() !== ''),
    benefits: jobData.benefits.filter(benefit => benefit.trim() !== ''),
    documentsRequired: jobData.documentsRequired,
    questions: jobData.questions.filter(q => q.trim() !== ''),
    positions: jobData.positions,
    lastDate: jobData.lastDate,
    workDays: jobData.workDays,
    
    // Job Provider Information
    jobProviderName: jobData.jobProviderName,
    jobProviderRegistration: jobData.jobProviderRegistration,
    // Note: jobProviderLogo will need to be handled separately as file upload
    
    // Industry and role information
    industry: selectedIndustry,
    role: selectedJobRole,
    
    // Hiring manager details
    hiringManager: jobData.hiringManager,
  };

  // Add role-specific metadata
  if (selectedIndustry === 'Textile' && selectedJobRole === 'Tailor') {
    metadata.overtime = jobData.overtime;
    metadata.overtimePay = jobData.overtimePay;
    metadata.education = jobData.education;
    metadata.tailorSkills = jobData.tailorSkills;
    metadata.factoryEnvironment = jobData.factoryEnvironment;
  }

  if (selectedIndustry === 'Industrial Tailor' && selectedJobRole === 'Industrial Tailor') {
    metadata.industrialTailorDetails = jobData.industrialTailorDetails;
  }

  // Return the request object matching backend schema
  return {
    title: jobData.title,
    location: locationData,
    metadata,
  };
};

// New types for job applicants functionality
export interface JobApplicant {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  age: number;
  appliedFor: string;
  applicationDate: string;
  status: 'open' | 'closed' | 'applied' | 'reviewed' | 'shortlisted' | 'interview' | 'hired' | 'rejected' | 'archived';
  trustScore: number;
  matchScore: number;
  experience: string;
  skills: (string | { name: string; code?: string })[];
  avatar?: string;
  resume?: string;
  coverLetter?: string;
  expectedSalary?: string;
  noticePeriod?: string;
  currentCompany?: string;
  currentRole?: string;
  education?: string;
  languages?: string[];
  certifications?: string[];
  portfolio?: string;
  socialLinks?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
  applicationNotes?: string;
  interviewScheduled?: string;
  interviewNotes?: string;
  feedback?: string;
  lastContacted?: string;
  tags?: string[];
  // New fields for the updated API response
  whatIHave?: {
    age: number;
    qualityScore: number;
    stitchingSpeed: number;
    machinesOperated: string[];
    jukiMachineExperience: string;
    qualityScoreExplanation: string;
  };
  whatIWant?: {
    monthlyPFESIC: string;
    readyToMigrate: string;
    stayPreferences: string;
    workHoursPerDay: number;
    maxCostPerSharingBed: number;
    monthlyOTExpectation: number;
    monthlyInHandPreferred: number;
  };
  // Store the original application ID for API calls
  applicationId?: string;
}

export interface JobApplicantsListProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: string;
  jobTitle: string;
}

 