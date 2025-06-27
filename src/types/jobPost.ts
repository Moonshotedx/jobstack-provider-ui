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
} 