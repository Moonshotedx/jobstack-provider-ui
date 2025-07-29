import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { authClient, forgetPassword as authForgetPassword, resetPassword as authResetPassword } from '@/lib/auth-client';
import { useUserStore } from '@/stores/authStore';
import { toast } from 'sonner';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  role: 'individual' | 'organization';
  firstName: string;
  lastName: string;
}

interface UseAuthReturn {
  // State
  isLoading: boolean;
  pendingVerificationEmail?: string;
  
  // Actions
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<{ needsVerification: boolean }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  checkEmailVerification: () => Promise<boolean>;
  resendVerificationEmail: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  handleOtpVerification: (verificationData: any) => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string>();
  const [isCheckingSession, setIsCheckingSession] = useState(false);
  const [hasInitialCheck, setHasInitialCheck] = useState(false);
  const { setUser, clearUser, setLoading: setUserLoading, user } = useUserStore();
  const queryClient = useQueryClient();

  // Helper function to load organization profile from custom session
  const loadOrganizationProfile = async (_sessionData: any) => {
    try {
      // First, get the user's organizations using the API client with auth token
      const { getOrganizationList } = await import('@/lib/api-client');
      const organizations = await getOrganizationList();
      
      // If user has no organizations, return undefined
      if (organizations.length === 0) {
        return undefined;
      }

      // For now, use the first organization as active
      // In the future, we can implement proper active organization selection
      const activeOrg = organizations[0];
      
      if (!activeOrg) {
        return undefined;
      }

      // Parse the metadata JSON string
      let metadata: {
        address?: string;
        gstNumber?: string;
        contactPersonName?: string;
        contactEmail?: string;
        contactPhone?: string;
        website?: string;
        description?: string;
      } = {};
      
      try {
        metadata = JSON.parse(activeOrg.metadata || '{}');
      } catch (error) {
        console.error('Failed to parse organization metadata:', error);
        metadata = {};
      }

      const profile = {
        id: activeOrg.id,
        name: activeOrg.name,
        slug: activeOrg.slug,
        logo: activeOrg.logo || undefined,
        address: metadata.address || '',
        gstNumber: metadata.gstNumber || '',
        contactPersonName: metadata.contactPersonName || '',
        contactEmail: metadata.contactEmail || '',
        contactPhone: metadata.contactPhone || '',
        website: metadata.website || '',
        description: metadata.description || '',
        createdAt: activeOrg.createdAt,
        isActive: true,
        isDefault: true
      };

      return profile;
    } catch (error) {
      console.error('Failed to load organization profile:', error);
      return undefined;
    }
  };

  const checkSession = async () => {
    // Prevent multiple simultaneous session checks
    if (isCheckingSession) {
      return;
    }

    try {
      setIsCheckingSession(true);
      setUserLoading(true);
      
      // Check for auth token first
      const authToken = localStorage.getItem('auth-token') || sessionStorage.getItem('auth-token');
      
      if (!authToken) {
        // No token available, clear user and return
        clearUser();
        return;
      }
      
      // Use custom session API with Bearer token
      const { getCustomSession } = await import('@/lib/api-client');
      const sessionData = await getCustomSession();
      
      if (sessionData?.user) {
        const customUser = sessionData.user;
        
        const profile = await loadOrganizationProfile(sessionData);
        
        const mappedUser = {
          id: customUser.id,
          email: customUser.email,
          role: 'organization' as const, // default for now
          isVerified: customUser.emailVerified || customUser.phoneNumberVerified || false,
          profile: profile,
        };
        
        // Check if the user data has changed or if we need to update the store
        const currentUser = useUserStore.getState().user;
        const userChanged = !currentUser || 
          currentUser.id !== mappedUser.id ||
          currentUser.email !== mappedUser.email ||
          currentUser.isVerified !== mappedUser.isVerified ||
          JSON.stringify(currentUser.profile) !== JSON.stringify(mappedUser.profile);
        
        if (userChanged) {
          setUser(mappedUser);
        }
        
        // Invalidate session queries to ensure fresh data
        await queryClient.invalidateQueries({ queryKey: ['session'] });
      } else {
        // No user in session, ensure user is cleared
        clearUser();
      }
    } catch (error) {
      console.error('Session check failed:', error);
      // On session check failure, clear user to ensure consistent state
      clearUser();
    } finally {
      setUserLoading(false);
      setIsCheckingSession(false);
    }
  };

