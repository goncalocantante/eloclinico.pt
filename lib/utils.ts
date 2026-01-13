import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Converts a time string like "09:15" into a decimal number like 9.25
// This is mainly for display purposes (not for precise time calculations)
export function timeToFloat(time: string): number {
  // Split the time string by ":" into [hours, minutes] and convert both to numbers
  const [hours, minutes] = time.split(":").map(Number);
  // Note: .map(Number) is a shorthand way to convert an array of strings to numbers.

  // Convert minutes into a fraction of an hour and add it to the hour
  return hours + minutes / 60;
}

export const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const getBaseUrl = () => {
  // 1. If we are in the browser, use the current relative path
  if (typeof window !== 'undefined') return '';

  // 2. If we are on Vercel Production, use your specific custom domain
  if (process.env.VERCEL_ENV === 'production') return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL}`; 

  // 3. If we are on a Vercel Preview branch, use the dynamic Vercel URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;

  // 4. Fallback to localhost for local development
  return `http://localhost:3000`;
};

export const baseUrl = getBaseUrl();