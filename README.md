# AseekBot: Data Center Procurement Assistant

AseekBot is an AI-powered chatbot application designed to streamline data center procurement tasks. It helps users analyze bid documents, compare suppliers, and make informed procurement decisions through natural language interactions.

## Features

- **Intelligent Chat Interface**: Natural conversation with AI-powered responses
- **Document Analysis**: Upload and analyze procurement documents and bid specifications
- **Multi-format Support**: Process various file formats including PDF, DOCX, XLSX, CSV
- **Ticket Creation**: Generate support tickets directly from conversations
- **Dark/Light Mode**: Customizable UI experience with theme switching
- **Mobile Responsive**: Optimized for both desktop and mobile experiences

## Architecture

The application uses a serverless architecture built on AWS:

- **Frontend**: Next.js React application (static site)
- **Backend**: AWS Lambda functions for API endpoints
- **Storage**: Amazon S3 for file storage
- **Content Delivery**: CloudFront CDN for global performance
- **AI Integration**: Amazon Bedrock for AI capabilities
- **API Gateway**: Manages API endpoints for the Lambda functions

## Deployment Guide

### Backend Lambda API Deployment

#### Prerequisites
- AWS CLI installed and configured with appropriate credentials
- Node.js 18+ installed
- Serverless Framework installed (`npm install -g serverless`)

#### 1. Setup Backend Project
```bash
mkdir aseekbot-lambda-api
cd aseekbot-lambda-api
npm init -y
npm install express serverless serverless-http multer aws-sdk @aws-sdk/client-s3 @aws-sdk/client-bedrock-agent-runtime uuid
mkdir -p lambdas utils
```

#### 2. Create Required Lambda Files
Create utility files and Lambda functions as per the project structure. Each Lambda function should handle a specific API endpoint like:
- `processChatMessage.js`: Processes chat messages with Bedrock
- `uploadFile.js`: Handles file uploads to S3
- `deleteFile.js`: Removes files from S3
- `createTicket.js`: Creates support tickets
- `quickLink.js`: Provides quick response options
- `processMessage.js`: Processes raw message data

#### 3. Configure Serverless Deployment
Create a `serverless.yml` file:

```yaml
service: aseekbot-api

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    AWS_S3_BUCKET_NAME: ${env:AWS_S3_BUCKET_NAME}
  iamRoleStatements:
    - Effect: Allow
      Action:
        - s3:GetObject
        - s3:PutObject
        - s3:DeleteObject
      Resource: "arn:aws:s3:::${env:AWS_S3_BUCKET_NAME}/*"
    - Effect: Allow
      Action:
        - bedrock:*
      Resource: "*"

functions:
  processChatMessage:
    handler: lambdas/processChatMessage.handler
    events:
      - http:
          path: processChatMessage
          method: post
          cors: true

  uploadFile:
    handler: lambdas/uploadFile.handler
    events:
      - http:
          path: uploadFile
          method: post
          cors: true

  deleteFile:
    handler: lambdas/deleteFile.handler
    events:
      - http:
          path: deleteFile
          method: post
          cors: true

  createTicket:
    handler: lambdas/createTicket.handler
    events:
      - http:
          path: createTicket
          method: post
          cors: true

  quickLink:
    handler: lambdas/quickLink.handler
    events:
      - http:
          path: quickLink
          method: post
          cors: true

  processMessage:
    handler: lambdas/processMessage.handler
    events:
      - http:
          path: processMessage
          method: post
          cors: true
```

#### 4. Deploy Backend APIs
```bash
# Set your S3 bucket name
export AWS_S3_BUCKET_NAME=your-s3-bucket-name

# Deploy to AWS
serverless deploy
```

Note the API Gateway endpoints displayed after deployment.

### Frontend Deployment

#### 1. Configure Next.js for Static Export
Update `next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',  // Enable static export

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
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com'
      },
    ],
    unoptimized: true,  // Required for static export
  },
  experimental: {
    forceSwcTransforms: true,
  },
};

export default nextConfig;
```

#### 2. Update API Endpoints Configuration
Create a new file in `app/utils/lambdaApi.ts`:

