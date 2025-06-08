import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Session from 'supertokens-web-js/recipe/session';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function doesSessionExist() {
  if (await Session.doesSessionExist()) {
    // user is logged in
  } else {
    // user has not logged in yet
  }
}

export async function logout() {
  await Session.signOut();
  window.location.href = '/auth'; // or to wherever your logic page is
}
