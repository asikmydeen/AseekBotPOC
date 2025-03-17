import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
});

/**
 * Handles file upload requests
 * @param req The incoming request containing the file to upload
 * @returns JSON response with the uploaded file URL or error message
 */
export async function POST(req: NextRequest) {
  try {
    // Parse the form data from the request
    const formData = await req.formData();

    // Extract the file and sessionId from the form data
    const file = formData.get('file') as File | null;
    const sessionId = formData.get('sessionId') as string | null;

    // Validate inputs
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get file details
    const fileName = file.name;
    const fileType = file.type;
    const fileSize = file.size;

    console.log(`Processing upload for file: ${fileName}, type: ${fileType}, size: ${fileSize} bytes, sessionId: ${sessionId}`);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a sanitized filename and unique S3 key
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const s3Key = `uploads/${sessionId}/${timestamp}_${sanitizedFileName}`;

    // Get bucket name from environment variable
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    if (!bucketName) {
      console.error('AWS_S3_BUCKET_NAME environment variable is not set');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    try {
      // Upload file to S3
      const uploadParams = {
        Bucket: bucketName,
        Key: s3Key,
        Body: buffer,
        ContentType: fileType
      };

      const command = new PutObjectCommand(uploadParams);
      await s3Client.send(command);

      // Construct the S3 URL
      const region = process.env.AWS_REGION || 'us-east-1';
      const fileUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;

      // Return success response with the file URL
      return NextResponse.json({
        success: true,
        fileUrl: fileUrl,
        fileName: fileName,
        fileType: fileType,
        fileSize: fileSize
      });
    } catch (error) {
      console.error('Error uploading file to S3:', error);
      return NextResponse.json(
        { error: 'Failed to upload file to S3' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error processing file upload:', error);
    return NextResponse.json(
      { error: 'Failed to process file upload' },
      { status: 500 }
    );
  }
}
