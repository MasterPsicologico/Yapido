import 'server-only';

import type { NextRequest, NextResponse } from 'next/server';

export function isCronAuthorized(req: NextRequest): boolean {
  const cronSecret = req.headers.get('x-cron-secret');
  if (process.env.NODE_ENV === 'development') return true;
  if (!cronSecret) return false;
  return cronSecret === process.env.CRON_SECRET;
}

export function isDebugAuthorized(req: NextRequest): boolean {
  const secretHeader = req.headers.get('x-debug-secret');
  const debugSecret = process.env.DEBUG_SECRET;
  if (!debugSecret) return true;
  return secretHeader === debugSecret;
}

export async function isAdminAuthorized(req: NextRequest): Promise<boolean> {
  const { verifySuperAdminFromAuthHeader } = await import('./firebase-admin');
  return verifySuperAdminFromAuthHeader(req.headers.get('authorization'));
}

export function unauthorized(message: string, status = 401) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export async function ensureCron(req: NextRequest): Promise<NextResponse | null> {
  if (!isCronAuthorized(req)) return unauthorized('Unauthorized') as unknown as NextResponse;
  return null;
}

export async function ensureDebug(req: NextRequest): Promise<NextResponse | null> {
  if (!isDebugAuthorized(req)) return unauthorized('Invalid debug secret', 403) as unknown as NextResponse;
  return null;
}

export async function ensureAdmin(req: NextRequest): Promise<NextResponse | null> {
  const ok = await isAdminAuthorized(req);
  if (!ok) return unauthorized('Unauthorized - Admin access required', 403) as unknown as NextResponse;
  return null;
}