```typescript
// app/utils/lambdaApi.ts
export const API_BASE_URL = 'https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev';

export const LAMBDA_ENDPOINTS = {
  processChatMessage: `${API_BASE_URL}/processChatMessage`,
  uploadFile: `${API_BASE_URL}/uploadFile`,
  deleteFile: `${API_BASE_URL}/deleteFile`,
  createTicket: `${API_BASE_URL}/createTicket`,
  quickLink: `${API_BASE_URL}/quickLink`
};

// Also define necessary interfaces here
export interface ChatHistoryItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface TicketDetails {
  subject: string;
  description: string;
  priority?: 'low' | 'medium' | 'high';
  category?: string;
  email?: string;
  [key: string]: unknown;
}

export interface ApiResponse {
  subject?: any;
  createdAt?: string;
  ticketId?: string;
  status?: string;
  fileUrl?: string;
  fileId?: string | undefined;
  success?: boolean;
  data?: unknown;
  error?: string;
  message?: string;
}

export function handleClientError(error: unknown, operation: string): never {
  const errorObj = error as Error;
  console.error(`Error ${operation}:`, errorObj);
  throw new Error(`Failed to ${operation}. Please try again.`);
}
```

#### 3. Update API Integration in Your Code
Modify `app/api/advancedApi.ts` to use Lambda endpoints:

```typescript
import {
  LAMBDA_ENDPOINTS,
  ChatHistoryItem,
  TicketDetails,
  ApiResponse,
  handleClientError
} from '../utils/lambdaApi';

// Update API functions to use Lambda endpoints
export async function processChatMessage(
  message: string,
  history: ChatHistoryItem[],
  attachments?: File[]
): Promise<ApiResponse> {
  try {
    // Create form data
    const formData = new FormData();
    formData.append('message', message);
    formData.append('history', JSON.stringify(history));

    // Add file attachments if present
    if (attachments && attachments.length > 0) {
      const s3Files = attachments.map(file => {
        const uploadedFile = file as any;
        return {
          name: file.name,
          mimeType: file.type,
          s3Url: uploadedFile.s3Url || uploadedFile.url || uploadedFile.fileUrl,
          useCase: "CHAT"
        };
      });

      formData.append('s3Files', JSON.stringify(s3Files));
    }

    // Call Lambda API
    const response = await fetch(LAMBDA_ENDPOINTS.processChatMessage, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to process chat message');
    }

    return await response.json();
  } catch (error) {
    return handleClientError(error, 'process chat message');
  }
}

// Update other API functions similarly
```

#### 4. Build Your Next.js Application
```bash
# Set API base URL as environment variable
NEXT_PUBLIC_API_BASE_URL=https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev npm run build
```

This generates an `out` directory with static files.

#### 5. S3 and CloudFront Setup

1. **Create S3 Bucket**
   ```bash
   aws s3 mb s3://aseekbot-frontend-useast1 --region us-east-1
   ```

2. **Create CloudFront Origin Access Identity (OAI)**
   ```bash
   aws cloudfront create-cloud-front-origin-access-identity \
     --cloud-front-origin-access-identity-config \
     CallerReference=aseekbot-frontend-access,Comment="Access for aseekbot frontend"
   ```
   Note the OAI ID returned.

3. **Set S3 Bucket Policy for CloudFront**
   ```bash
   cat > bucket-policy.json << 'EOF'
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "AllowCloudFrontAccess",
         "Effect": "Allow",
         "Principal": {
           "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity YOUR_OAI_ID"
         },
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::aseekbot-frontend-useast1/*"
       }
     ]
   }
   EOF

   # Update with your OAI ID
   sed -i 's/YOUR_OAI_ID/YOUR_ACTUAL_OAI_ID/g' bucket-policy.json

   # Apply policy
   aws s3api put-bucket-policy --bucket aseekbot-frontend-useast1 --policy file://bucket-policy.json
   ```

4. **Upload Static Files to S3**
   ```bash
   aws s3 sync out/ s3://aseekbot-frontend-useast1/ --delete
   ```

