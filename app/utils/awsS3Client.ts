import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 client with region from environment variables
const s3 = new S3Client({ 
  region: process.env.AWS_REGION 
});

// Export the PutObjectCommand for convenience
export { PutObjectCommand };

// Export the S3 client as default
export default s3;