import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Polyfill for crypto.randomUUID for older browsers
if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  crypto.randomUUID = function(): `${string}-${string}-${string}-${string}-${string}` {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    }) as `${string}-${string}-${string}-${string}-${string}`;
  };
}

