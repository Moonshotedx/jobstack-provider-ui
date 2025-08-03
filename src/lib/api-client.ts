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
      // Skip session check for logout-related requests to avoid conflicts
      if (config.url?.includes('/auth/signout') || config.url?.includes('/signout') || 
          config.url?.includes('/auth/sign-out') || config.url?.includes('/sign-out')) {
        return config;
      }
      
      // Check for auth token in localStorage/sessionStorage
      const authToken = localStorage.getItem('auth-token') || sessionStorage.getItem('auth-token');
      
      if (authToken) {
        // Add Authorization header with the token
        config.headers.Authorization = `Bearer ${authToken}`;
      } else {
        // Fallback to session check for cookie-based auth
        await authClient.getSession(undefined, { credentials: 'include' });
      }
    } catch (error) {
      // Silently handle session check errors in production
      // This prevents errors during logout when session is being cleared
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
  status: 'open' | 'closed' | 'applied' | 'reviewed' | 'shortlisted' | 'interview' | 'hired' | 'rejected' | 'archived';
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
        [key: string]: any; // Allow additional properties like media URLs
      };
      education: any[];
      whatIHave: {
        age: number;
        qualityScore: number;
        stitchingSpeed: number;
        machinesOperated: string[];
        jukiMachineExperience: string;
        qualityScoreExplanation: string;
        taskVideo?: string;
        [key: string]: any; // Allow additional properties like media URLs
      };
      whatIWant: {
        monthlyPFESIC: string;
        readyToMigrate: string;
        stayPreferences: string;
        workHoursPerDay: number;
        maxCostPerSharingBed: number;
        monthlyOTExpectation: number;
        monthlyInHandPreferred: number;
        [key: string]: any; // Allow additional properties like media URLs
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

  // Duplicate an existing job posting
  duplicateJob: async (organizationId: string, existingJob: JobPosting): Promise<JobPosting> => {
    console.log('🔄 Duplicating job:', { organizationId, jobId: existingJob.id });
    
    // Create a new job with the same data but without the ID and timestamps
    const duplicateJobData: CreateJobRequest = {
      title: existingJob.title,
      location: existingJob.location as LocationData, // Cast to LocationData type
      metadata: {
        ...existingJob.metadata,
        // Remove any job-specific IDs or timestamps that shouldn't be duplicated
        id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        applicationsCount: undefined,
        // Add a flag to indicate this is a duplicate
        isDuplicate: true,
        originalJobId: existingJob.id
      }
    };
    
    // Create the new job using the existing createJob method
    return await jobsApi.createJob(organizationId, duplicateJobData);
  },

  // Update an existing job posting
  updateJob: async (organizationId: string, jobId: string, jobData: CreateJobRequest): Promise<JobPosting> => {
    const updatePayload = {
      jobId,
      ...jobData
    };
    
    console.log('🔄 Updating job with payload:', updatePayload);
    
    const response = await apiClient.put<ApiResponse<CreateJobResponse>>(
      `/jobs/${organizationId}`,
      updatePayload
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

  // Delete a job posting
  deleteJob: async (organizationId: string, jobId: string): Promise<void> => {
    console.log('🗑️ Deleting job:', { organizationId, jobId });
    
    const deletePayload = {
      jobId: jobId
    };
    
    const response = await apiClient.delete<ApiResponse<void>>(
      `/jobs/${organizationId}`,
      { data: deletePayload }
    );
    
    console.log('✅ Job deleted successfully:', response.data);
  },
};

export default apiClient; 

export interface PresignedUrlRequest {
  bucketName: string;
  contentType: string;
  objectKey: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  accessUrl: string;
  expiresIn: number;
  objectKey: string;
}

export const getPresignedUrl = async (request: PresignedUrlRequest): Promise<PresignedUrlResponse> => {
  console.log('🚀 Getting presigned URL:', request);
  
  try {
    const response = await apiClient.post('/storage/presigned-url', request);
    
    console.log('✅ Presigned URL response:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Presigned URL error:', error);
    throw error;
  }
};

export const uploadFileToPresignedUrl = async (uploadUrl: string, file: File): Promise<void> => {
  console.log('🚀 Uploading file to presigned URL:', {
    uploadUrl,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type
  });

  try {
    // Try direct upload first
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type,
      },
      body: file,
      // Note: Don't include credentials for presigned URLs as they contain auth in the URL itself
      // and cloud storage providers return Access-Control-Allow-Origin: * which conflicts with credentials
    });

    console.log('📡 Upload response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Upload failed:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      throw new Error(`Failed to upload file: ${response.status} ${response.statusText} - ${errorText}`);
    }

    console.log('✅ File uploaded successfully');
  } catch (error) {
    console.error('❌ Upload error:', error);
    
    // If CORS error, try server-side upload as fallback
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      console.log('🔄 CORS error detected, trying server-side upload...');
      await uploadFileThroughServer(file);
      return;
    }
    
    throw error;
  }
};

