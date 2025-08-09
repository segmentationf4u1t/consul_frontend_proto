/*
  Backend-for-Frontend proxy to protect the origin API from the public web.
  - Browser calls this route (same origin), never the backend directly
  - This route adds Authorization using server-only env
  - Streams (SSE) are proxied transparently
*/

export const dynamic = 'force-dynamic';

type RouteCtx = { params: Promise<{ path: string[] }> };

const BACKEND_BASE = process.env.BACKEND_URL || 'http://127.0.0.1:3001/api';
const BACKEND_BEARER = process.env.BACKEND_BEARER_TOKEN || '';

async function forward(request: Request, ctx: RouteCtx) {
  const incomingUrl = new URL(request.url);
  const { path: pathSegments } = await ctx.params;
  const path = pathSegments?.join('/') ?? '';
  const targetUrl = new URL(`${BACKEND_BASE.replace(/\/$/, '')}/${path}`);
  // Copy search params (except user-supplied token)
  incomingUrl.searchParams.forEach((v, k) => {
    if (k.toLowerCase() !== 'token') targetUrl.searchParams.set(k, v);
  });
  // Enforce server-side token for both HTTP and SSE
  if (BACKEND_BEARER) targetUrl.searchParams.set('token', BACKEND_BEARER);

  // Clone headers and inject bearer, omit hop-by-hop and user Authorization
  const outgoingHeaders = new Headers();
  for (const [k, v] of request.headers.entries()) {
    const lower = k.toLowerCase();
    if (['host', 'connection', 'content-length', 'authorization'].includes(lower)) continue;
    outgoingHeaders.set(k, v);
  }
  if (BACKEND_BEARER) outgoingHeaders.set('Authorization', `Bearer ${BACKEND_BEARER}`);
  else if (process.env.NODE_ENV !== 'production') {
    console.warn('[BFF] BACKEND_BEARER_TOKEN is not set; backend calls will likely 401');
  }

  const init: RequestInit = {
    method: request.method,
    headers: outgoingHeaders,
    // Only pass a body for methods that can have one
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
    redirect: 'manual'
  };

  const resp = await fetch(targetUrl.toString(), init);

  // Stream back the response as-is (supports SSE)
  const respHeaders = new Headers();
  resp.headers.forEach((v, k) => respHeaders.set(k, v));

  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers: respHeaders
  });
}

export async function GET(request: Request, ctx: RouteCtx) {
  return forward(request, ctx);
}
export async function POST(request: Request, ctx: RouteCtx) {
  return forward(request, ctx);
}
export async function PUT(request: Request, ctx: RouteCtx) {
  return forward(request, ctx);
}
export async function PATCH(request: Request, ctx: RouteCtx) {
  return forward(request, ctx);
}
export async function DELETE(request: Request, ctx: RouteCtx) {
  return forward(request, ctx);
}
export async function OPTIONS(request: Request, ctx: RouteCtx) {
  return forward(request, ctx);
}
export async function HEAD(request: Request, ctx: RouteCtx) {
  return forward(request, ctx);
}


