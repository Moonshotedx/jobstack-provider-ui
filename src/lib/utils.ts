import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Session from 'supertokens-web-js/recipe/session';
import {
  doesEmailExist,
  signIn,
  signUp,
} from 'supertokens-web-js/recipe/emailpassword';
import { toast } from 'sonner';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function doesSessionExist() {
  return await Session.doesSessionExist();
}

export async function logout() {
  await Session.signOut();
  window.location.href = '/auth/login';
}

export async function handleSignUp(
  email: string,
  password: string,
  metadata: { name: string; phone: string }
) {
  try {
    const emailCheck = await doesEmailExist({ email });
    if (emailCheck.doesExist) {
      toast.warning('Email already exists. Please sign in instead');
    } else {
      const response = await signUp({
        formFields: [
          { id: 'email', value: email },
          { id: 'password', value: password },
          { id: 'name', value: metadata.name },
          { id: 'phone', value: metadata.phone },
        ],
      });

      if (response.status === 'FIELD_ERROR') {
        response.formFields.forEach((f) => toast.error(f.error));
      } else if (response.status === 'SIGN_UP_NOT_ALLOWED') {
        toast.error(response.reason);
      } else {
        window.location.href = '/profile';
      }
    }
  } catch (err: any) {
    toast.error(err?.message ?? 'Something went wrong.');
  }
}

export async function handleSignIn(email: string, password: string) {
  try {
    const response = await signIn({
      formFields: [
        { id: 'email', value: email },
        { id: 'password', value: password },
      ],
    });

    if (response.status === 'FIELD_ERROR') {
      response.formFields.forEach((f) => toast.error(f.error));
    } else if (response.status === 'WRONG_CREDENTIALS_ERROR') {
      toast.error('Email/password is incorrect.');
    } else if (response.status === 'SIGN_IN_NOT_ALLOWED') {
      toast.error(response.reason);
    } else {
      window.location.href = '/profile';
    }
  } catch (err: any) {
    toast.error(err?.message ?? 'Something went wrong.');
  }
}