// Fallback method to upload through API server
const uploadFileThroughServer = async (file: File): Promise<void> => {
  console.log('🚀 Uploading file through server:', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type
  });

  try {
    const formData = new FormData();
    formData.append('file', file);
    
    await apiClient.post('/storage/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });

    console.log('✅ File uploaded successfully through server');
  } catch (error) {
    console.error('❌ Server upload error:', error);
    throw new Error('Upload failed due to CORS restrictions. Please contact support to configure CORS for the storage bucket.');
  }
};

// Organization types
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  createdAt: string;
  metadata: string; // JSON string containing organization details
}

export interface OrganizationListResponse {
  organizations: Organization[];
}

// Organization API functions
export const getOrganizationList = async (): Promise<Organization[]> => {
  try {
    const response = await apiClient.get('/auth/organization/list');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch organization list:', error);
    throw error;
  }
};

// Check if organization slug is available
export const checkOrganizationSlugAvailability = async (slug: string): Promise<boolean> => {
  console.log('🚀 [API] Making slug availability check request:', {
    slug,
    endpoint: '/auth/organization/check-slug',
    timestamp: new Date().toISOString()
  });
  
  try {
    const response = await apiClient.post('/auth/organization/check-slug', { slug });
    console.log('✅ [API] Slug availability check response:', {
      slug,
      status: response.status,
      data: response.data
    });
    
    // Handle different response formats from backend
    // Backend returns {"status": true} when slug is available
    // Backend returns {"status": false} when slug is taken
    const isAvailable = response.data.status === true || response.data.available === true;
    
    console.log('📊 [API] Processed availability result:', {
      slug,
      rawResponse: response.data,
      isAvailable
    });
    
    return isAvailable;
  } catch (error: any) {
    console.log('❌ [API] Slug availability check error:', {
      slug,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      error
    });
    
    // If endpoint doesn't exist or returns 404, assume available
    if (error.response?.status === 404) {
      console.warn('⚠️ [API] Slug check endpoint not available, assuming slug is available');
      return true;
    }
    // If 409 or conflict, slug is taken
    if (error.response?.status === 409) {
      console.log('🚫 [API] Slug is taken (409 conflict)');
      return false;
    }
    console.error('❌ [API] Error checking slug availability:', error);
    // On other errors, assume available to not block user
    return true;
  }
};

// Organization update functionality has been moved to use the new auth client API
// in src/hooks/useJobsApi.ts - useUpdateOrganization hook

// OTP Authentication Types
export interface CheckUserRequest {
  email?: string;
  phoneNumber?: string;
}

export interface CheckUserResponse {
  userExists: boolean;
}

export interface RequestOtpRequest {
  email?: string;
  phoneNumber?: string;
}

export interface RequestOtpResponse {
  ok: boolean;
}

export interface VerifyOtpRequest {
  email?: string;
  phoneNumber?: string;
  otp: string;
}

export interface VerifyOtpResponse {
  redirect: string;
  token: string;
  user: {
    name: string;
    email: string;
    emailVerified: boolean;
    image: string;
    createdAt: string;
    updatedAt: string;
    role: string;
    banned: boolean;
    banReason: string;
    banExpires: string | null;
    phoneNumber: string;
    phoneNumberVerified: boolean;
    id: string;
  };
}

// Custom Session API Types
export interface CustomSessionResponse {
  session: {
    ipAddress: string;
    userAgent: string;
    expiresAt: string;
    userId: string;
    token: string;
    createdAt: string;
    updatedAt: string;
  };
  user: {
    name: string;
    email: string;
    emailVerified: boolean;
    image: string;
    createdAt: string;
    updatedAt: string;
    role: string;
    banned: boolean;
    banReason: string;
    banExpires: string | null;
    phoneNumber: string;
    phoneNumberVerified: boolean;
    id: string;
  };
}

// Custom Session API function
export const getCustomSession = async (): Promise<CustomSessionResponse> => {
  const response = await apiClient.get('/auth/get-session');
  return response.data;
};

// OTP Authentication API functions
export const checkUser = async (request: CheckUserRequest): Promise<CheckUserResponse> => {
  const response = await apiClient.post('/auth/unified-otp/check-user', request);
  return response.data;
};

export const requestOtp = async (request: RequestOtpRequest): Promise<RequestOtpResponse> => {
  const response = await apiClient.post('/auth/unified-otp/request', request);
  return response.data;
};

export const verifyOtp = async (request: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
  const response = await apiClient.post('/auth/unified-otp/verify', request);
  return response.data;
};