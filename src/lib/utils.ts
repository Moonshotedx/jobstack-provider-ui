import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toast } from 'sonner';
import { authClient } from './auth-client';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function logout() {
  await authClient
    .signOut()
    .then(() => {
      window.location.href = '/auth/login';
    })
    .catch((_) => {
      toast.error('signOut failed');
    });
}
