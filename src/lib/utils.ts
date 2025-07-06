import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the base URL for the current environment
 * Handles localhost, Vercel, and other deployments automatically
 */
export function getBaseUrl(): string {
  // Browser environment
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Server environment - check various deployment platforms
  
  // Priority 1: Custom base URL (highest priority)
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }
  
  // Priority 2: Vercel automatic URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  
  // Priority 3: Netlify
  if (process.env.NETLIFY_URL) {
    return process.env.NETLIFY_URL;
  }
  
  // Priority 4: Default to localhost for development
  return 'http://localhost:3000';
}

/**
 * Build API URL with automatic base URL detection
 */
export function buildApiUrl(path: string): string {
  const baseUrl = getBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Debug utility to show current environment
 */
export function debugEnvironment(): void {
  const baseUrl = getBaseUrl();
  
  console.log('🔍 Environment Debug Info:');
  console.log('========================');
  console.log(`Current Base URL: ${baseUrl}`);
  console.log(`Environment: ${typeof window !== 'undefined' ? 'Browser' : 'Server'}`);
  
  if (typeof window === 'undefined') {
    console.log('Server Environment Variables:');
    console.log(`  VERCEL_URL: ${process.env.VERCEL_URL || 'not set'}`);
    console.log(`  NETLIFY_URL: ${process.env.NETLIFY_URL || 'not set'}`);
    console.log(`  NEXT_PUBLIC_BASE_URL: ${process.env.NEXT_PUBLIC_BASE_URL || 'not set'}`);
  }
  
  console.log('API Endpoints:');
  console.log(`  Models API: ${baseUrl}/api/models/[fileId]`);
  console.log(`  Images API: ${baseUrl}/api/images/[fileId]`);
  console.log(`  Upload API: ${baseUrl}/api/upload-to-drive`);
}
