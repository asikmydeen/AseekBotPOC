# AseekBot: Data Center Procurement Assistant

AseekBot is an AI-powered chatbot application designed to streamline data center procurement tasks. It helps users analyze bid documents, compare suppliers, and make informed procurement decisions through natural language interactions.

## Features

- **Intelligent Chat Interface**: Natural conversation with AI-powered responses with persistent chat history
- **Document Analysis**: Upload and analyze procurement documents and bid specifications
- **Multi-format Support**: Process various file formats including PDF, DOCX, XLSX, CSV
- **Ticket Creation**: Generate support tickets directly from conversations
- **Dark/Light Mode**: Customizable UI experience with theme switching
- **Mobile Responsive**: Optimized for both desktop and mobile experiences

## Architecture

The application uses a serverless architecture built on AWS:

- **Frontend**: Next.js React application (static site)
- **Backend**: AWS Lambda functions for API endpoints
- **Storage**: Amazon S3 for file storage, DynamoDB for chat history persistence
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
  chatId?: string;
  messageOrder?: number;
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

#### 3. API Integration
The application now uses Lambda endpoints for all API functionality:

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
  attachments?: File[],
  chatId?: string
): Promise<ApiResponse> {
  try {
    // Create form data
    const formData = new FormData();
    formData.append('message', message);
    formData.append('history', JSON.stringify(history));

    // Include chatId if it exists (for continuing conversations)
    if (chatId) {
      formData.append('chatId', chatId);
    }

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

## Chat Continuity and Persistence

AseekBot maintains chat continuity across user sessions by persisting chat history in both the frontend (localStorage) and backend (DynamoDB). This ensures that conversations can be continued seamlessly, even if the user refreshes the page or returns later.

### Frontend Chat Persistence

The frontend stores chat information in localStorage using the following pattern:

```typescript
// Store chat history and chatId in localStorage
const storeChatInLocalStorage = (chatId: string, history: ChatHistoryItem[]) => {
  // Store the chatId for the current conversation
  localStorage.setItem('aseekbot_current_chatId', chatId);

  // Store the chat history with the chatId as key
  localStorage.setItem(`aseekbot_chat_${chatId}`, JSON.stringify(history));

  // Keep track of all conversations
  const allChats = JSON.parse(localStorage.getItem('aseekbot_all_chats') || '[]');
  if (!allChats.includes(chatId)) {
    allChats.push(chatId);
    localStorage.setItem('aseekbot_all_chats', JSON.stringify(allChats));
  }
};

// Retrieve chat history from localStorage
const getChatFromLocalStorage = (chatId: string): ChatHistoryItem[] => {
  const chatHistory = localStorage.getItem(`aseekbot_chat_${chatId}`);
  return chatHistory ? JSON.parse(chatHistory) : [];
};

// Get current or most recent chatId
const getCurrentChatId = (): string | null => {
  return localStorage.getItem('aseekbot_current_chatId');
};
```

### Backend Chat Persistence

The backend stores chat messages in DynamoDB with the following schema:

| Field         | Type     | Description                                      |
|---------------|----------|--------------------------------------------------|
| chatId        | String   | Unique identifier for the conversation           |
| messageId     | String   | Unique identifier for each message               |
| messageOrder  | Number   | Sequential order of messages in the conversation |
| userId        | String   | User identifier                                  |
| role          | String   | 'user' or 'assistant'                            |
| content       | String   | Message content                                  |
| timestamp     | Number   | Unix timestamp when message was created          |
| metadata      | Object   | Additional message metadata                      |

When the backend receives a chat message request:
1. If a `chatId` is provided, it uses that existing chatId
2. If no `chatId` is provided, it generates a new UUID for the conversation
3. It queries DynamoDB to determine the next `messageOrder` value for the given `chatId`
4. It stores both the user message and the assistant's response with sequential `messageOrder` values

## Testing API Endpoints

### Testing Chat Message Ordering
To verify that message ordering works correctly:

1. Send an initial message to create a new chat:
```bash
curl -X POST \
  https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev/processChatMessage \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Initial message",
    "sessionId": "test-session-123"
  }'
```

2. Extract the `chatId` from the response.

3. Send a follow-up message using the same `chatId`:
```bash
curl -X POST \
  https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev/processChatMessage \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "Follow-up message",
    "sessionId": "test-session-123",
    "chatId": "chat-id-from-previous-response"
  }'
```

4. Verify that the `messageOrder` in the response has incremented (should be 2 for the second message).

5. Continue sending messages with the same `chatId` to verify that `messageOrder` continues to increment correctly.

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
    "sessionId": "test-session-123",
    "chatId": "existing-chat-id-456"
  }'
```

**Note**: When continuing an existing conversation, always include the `chatId` from previous responses to maintain message ordering. The backend will use this existing chatId instead of generating a new one, ensuring that message order increments correctly within the same conversation and is properly stored in DynamoDB.

#### Sample Request/Response for Chat Continuity

**Initial Message (New Conversation):**
```json
// Request
{
  "message": "Hello, I need help with data center procurement",
  "sessionId": "user-session-123"
}

// Response
{
  "chatId": "chat-abc-123",
  "messageOrder": 1,
  "content": "Hello! I'd be happy to help with your data center procurement needs. What specific information are you looking for?",
  "timestamp": 1679456789
}
```

**Follow-up Message (Continuing Conversation):**
```json
// Request
{
  "message": "I need to compare server specifications",
  "sessionId": "user-session-123",
  "chatId": "chat-abc-123"
}

// Response
{
  "chatId": "chat-abc-123",
  "messageOrder": 2,
  "content": "I can help you compare server specifications. Could you provide details about the servers you're considering?",
  "timestamp": 1679456820
}
```

### File Download API
```bash
curl -X GET \
  "https://your-api-gateway-url.execute-api.us-east-1.amazonaws.com/dev/files/download?fileKey=path/to/file.ext"
```

Response format:
```json
{
  "url": "https://s3-presigned-url-for-download..."
}
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

### File Download Issues
When using the downloadFile Lambda function:

1. The Lambda returns a JSON response with the presigned URL in the `url` property: `{ "url": "https://s3-presigned-url..." }`
2. Client-side code should extract this URL from the response object:
   ```javascript
   // Example of extracting the URL from the Lambda response
   const response = await API.get('files', '/download', {
     queryStringParameters: { fileKey: 'path/to/file.ext' }
   });
   const presignedUrl = response.url;
   ```
3. Do not attempt to use the entire response object as the URL - this will cause signature validation errors

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
4. Configure proper CORS settings for your S3 bucket to allow presigned URL operations:

   **Important Note**: The S3 bucket used for file downloads (`aseek-bot-uploads`) must have its CORS configuration updated separately from the API Gateway CORS setup. This is critical for presigned URL operations to work correctly in browser environments. Use the following command to configure CORS for the uploads bucket:

   ```bash
   aws s3api put-bucket-cors --bucket aseek-bot-uploads --cors-configuration '{
     "CORSRules": [
       {
         "AllowedHeaders": ["*"],
         "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
         "AllowedOrigins": ["*"],
         "ExposeHeaders": ["ETag", "x-amz-meta-custom-header", "x-amz-server-side-encryption", "x-amz-request-id", "x-amz-id-2", "x-amz-checksum-mode"],
         "MaxAgeSeconds": 3000
       }
     ]
   }'
   ```

   Note: For production environments, replace the wildcard `"*"` in `AllowedOrigins` with your specific domain(s).

5. Ensure your presigned URL generation code includes necessary parameters to handle CORS requirements, particularly when using the URL in browser environments:
   ```javascript
   // Example of proper presigned URL generation with CORS considerations
   const presignedUrl = s3.getSignedUrl('getObject', {
     Bucket: 'aseek-bot-uploads',
     Key: 'path/to/file.ext',
     Expires: 3600, // URL expiration time in seconds
   });
   ```

   If you're experiencing CORS errors when downloading files, make sure both the bucket policy (which allows the necessary actions) and the CORS configuration (which allows cross-origin requests) are properly set up for the `aseek-bot-uploads` bucket.

### API Gateway Errors
If Lambda APIs return errors:

1. Check CloudWatch logs for your Lambda functions
2. Verify proper IAM permissions for Lambda functions
3. Test API endpoints directly with curl commands

### Chat Message Ordering Issues
If messages are not maintaining the correct order in conversations:

1. Ensure the frontend is passing the same `chatId` for all messages in a conversation
2. Verify that the `chatId` from the initial response is being stored in localStorage and reused for subsequent messages
3. Check that the backend is not generating a new `chatId` when one is already provided
4. Examine the Lambda logs to confirm the `messageOrder` calculation is using the provided `chatId`
5. Verify that DynamoDB queries are correctly filtering by the provided `chatId` when determining the next `messageOrder`
6. Check that the DynamoDB table has the correct indexes set up for efficient querying by `chatId`
7. Test with explicit `chatId` values using the curl commands in the Testing section

### Client-Side Routing Issues
If routes like `/about` return errors when accessed directly:

1. Verify the custom error response is set to redirect 403 errors to /index.html
2. Check that the cache TTL for error responses is set appropriately

## Development

### Local Development
```bash
npm run dev
```

### Frontend Chat Implementation
When implementing chat functionality in the frontend:

1. Store the `chatId` returned from the initial message response in localStorage
2. Include this `chatId` in all subsequent requests for the same conversation
3. Example implementation:

```typescript
// Check if we have an existing chatId in localStorage
let chatId = localStorage.getItem('aseekbot_current_chatId');

// If no existing chatId, this is a new conversation
if (!chatId) {
  const initialResponse = await processChatMessage(message, history);
  chatId = initialResponse.chatId;

  // Store the new chatId in localStorage
  localStorage.setItem('aseekbot_current_chatId', chatId);

  // Also store the updated history
  const updatedHistory = [
    ...history,
    { role: 'user', content: message },
    { role: 'assistant', content: initialResponse.content }
  ];
  localStorage.setItem(`aseekbot_chat_${chatId}`, JSON.stringify(updatedHistory));
} else {
  // This is a continuing conversation, use the existing chatId
  const followUpResponse = await processChatMessage(
    nextMessage,
    updatedHistory,
    attachments,
    chatId  // Pass the stored chatId from localStorage
  );

  // Update the stored history with the new messages
  const latestHistory = [
    ...updatedHistory,
    { role: 'assistant', content: followUpResponse.content }
  ];
  localStorage.setItem(`aseekbot_chat_${chatId}`, JSON.stringify(latestHistory));
}
```

This implementation ensures that:
1. Chat history persists across page refreshes
2. The same `chatId` is used for all messages in a conversation
3. The backend can maintain correct message ordering in DynamoDB
4. Users can continue conversations where they left off

This ensures message ordering is maintained throughout the conversation and prevents the backend from resetting the message counter.

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


## Making Changes and Redeployment

AseekBot uses a streamlined deployment process with a single script that handles both frontend and backend deployments. Follow these steps when making changes to the application.

### Architecture Note

The application has been fully migrated to use AWS Lambda functions and API Gateway endpoints. All API functionality previously handled by Next.js API routes under the `app/api` directory has been moved to Lambda functions. The frontend components now directly call these Lambda endpoints through the API Gateway.

### Using the Deployment Script

We provide a comprehensive deployment script (`deploy.sh`) in the root directory that simplifies the update process.

#### Basic Usage

```bash
# Make the script executable (first time only)
chmod +x deploy.sh

# Run the deployment script
./deploy.sh
