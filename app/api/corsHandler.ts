import { NextRequest, NextResponse } from 'next/server';

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

type RouteHandler = (
  req: NextRequest,
  context?: any
) => Promise<NextResponse> | NextResponse;

/**
 * Wraps an API route handler with CORS headers
 * @param handler The original API route handler
 * @returns A new handler with CORS support
 */
export function withCors(handler: RouteHandler): RouteHandler {
  return async (req: NextRequest, context?: any) => {
    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
      return NextResponse.json({}, { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    // Call the original handler
    const response = await handler(req, context);
    
    // Add CORS headers to the response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  };
}