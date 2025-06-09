import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Session from 'supertokens-web-js/recipe/session';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function doesSessionExist() {
  return await Session.doesSessionExist();
}

export async function logout() {
  await Session.signOut();
  window.location.href = '/auth'; // or to wherever your logic page is
}
