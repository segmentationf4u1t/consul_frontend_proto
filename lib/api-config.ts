/**
 * API Configuration for different access scenarios
 * Automatically detects the best backend URL based on how the frontend is accessed
 * Handles dynamic external IPs by using the same hostname as the current frontend access
 */

export function getApiBaseUrl(): string {
  // If environment variable is set, validate it first
  if (process.env.NEXT_PUBLIC_API_URL) {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    // Don't allow 0.0.0.0 for client-side connections
    if (envUrl.includes('0.0.0.0')) {
      console.warn('Environment variable NEXT_PUBLIC_API_URL contains 0.0.0.0, using localhost instead');
      return 'http://localhost:3001';
    }
    return envUrl;
  }

  // For server-side rendering, use local network IP
  if (typeof window === 'undefined') {
    return 'http://192.168.1.33:3001';
  }

  // Client-side: use the same hostname as the frontend, but on port 3001
  const hostname = window.location.hostname;
  const protocol = window.location.protocol; // 'http:' or 'https:'
  
  if (process.env.NODE_ENV === 'development') {
    console.log('Frontend hostname detected:', hostname);
  }
  
  // Special case for localhost variants and invalid addresses
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0') {
    const url = 'http://localhost:3001';
    if (process.env.NODE_ENV === 'development') {
      console.log('Using localhost API URL:', url);
    }
    return url;
  }

  // For any other hostname (including dynamic external IPs), use the same hostname with port 3001
  // Use the same protocol as the frontend (HTTP/HTTPS)
  const url = `${protocol}//${hostname}:3001`;
  if (process.env.NODE_ENV === 'development') {
    console.log('Using dynamic API URL:', url);
  }
  return url;
}

export const API_BASE_URL = getApiBaseUrl();