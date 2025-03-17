import { NextRequest, NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

export async function POST(req: NextRequest) {
  try {
    const { s3Key } = await req.json();
    if (!s3Key) {
      return NextResponse.json({ error: 'No S3 key provided' }, { status: 400 });
    }
    
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    if (!bucketName) {
      console.error('AWS_S3_BUCKET_NAME environment variable is not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    const deleteParams = { Bucket: bucketName, Key: s3Key };
    const command = new DeleteObjectCommand(deleteParams);
    await s3Client.send(command);
    
    return NextResponse.json({ success: true, message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    return NextResponse.json({ error: 'Failed to delete file from S3' }, { status: 500 });
  }
}