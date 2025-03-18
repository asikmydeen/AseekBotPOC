import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',  // Add this line for static export

  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: true,
  env: {
    AWS_S3_BUCKET_NAME: process.env.AWS_S3_BUCKET_NAME || 'aseek-bot-uploads',
    AWS_REGION: process.env.AWS_REGION || 'us-east-1',
    API_BASE_URL: process.env.API_BASE_URL || '/api',
    MAX_UPLOAD_SIZE: process.env.MAX_UPLOAD_SIZE || '10485760',
  },
  async headers() {
    return [
      {
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
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com'
      },
    ],
    unoptimized: true,  // Add this for static export
  },
  experimental: {
    forceSwcTransforms: true,
  },
};

export default nextConfig;