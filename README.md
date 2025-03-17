# AseekBot - AI-Powered Procurement Assistant

## Project Overview

AseekBot is an AI-powered chatbot built with Next.js that integrates AWS Bedrock for processing user queries, file analysis, and other procurement-related tasks. It leverages various UI components and hooks to enable functionalities such as file uploads, ticket creation, quick links, and multimedia support.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Features

- **AI-Powered Chat Interface**: Answers procurement and data center queries using AWS Bedrock
- **Document Analysis**: Upload and analyze files with AWS S3 integration
- **Ticket Creation System**: Triggers support tickets for unresolved queries
- **Quick Links**: Access common operations like bid document analysis, supplier search, database queries, hardware compatibility checks
- **PDF Export**: Save chat sessions for future reference
- **Theme Support**: Toggle between light and dark mode using a context provider
- **Multiple Agent Types**: Specialized agents for different operations (bid-analysis, technical-support, supplier-search, product-comparison)

## Installation and Setup

### Prerequisites
- Node.js (version recommended by Next.js)
- AWS credentials for AWS services integration

### Installation Steps
1. Clone the repository
2. Navigate to the `aseekbot` directory
3. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

### Configuration
- **Environment Variables**: Create a `.env.local` file with the following variables:
  ```
  AWS_REGION=your-aws-region
  AWS_S3_BUCKET_NAME=your-s3-bucket-name
  # Add other required AWS service credentials
  ```

- **Configuration Files**:
  - `next.config.js`: Next.js configuration
  - `tailwind.config.js`: Tailwind CSS configuration
  - `tsconfig.json`: TypeScript configuration

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Usage

### Chat Interface
- The main interface consists of a sidebar and chat area
- Type your procurement or data center related queries in the chat input
- The AI will process your query and provide relevant responses

### Quick Links
- Access the sidebar to use quick links for common operations:
  - Bid document analysis
  - Supplier search
  - Database queries
  - Hardware compatibility checks
  - And more specialized operations

### File Upload
1. Click the file upload button in the chat interface
2. Select a file from your device
3. The file will be uploaded to AWS S3
4. The AI will analyze the document and provide insights

### Ticket Creation
- If the AI cannot resolve your query, use the "Create Ticket" option
- Fill in the required details in the ticket form
- Submit to create a support ticket for further assistance

### Additional Features
- **PDF Export**: Click the export button to save your chat history as a PDF
- **Theme Toggle**: Switch between light and dark mode using the theme toggle in the sidebar
- **Feedback**: Provide feedback on AI responses to help improve the system

## API Endpoints and Operations

The application includes several API endpoints:

- **/api/processChatMessage**: Processes user queries by invoking AWS Bedrock Agent and handling file references
- **/api/uploadFile**: Handles file uploads to AWS S3
- **/api/createTicket**: Creates a procurement ticket with the provided details
- **/api/quickLink**: Processes quick link actions from the Sidebar

## Project Structure

```
aseekbot/
├── app/
│   ├── api/                 # API routes
│   ├── components/          # UI components
│   │   ├── chat/            # Chat-related components
│   │   ├── sidebar/         # Sidebar components
│   │   └── ui/              # Reusable UI components
│   ├── hooks/               # Custom React hooks
│   ├── lib/                 # Utility functions
│   ├── providers/           # Context providers
│   └── page.tsx             # Main page component
├── public/                  # Static assets
├── styles/                  # CSS styles
├── next.config.js           # Next.js configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Project dependencies
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Troubleshooting and AWS IAM/S3 Permissions

### Common Issues

- **Chat Response Errors**: Verify AWS Bedrock service is properly configured and accessible
- **File Upload Failures**: Check S3 bucket permissions and AWS credentials
- **Agent Response Timeouts**: Large files or complex queries may require longer processing times

### AWS IAM and S3 Permissions

If you encounter the error `Unable to download specified S3 file. Check the permissions of your agent execution role and try again` when your Bedrock agent attempts to access files in S3, follow these steps to configure the necessary permissions:

### Required IAM Role Permissions

The IAM execution role used by your Bedrock agent must have the following permissions:

1. Create or update the IAM policy attached to your Bedrock agent's execution role with the following permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::aseek-bot-uploads",
        "arn:aws:s3:::aseek-bot-uploads/uploads/*"
      ]
    }
  ]
}
```

2. Ensure the role has a trust relationship with Bedrock:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "bedrock.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

### S3 Bucket Policy Configuration

Additionally, you may need to update the S3 bucket policy to explicitly allow access from your Bedrock agent's execution role:

1. Navigate to your S3 bucket in the AWS Management Console
2. Go to the "Permissions" tab
3. Edit the "Bucket Policy" and add the following statement:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::<your-account-id>:role/<your-bedrock-agent-role-name>"
      },
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::aseek-bot-uploads",
        "arn:aws:s3:::aseek-bot-uploads/uploads/*"
      ]
    }
  ]
}
```

Replace `<your-account-id>` and `<your-bedrock-agent-role-name>` with your actual AWS account ID and the name of the IAM role used by your Bedrock agent.

### Troubleshooting Tips

- Verify that the S3 URI format in your code is correct: `s3://aseek-bot-uploads/uploads/filename.ext`
- Check CloudTrail logs for access denied errors to identify permission issues
- Test the permissions by assuming the role and attempting to access the S3 objects using AWS CLI

### Additional Resources

- [AWS Bedrock Agent Permissions](https://docs.aws.amazon.com/bedrock/latest/userguide/agents-permissions.html)
- [Amazon S3 IAM Policies](https://docs.aws.amazon.com/AmazonS3/latest/userguide/example-policies-s3.html)
- [IAM Roles for AWS Services](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-service.html)
- [S3 Bucket Policy Examples](https://docs.aws.amazon.com/AmazonS3/latest/userguide/example-bucket-policies.html)

## Contribution Guidelines

We welcome contributions to improve AseekBot:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style and patterns
- Write tests for new features
- Update documentation for any changes
- Ensure all tests pass before submitting a pull request

### Reporting Issues
- Use the GitHub issue tracker to report bugs
- Include detailed steps to reproduce the issue
- Specify the version of the application you're using
