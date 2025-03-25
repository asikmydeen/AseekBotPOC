export const revalidate = 60; // revalidate every 60 seconds

import { NextRequest, NextResponse } from 'next/server';
import { withCors } from './corsHandler';

/**
 * Basic API handler that returns a success response
 */
async function handler(req: NextRequest) {
  // Only handle GET requests in this example
  if (req.method === 'GET') {
    return NextResponse.json({
      success: true,
      message: 'API is working correctly',
      timestamp: new Date().toISOString()
    });
  }

  // Return 405 Method Not Allowed for other methods
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

// Export the handler wrapped with CORS support
export const GET = withCors(handler);
export const OPTIONS = withCors(handler);
