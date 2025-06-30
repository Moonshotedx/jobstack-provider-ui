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
      await authClient.getSession();
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
  location: Record<string, any>;
  contact: Record<string, any>;
  metadata: Record<string, any>;
  organizationName: string;
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
  jobs: JobPosting[];
  pagination: {
    page: number;
    limit: number;
  };
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
};

export default apiClient; 