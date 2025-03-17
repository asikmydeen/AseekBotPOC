import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Config for App Router API routes */
  reactStrictMode: true,

  // Environment variables
  env: {
    AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME || 'aseek-bot-uploads',
    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
    API_BASE_URL: process.env.API_BASE_URL || '/api',
    MAX_UPLOAD_SIZE: process.env.MAX_UPLOAD_SIZE || '10485760',
  },

  // Ensure API requests are properly handled
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/(.*)',
        headers: [
          {
            key: 'x-content-type-options',
            value: 'nosniff',
          },
          {
            key: 'x-frame-options',
            value: 'DENY',
          },
          {
            key: 'x-xss-protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true'
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
          },
        ],
      },
    ];
  },

  // Image optimization settings
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com'
      },
    ],
  },

  // Enable experimental features for App Router
  experimental: {
    forceSwcTransforms: true,
    // Ensure proper handling of server components
    serverExternalPackages: [],
  },
};

export default nextConfig;
