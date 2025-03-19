import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true, // Add this for better static hosting compatibility
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
  // Removing the headers function since it doesn't work with static export
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com'
      },
    ],
    unoptimized: true,
  },
  experimental: {
    forceSwcTransforms: true,
  },
};

export default nextConfig;