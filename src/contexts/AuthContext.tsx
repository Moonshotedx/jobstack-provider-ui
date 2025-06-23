import React, { createContext, useContext, useState, useEffect } from 'react';
import { authClient } from '@/lib/auth-client';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  role: 'individual' | 'organization';
  isVerified: boolean;
  profile?: UserProfile | OrganizationProfile;
  managedEmployers: EmployerProfile[];
  selectedEmployerId?: string;
}

export interface UserProfile {
  name: string;
  age?: number;
  isNameVerified: boolean;
  isAgeVerified: boolean;
  currentLocation: string;
  desiredLocation: string;
  experience: Experience[];
  skills: string[];
  certificates: Certificate[];
}

export interface Experience {
  id: string;
  designation: string;
  company: string;
  location: string;
  duration: string;
  workType: 'full-time' | 'part-time' | 'contract' | 'internship';
  description: string;
}

export interface Certificate {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  isVerified: boolean;
  documentUrl?: string;
}

export interface OrganizationProfile {
  name: string;
  address: string;
  gstNumber: string;
  logo?: string;
  contactPersonName: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  description: string;
}

export interface EmployerProfile {
  id: string;
  name: string;
  address: string;
  gstNumber: string;
  logo?: string;
  contactPersonName: string;
  contactEmail: string;
  contactPhone: string;
  website?: string;
  description: string;
  createdAt: string;
  isActive: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email?: string; phone?: string; password?: string; role: 'individual' | 'organization' }) => Promise<void>;
  verifyOTP: (otp: string) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: UserProfile | OrganizationProfile) => void;
  addEmployer: (employer: Omit<EmployerProfile, 'id' | 'createdAt'>) => void;
  updateEmployer: (employerId: string, employer: Partial<EmployerProfile>) => void;
  deleteEmployer: (employerId: string) => void;
  selectEmployer: (employerId: string) => void;
  getSelectedEmployer: () => EmployerProfile | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for existing session on mount
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const session = await authClient.getSession();
      if (session.data?.user) {
        const betterAuthUser = session.data.user;
        const mappedUser: User = {
          id: betterAuthUser.id,
          email: betterAuthUser.email,
          role: 'organization', // default for now
          isVerified: betterAuthUser.emailVerified || false,
          profile: undefined, // will be loaded separately if needed
          managedEmployers: [],
          selectedEmployerId: undefined
        };
        setUser(mappedUser);
      }
    } catch (error) {
      console.error('Session check failed:', error);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const loginRequest = await authClient.signIn.email({ 
        email, 
        password 
      });
      
      if (loginRequest.data?.user) {
        const betterAuthUser = loginRequest.data.user;
        const mappedUser: User = {
          id: betterAuthUser.id,
          email: betterAuthUser.email,
          role: 'organization',
          isVerified: betterAuthUser.emailVerified || false,
          profile: undefined,
          managedEmployers: [],
          selectedEmployerId: undefined
        };
        setUser(mappedUser);
      } else if (loginRequest.error) {
        throw new Error(loginRequest.error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { email?: string; phone?: string; password?: string; role: 'individual' | 'organization' }) => {
    setIsLoading(true);
    try {
      const signUpRequest = await authClient.signUp.email({ 
        name: data.email?.split('@')[0] || 'User', // Extract name from email
        email: data.email!,
        password: data.password || 'TempPass123!' // Use provided password or fallback
      });
      
      if (signUpRequest.data?.user) {
        const betterAuthUser = signUpRequest.data.user;
        const mappedUser: User = {
          id: betterAuthUser.id,
          email: betterAuthUser.email,
          role: data.role,
          isVerified: betterAuthUser.emailVerified || false,
          profile: undefined,
          managedEmployers: [],
          selectedEmployerId: undefined
        };
        setUser(mappedUser);
      } else if (signUpRequest.error) {
        throw new Error(signUpRequest.error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (otp: string) => {
    setIsLoading(true);
    // This would depend on your better-auth OTP setup
    // For now, we'll just check the session again
    await checkSession();
    setIsLoading(false);
  };

  const logout = async () => {
    try {
      await authClient.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local state even if logout request fails
      setUser(null);
    }
  };

  const updateProfile = (profile: UserProfile | OrganizationProfile) => {
    if (user) {
      const updatedUser = { ...user, profile };
      setUser(updatedUser);
      // In a real app, you'd also save this to your backend
    }
  };

  const addEmployer = (employer: Omit<EmployerProfile, 'id' | 'createdAt'>) => {
    if (user) {
      const newEmployer: EmployerProfile = {
        ...employer,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        isActive: true
      };
      
      const updatedUser = {
        ...user,
        managedEmployers: [...user.managedEmployers, newEmployer],
        selectedEmployerId: user.selectedEmployerId || newEmployer.id
      };
      
      setUser(updatedUser);
      // In a real app, you'd also save this to your backend
    }
  };

  const updateEmployer = (employerId: string, employerUpdate: Partial<EmployerProfile>) => {
    if (user) {
      const updatedEmployers = user.managedEmployers.map(emp => 
        emp.id === employerId ? { ...emp, ...employerUpdate } : emp
      );
      
      const updatedUser = { ...user, managedEmployers: updatedEmployers };
      setUser(updatedUser);
      // In a real app, you'd also save this to your backend
    }
  };

  const deleteEmployer = (employerId: string) => {
    if (user) {
      const updatedEmployers = user.managedEmployers.filter(emp => emp.id !== employerId);
      const updatedUser = {
        ...user,
        managedEmployers: updatedEmployers,
        selectedEmployerId: user.selectedEmployerId === employerId 
          ? (updatedEmployers.length > 0 ? updatedEmployers[0].id : undefined)
          : user.selectedEmployerId
      };
      
      setUser(updatedUser);
      // In a real app, you'd also save this to your backend
    }
  };

  const selectEmployer = (employerId: string) => {
    if (user) {
      const updatedUser = { ...user, selectedEmployerId: employerId };
      setUser(updatedUser);
      // In a real app, you'd also save this to your backend
    }
  };

  const getSelectedEmployer = (): EmployerProfile | null => {
    if (user && user.selectedEmployerId) {
      return user.managedEmployers.find(emp => emp.id === user.selectedEmployerId) || null;
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      verifyOTP,
      logout,
      updateProfile,
      addEmployer,
      updateEmployer,
      deleteEmployer,
      selectEmployer,
      getSelectedEmployer,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}; 