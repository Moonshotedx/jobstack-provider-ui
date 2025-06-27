import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { authClient } from './auth-client';

// Base API configuration
const API_BASE_URL = 'http://localhost:3001/api/v1';

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
    console.log('API Request interceptor called:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      withCredentials: config.withCredentials
    });
    
    // Log current cookies
    console.log('Current document cookies:', document.cookie);
    
    try {
      const session = await authClient.getSession();
      console.log('Session for API request:', {
        hasSession: !!session.data,
        hasUser: !!session.data?.user,
        hasSessionData: !!session.data?.session,
        sessionId: session.data?.session?.id,
        activeOrgId: session.data?.session?.activeOrganizationId,
        userEmail: session.data?.user?.email
      });
      
      // Don't add Authorization header - let cookies handle auth
      console.log('Using cookie-based authentication');
      
    } catch (error) {
      console.error('Failed to get session for API request:', error);
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('API Response received:', {
      status: response.status,
      url: response.config.url,
      method: response.config.method
    });
    return response;
  },
  (error) => {
    console.error('API Response error:', {
      status: error.response?.status,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    });
    
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.error('Unauthorized access - session may be invalid');
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
  gps: {
    lat: number;
    lng: number;
  };
}

export interface CreateJobRequest {
  title: string;
  description: string;
  location?: LocationData;
  metadata?: Record<string, any>;
}

export interface JobPosting {
  id: string;
  title: string;
  description: string;
  locationId: string | null;
  metadata: Record<string, any>;
  organizationId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
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
  postings: JobPosting[];
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
    return response.data.data.postings;
  },
};

export default apiClient; 