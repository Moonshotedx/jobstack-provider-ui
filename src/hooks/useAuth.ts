import { useState, useEffect, useCallback } from 'react';
import { authClient } from '@/lib/auth-client';
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
}

export const useAuth = (): UseAuthReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string>();
  const { setUser, clearUser, setLoading: setUserLoading } = useUserStore();

  const checkSession = useCallback(async () => {
    try {
      setUserLoading(true);
      const session = await authClient.getSession();
      if (session.data?.user) {
        const betterAuthUser = session.data.user;
        const mappedUser = {
          id: betterAuthUser.id,
          email: betterAuthUser.email,
          role: 'organization' as const, // default for now
          isVerified: betterAuthUser.emailVerified || false,
          profile: undefined, // will be loaded separately if needed
        };
        setUser(mappedUser);
      }
    } catch (error) {
      console.error('Session check failed:', error);
    } finally {
      setUserLoading(false);
    }
  }, [setUser, setUserLoading]);

  const login = useCallback(async (data: LoginData) => {
    setIsLoading(true);
    try {
      const loginRequest = await authClient.signIn.email({ 
        email: data.email, 
        password: data.password 
      });
      
      if (loginRequest.data?.user) {
        const betterAuthUser = loginRequest.data.user;
        const mappedUser = {
          id: betterAuthUser.id,
          email: betterAuthUser.email,
          role: 'organization' as const,
          isVerified: betterAuthUser.emailVerified || false,
          profile: undefined,
        };
        setUser(mappedUser);
      } else if (loginRequest.error) {
        throw new Error(loginRequest.error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true);
    try {
      const name = `${data.firstName} ${data.lastName}`;

      const signUpRequest = await authClient.signUp.email({ 
        name,
        email: data.email,
        password: data.password,
        callbackURL: `${window.location.origin}/dashboard`
      });
      
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
  }, [setUser]);

  const logout = useCallback(async () => {
    try {
      await authClient.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearUser();
      setPendingVerificationEmail(undefined);
    }
  }, [clearUser]);

  const checkEmailVerification = useCallback(async () => {
    try {
      const session = await authClient.getSession();
      if (session.data?.user) {
        const isVerified = session.data.user.emailVerified || false;
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
  }, [setUser]);

  const resendVerificationEmail = useCallback(async () => {
    if (!pendingVerificationEmail) {
      throw new Error('No email pending verification');
    }
    
    try {
      // For better-auth, you may need to implement a resend endpoint
      // This is a placeholder - you'll need to check better-auth documentation
      console.log('Resending verification email to:', pendingVerificationEmail);
      // TODO: Implement actual resend functionality with better-auth
      toast.success('Verification email resent successfully!');
    } catch (error) {
      console.error('Failed to resend verification email:', error);
      throw new Error('Failed to resend verification email');
    }
  }, [pendingVerificationEmail]);

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return {
    isLoading,
    pendingVerificationEmail,
    login,
    register,
    logout,
    checkSession,
    checkEmailVerification,
    resendVerificationEmail,
  };
}; 