  const login = async (data: LoginData) => {
    setIsLoading(true);
    try {
      const loginRequest = await authClient.signIn.email({ 
        email: data.email, 
        password: data.password 
      }, { credentials: 'include' });
      
      if (loginRequest.data?.user) {
        const betterAuthUser = loginRequest.data.user;
        const profile = await loadOrganizationProfile(loginRequest.data);
        
        const mappedUser = {
          id: betterAuthUser.id,
          email: betterAuthUser.email,
          role: 'organization' as const,
          isVerified: betterAuthUser.emailVerified || false,
          profile: profile,
        };
        setUser(mappedUser);
        
        // Invalidate session and jobs queries to force refetch with new login data
        await queryClient.invalidateQueries({ queryKey: ['session'] });
        await queryClient.invalidateQueries({ queryKey: ['jobs'] });
      } else if (loginRequest.error) {
        throw new Error(loginRequest.error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const name = `${data.firstName} ${data.lastName}`;

      const signUpRequest = await authClient.signUp.email({ 
        name,
        email: data.email,
        password: data.password,
        callbackURL: `${window.location.origin}/verify/email`
      }, { credentials: 'include' });
      
      if (signUpRequest.data?.user) {
        const betterAuthUser = signUpRequest.data.user;
        const mappedUser = {
          id: betterAuthUser.id,
          email: betterAuthUser.email,
          role: data.role,
          isVerified: betterAuthUser.emailVerified || false,
          profile: undefined,
        };
        setUser(mappedUser);
        setPendingVerificationEmail(data.email);
        
        return { needsVerification: !betterAuthUser.emailVerified };
      } else if (signUpRequest.error) {
        throw new Error(signUpRequest.error.message);
      }
      
      return { needsVerification: true };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Clear user state first to prevent race conditions
      clearUser();
      setPendingVerificationEmail(undefined);
      
      // Clear any cached queries
      await queryClient.clear();
      
      // Clear local storage
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        localStorage.removeItem('user-storage');
        localStorage.removeItem('auth-token');
      }
      
      // Attempt server logout, but handle session errors gracefully
      try {
        await authClient.signOut({}, { credentials: 'include' });
      } catch (signOutError: any) {
        // If the sign-out fails with a session error, that's actually fine
        // because it means the session was already invalid/expired
        if (signOutError?.response?.status === 400 && 
            signOutError?.response?.data?.code === 'FAILED_TO_GET_SESSION') {
          // Session was already invalid, continuing with logout
        } else {
          // Re-throw other errors
          throw signOutError;
        }
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Even if server logout fails, we've already cleared local state
    } finally {
      // Ensure user is cleared regardless of server response
      clearUser();
      setPendingVerificationEmail(undefined);
    }
  };

  const checkEmailVerification = async () => {
    try {
      const authToken = localStorage.getItem('auth-token') || sessionStorage.getItem('auth-token');
      
      if (!authToken) {
        return false;
      }
      
      const { getCustomSession } = await import('@/lib/api-client');
      const sessionData = await getCustomSession();
      
      if (sessionData?.user) {
        const isVerified = sessionData.user.emailVerified || sessionData.user.phoneNumberVerified || false;
        const currentUser = useUserStore.getState().user;
        
        // Only update user state if verification status has changed
        if (currentUser && currentUser.isVerified !== isVerified) {
          setUser({ ...currentUser, isVerified });
          if (isVerified) {
            setPendingVerificationEmail(undefined);
          }
        }
        
        return isVerified;
      }
      return false;
    } catch (error) {
      console.error('Verification check failed:', error);
      return false;
    }
  };

  const resendVerificationEmail = async () => {
    const emailToResend = pendingVerificationEmail || user?.email;
    if (!emailToResend) {
      throw new Error('No email address found for verification');
    }
    
    try {
      // Use the API client for resending verification email
      const { default: apiClient } = await import('@/lib/api-client');
      await apiClient.post('/auth/send-verification-email', { 
        email: emailToResend,
        callbackURL: `${window.location.origin}/verify/email`
      });
      
      // Update pending verification email if it wasn't set
      if (!pendingVerificationEmail) {
        setPendingVerificationEmail(emailToResend);
      }
      
      toast.success('Verification email resent successfully!');
    } catch (error) {
      console.error('Failed to resend verification email:', error);
      throw new Error('Failed to resend verification email');
    }
  };

  const forgotPassword = async (email: string) => {
    try {
      const result = await authForgetPassword(email);
      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw error;
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      const result = await authResetPassword(token, password);
      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error('Failed to reset password:', error);
      throw error;
    }
  };

  const handleOtpVerification = async (verificationData: any) => {
    try {
      // Store the token in localStorage or sessionStorage for future requests
      if (verificationData.token) {
        localStorage.setItem('auth-token', verificationData.token);
        sessionStorage.setItem('auth-token', verificationData.token);
      }

      // Use custom session API to get complete user data
      const { getCustomSession } = await import('@/lib/api-client');
      const sessionData = await getCustomSession();
      
      if (sessionData?.user) {
        const customUser = sessionData.user;
        const profile = await loadOrganizationProfile(sessionData);
        
        const userData = {
          id: customUser.id,
          email: customUser.email,
          role: 'organization' as const, // Map to expected role format
          isVerified: customUser.emailVerified || customUser.phoneNumberVerified,
          profile: profile
        };

        setUser(userData);
      } else {
        // Fallback to OTP verification data if custom session fails
        const userData = {
          id: verificationData.user.id,
          email: verificationData.user.email,
          role: 'organization' as const,
          isVerified: verificationData.user.emailVerified || verificationData.user.phoneNumberVerified,
          profile: undefined // Don't set profile yet, let the organization check handle it
        };
        setUser(userData);
      }
      
      // Clear any pending verification email
      setPendingVerificationEmail(undefined);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries();
      
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete verification');
      throw error;
    }
  };

  // Check session on mount only once
  useEffect(() => {
    if (!hasInitialCheck && !isCheckingSession) {
      setHasInitialCheck(true);
      checkSession();
    }
  }, []); // Empty dependency array is intentional - we only want this to run once

  return {
    isLoading,
    pendingVerificationEmail,
    login,
    register,
    logout,
    checkSession,
    checkEmailVerification,
    resendVerificationEmail,
    forgotPassword,
    resetPassword,
    handleOtpVerification,
  };
}; 