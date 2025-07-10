import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toast } from 'sonner';
import { authClient } from './auth-client';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function logout() {
  try {
    await authClient.signOut();
    // Don't redirect automatically - let the calling component handle navigation
    return true;
  } catch (error) {
    console.error('Logout failed:', error);
    return false;
  }
}

// Separate function for logout with redirect (for manual logout)
export async function logoutAndRedirect() {
  const success = await logout();
  if (success) {
    window.location.href = '/';
  } else {
    toast.error('Sign out failed');
  }
}
