/**
 * API Configuration for different access scenarios
 * Automatically detects the best backend URL based on how the frontend is accessed
 * Handles dynamic external IPs by using the same hostname as the current frontend access
 */

export function getApiBaseUrl(): string {
  // Always go through our BFF proxy in production to avoid exposing secrets
  if (process.env.NEXT_PUBLIC_USE_BFF !== 'false') {
    return '/bff';
  }
  // Fallback (local dev hitting backend directly)
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001/api';
  return base;
}

export const API_BASE_URL = getApiBaseUrl();

// Client should never carry bearer by default; BFF injects it
export const API_BEARER = process.env.NEXT_PUBLIC_API_BEARER_TOKEN;

export function withAuth(init?: RequestInit): RequestInit {
  const headers = new Headers(init?.headers as HeadersInit);
  if (API_BEARER && process.env.NEXT_PUBLIC_USE_BFF === 'false') {
    headers.set('Authorization', `Bearer ${API_BEARER}`);
  }
  return { ...(init ?? {}), headers };
}