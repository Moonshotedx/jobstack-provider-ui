import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { authClient } from './auth-client';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function logout() {
  try {
    // Clear any pending queries first to prevent race conditions
    if (typeof window !== 'undefined') {
      // Clear any cached data
      sessionStorage.clear();
      localStorage.removeItem('user-storage');
    }
    
    // Try to sign out, but don't fail if the session is already invalid
    try {
      await authClient.signOut({}, { credentials: 'include' });
    } catch (signOutError: any) {
      // If the sign-out fails with a session error, that's actually fine
      // because it means the session was already invalid/expired
      if (signOutError?.response?.status === 400 && 
          signOutError?.response?.data?.code === 'FAILED_TO_GET_SESSION') {
        console.log('Session was already invalid, continuing with logout');
      } else {
        // Re-throw other errors
        throw signOutError;
      }
    }
    
    // Don't redirect automatically - let the calling component handle navigation
    return true;
  } catch (error) {
    console.error('Logout failed:', error);
    // Even if the server logout fails, we should still clear local state
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
      localStorage.removeItem('user-storage');
    }
    return false;
  }
}

// Separate function for logout with redirect (for manual logout)
export async function logoutAndRedirect() {
  const success = await logout();
  if (success) {
    window.location.href = '/';
  } else {
    // Even if logout failed, redirect to home page
    console.warn('Logout failed, but redirecting to home page');
    window.location.href = '/';
  }
}
