import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  email?: string;
  phone?: string;
  role: 'individual' | 'organization';
  isVerified: boolean;
  profile?: UserProfile | OrganizationProfile;
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

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email?: string; phone?: string; role: 'individual' | 'organization' }) => Promise<void>;
  verifyOTP: (otp: string) => Promise<void>;
  logout: () => void;
  updateProfile: (profile: UserProfile | OrganizationProfile) => void;
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

// Utility function to clear all auth-related localStorage
const clearAuthStorage = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('pendingUser');
  console.log('Cleared auth localStorage data');
};

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).clearAuthStorage = clearAuthStorage;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for existing session in localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        // Clear invalid localStorage data
        clearAuthStorage();
        console.error('Invalid user data in localStorage, clearing...', error);
      }
    }
  }, []);

  const login = async (email: string, _password: string) => {
    setIsLoading(true);
    // Mock login - in real app, this would call your backend
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser: User = {
      id: '1',
      email,
      role: 'individual',
      isVerified: true
    };
    
    setUser(mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
    setIsLoading(false);
  };

  const register = async (data: { email?: string; phone?: string; role: 'individual' | 'organization' }) => {
    setIsLoading(true);
    // Mock registration - simulate OTP sending
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockUser: User = {
      id: Date.now().toString(),
      email: data.email,
      phone: data.phone,
      role: data.role,
      isVerified: false
    };
    
    setUser(mockUser);
    localStorage.setItem('pendingUser', JSON.stringify(mockUser));
    setIsLoading(false);
  };

  const verifyOTP = async (otp: string) => {
    setIsLoading(true);
    // Mock OTP verification
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (otp === '123456') {
      const pendingUser = localStorage.getItem('pendingUser');
      if (pendingUser) {
        try {
          const verifiedUser = { ...JSON.parse(pendingUser), isVerified: true };
          setUser(verifiedUser);
          localStorage.setItem('user', JSON.stringify(verifiedUser));
          localStorage.removeItem('pendingUser');
        } catch (error) {
          localStorage.removeItem('pendingUser');
          throw new Error('Invalid pending user data');
        }
      }
    } else {
      throw new Error('Invalid OTP');
    }
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
    clearAuthStorage();
  };

  const updateProfile = (profile: UserProfile | OrganizationProfile) => {
    if (user) {
      const updatedUser = { ...user, profile };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      register,
      verifyOTP,
      logout,
      updateProfile,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}; 