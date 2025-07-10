import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { authClient } from './auth-client';

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_ENDPOINT + '/api/v1'; // TODO: remove this once we have a proper API endpoint

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // This is crucial for sending cookies
});

// Request interceptor to add auth headers
apiClient.interceptors.request.use(
  async (config) => {
    try {
      await authClient.getSession(undefined, { credentials: 'include' });
      // Don't add Authorization header - let cookies handle auth
    } catch (error) {
      // Silently handle session check errors in production
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access silently or with minimal logging
    }
    return Promise.reject(error);
  }
);

// Types for API requests/responses
export interface LocationData {
  address: string;
  city: string;
  state: string;
  country: string;
  tag: string;
  gps: {
    lat: number;
    lng: number;
  };
}

export interface CreateJobRequest {
  title: string;
  description?: string;
  location?: LocationData;
  metadata?: Record<string, any>;
}

export interface JobPosting {
  id: string;
  title: string;
  description: string;
  locationId: string | null;
  location: Record<string, any>;
  contact: Record<string, any>;
  metadata: Record<string, any>;
  organizationName: string;
  organizationId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  applicationsCount: string; // Real-time applications count from API
}

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export interface CreateJobResponse {
  jobPost: JobPosting;
}

export interface GetJobsResponse {
  jobs: JobPosting[];
  pagination: {
    page: number;
    limit: number;
  };
}

// Job Applications types
export interface JobApplication {
  id: string;
  jobId: string;
  status: 'open' | 'closed' | 'applied' | 'reviewed' | 'shortlisted' | 'interview' | 'hired' | 'rejected';
  appliedAt: string;
  userName: string;
  metadata: {
    id: string;
    age: string;
    name: string;
    tags: Array<{
      list: Array<{
        value: string;
        descriptor: {
          code: string;
          name: string;
        };
      }>;
      descriptor: {
        code: string;
        name: string;
      };
    }>;
    skills: string[];
    languages: Array<{
      code: string;
      name: string;
    }>;
    metadata?: {
      name: string;
      phone: string;
      skills: string[];
      whoIAm: {
        age: number;
        name: string;
        phone: string;
        location: string;
        isAgeVerified: boolean;
        isNameVerified: boolean;
        currentLocation: string;
        desiredLocation: string;
      };
      education: any[];
      whatIHave: {
        age: number;
        qualityScore: number;
        stitchingSpeed: number;
        machinesOperated: string[];
        jukiMachineExperience: string;
        qualityScoreExplanation: string;
      };
      whatIWant: {
        monthlyPFESIC: string;
        readyToMigrate: string;
        stayPreferences: string;
        workHoursPerDay: number;
        maxCostPerSharingBed: number;
        monthlyOTExpectation: number;
        monthlyInHandPreferred: number;
      };
      experience: any[];
      certificates: any[];
      isAgeVerified: boolean;
      interestedRole: string;
      isNameVerified: boolean;
      workExperience: any[];
      currentLocation: string;
      desiredLocation: string;
      interestedIndustry: string;
      skillCertifications: any[];
    };
  };
  contact: {
    email: string;
    phone: string;
  };
  location: {
    gps: {
      lat: number;
      lng: number;
    };
    city: {
      code: string;
      name: string;
    };
    state: {
      code: string;
      name: string;
    };
    address: string;
    country: {
      code: string;
      name: string;
    };
  };
}

export interface GetJobApplicationsResponse {
  applications: JobApplication[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// Application Action types
export interface ApplicationActionRequest {
  applicationId: string;
  applicationStatus: string;
  action: string;
}

export interface ApplicationActionResponse {
  success: boolean;
  message: string;
}

// Job API methods
export const jobsApi = {
  // Create a new job posting
  createJob: async (organizationId: string, jobData: CreateJobRequest): Promise<JobPosting> => {
    const response = await apiClient.post<ApiResponse<CreateJobResponse>>(
      `/jobs/${organizationId}`,
      jobData
    );
    return response.data.data.jobPost;
  },

  // Get all job postings for an organization
  getJobs: async (organizationId: string): Promise<JobPosting[]> => {
    const response = await apiClient.get<ApiResponse<GetJobsResponse>>(
      `/jobs/${organizationId}`
    );
    return response.data.data.jobs;
  },

  // Get applications for a specific job
  getJobApplications: async (organizationId: string, jobId: string): Promise<JobApplication[]> => {
    console.log('🚀 Making API call to get job applications:', {
      organizationId,
      jobId,
      url: `/jobs/${organizationId}/applications?jobId=${jobId}`,
      fullUrl: `${API_BASE_URL}/jobs/${organizationId}/applications?jobId=${jobId}`
    });
    
    try {
      const response = await apiClient.get<ApiResponse<GetJobApplicationsResponse>>(
        `/jobs/${organizationId}/applications?jobId=${jobId}`
      );
      
      console.log('📡 Job applications API response:', response.data);
      
      // Add null check for response data
      if (!response.data?.data?.applications) {
        console.warn('⚠️ No applications data in response:', response.data);
        return [];
      }
      
      console.log('✅ Successfully fetched applications:', response.data.data.applications.length);
      return response.data.data.applications;
    } catch (error) {
      console.error('❌ Error fetching job applications:', error);
      throw error;
    }
  },

  // Take action on a job application (accept/reject)
  takeApplicationAction: async (organizationId: string, actionData: ApplicationActionRequest): Promise<ApplicationActionResponse> => {
    console.log('🚀 Making API call to take application action:', {
      organizationId,
      actionData,
      url: `/jobs/${organizationId}/applications`,
      fullUrl: `${API_BASE_URL}/jobs/${organizationId}/applications`
    });
    
    try {
      const response = await apiClient.post<ApiResponse<ApplicationActionResponse>>(
        `/jobs/${organizationId}/applications`,
        actionData
      );
      
      console.log('📡 Application action API response:', response.data);
      
      return {
        success: true,
        message: response.data.message || 'Action completed successfully'
      };
    } catch (error: any) {
      console.error('❌ Error taking application action:', error);
      throw new Error(error.response?.data?.message || 'Failed to take action on application');
    }
  },
};

export default apiClient; 