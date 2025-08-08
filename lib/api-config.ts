/**
 * API Configuration for different access scenarios
 * Automatically detects the best backend URL based on how the frontend is accessed
 * Handles dynamic external IPs by using the same hostname as the current frontend access
 */

export function getApiBaseUrl(): string {
  // If environment variable is set, use it (allows manual override)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // For server-side rendering, use local network IP
  if (typeof window === 'undefined') {
    return 'http://192.168.1.33:3001';
  }

  // Client-side: use the same hostname as the frontend, but on port 3001
  const hostname = window.location.hostname;
  
  // Special case for localhost variants
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001';
  }

  // For any other hostname (including dynamic external IPs), use the same hostname with port 3001

  return `http://${hostname}:3001`;
}

export const API_BASE_URL = getApiBaseUrl();

// Public-exposed bearer for client requests (dev/internal use only)
export const API_BEARER = process.env.NEXT_PUBLIC_API_BEARER_TOKEN;

export function withAuth(init?: RequestInit): RequestInit {
  const headers = new Headers(init?.headers as HeadersInit);
  if (API_BEARER) headers.set('Authorization', `Bearer ${API_BEARER}`);
  return { ...(init ?? {}), headers };
}