5. **Create CloudFront Distribution**
   ```bash
   cat > cloudfront-config.json << 'EOF'
   {
     "CallerReference": "aseekbot-frontend-distribution",
     "Origins": {
       "Quantity": 1,
       "Items": [
         {
           "Id": "S3-aseekbot-frontend-useast1",
           "DomainName": "aseekbot-frontend-useast1.s3.amazonaws.com",
           "S3OriginConfig": {
             "OriginAccessIdentity": "origin-access-identity/cloudfront/YOUR_OAI_ID"
           }
         }
       ]
     },
     "DefaultCacheBehavior": {
       "TargetOriginId": "S3-aseekbot-frontend-useast1",
       "ViewerProtocolPolicy": "redirect-to-https",
       "MinTTL": 0,
       "ForwardedValues": {
         "QueryString": false,
         "Cookies": {
           "Forward": "none"
         }
       },
       "TrustedSigners": {
         "Enabled": false,
         "Quantity": 0
       }
     },
     "DefaultRootObject": "index.html",
     "CustomErrorResponses": {
       "Quantity": 1,
       "Items": [
         {
           "ErrorCode": 403,
           "ResponsePagePath": "/index.html",
           "ResponseCode": "200",
           "ErrorCachingMinTTL": 10
         }
       ]
     },
     "Comment": "Distribution for aseekbot-frontend",
     "Enabled": true
   }
   EOF

   # Update with your OAI ID
   sed -i 's/YOUR_OAI_ID/YOUR_ACTUAL_OAI_ID/g' cloudfront-config.json

   # Create distribution
   aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
   ```

6. **Wait for Distribution Deployment (5-15 minutes)**
   ```bash
   aws cloudfront list-distributions | grep -A 10 aseekbot
   ```

## Testing API Endpoints

### quickLink API
```bash
curl -X POST \
  https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev/quickLink \
  -H 'Content-Type: application/json' \
  -d '{"action": "getHelp"}'
```

### createTicket API
```bash
curl -X POST \
  https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev/createTicket \
  -H 'Content-Type: application/json' \
  -d '{"title": "Test Ticket", "description": "This is a test ticket", "email": "test@example.com"}'
```

### processChatMessage API
```bash
curl -X POST \
  https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev/processChatMessage \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Hello, how can you help me?",
    "sessionId": "test-session-123"
  }'
```

### File Upload API
```bash
curl -X POST \
  https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev/uploadFile \
  -F 'file=@/path/to/your/testfile.txt' \
  -F 'sessionId=test-session-123'
```

## Automation

Create a `deploy.sh` script for easier updates:

```bash
#!/bin/bash

# Variables
S3_BUCKET="aseekbot-frontend-useast1"
CLOUDFRONT_DISTRIBUTION_ID="YOUR_DISTRIBUTION_ID"

# Build the Next.js app
echo "Building Next.js app..."
NEXT_PUBLIC_API_BASE_URL=https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev npm run build

# Upload to S3
echo "Uploading to S3..."
aws s3 sync out/ s3://$S3_BUCKET --delete

# Invalidate CloudFront cache
echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"

echo "Frontend deployment complete!"
```

## Troubleshooting

### CORS Issues
If you encounter CORS errors when the frontend calls Lambda APIs:

1. Verify CORS is enabled in your serverless.yml config
2. Check that your Lambda functions include the appropriate CORS headers:
   ```javascript
   res.setHeader('Access-Control-Allow-Origin', '*');
   res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
   ```
3. Ensure your Lambda function handles OPTIONS requests

### S3 Access Issues
If CloudFront can't access S3 content:

1. Verify the bucket policy allows the correct CloudFront OAI
2. Check that objects exist in the S3 bucket with correct paths
3. Ensure CloudFront is configured with the correct S3 domain name

### API Gateway Errors
If Lambda APIs return errors:

1. Check CloudWatch logs for your Lambda functions
2. Verify proper IAM permissions for Lambda functions
3. Test API endpoints directly with curl commands

### Client-Side Routing Issues
If routes like `/about` return errors when accessed directly:

1. Verify the custom error response is set to redirect 403 errors to /index.html
2. Check that the cache TTL for error responses is set appropriately

## Development

### Local Development
```bash
npm run dev
```

### Environment Variables
For local development, create a `.env.local` file with:
```
NEXT_PUBLIC_API_BASE_URL=https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev
```

## Maintenance

### Updating the Application
1. Make your code changes
2. Build the application: `npm run build`
3. Upload to S3: `aws s3 sync out/ s3://aseekbot-frontend-useast1 --delete`
4. Create a CloudFront invalidation: `aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"`

### Updating API Functions
1. Make changes to Lambda function code
2. Deploy updates: `serverless deploy` or `serverless deploy function -f functionName`