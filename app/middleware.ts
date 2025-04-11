import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // For client-side SPAs with static exports
  return NextResponse.next();
}

// This ensures all routes go through the middleware
export const config = {
  matcher: '/:path*',
};