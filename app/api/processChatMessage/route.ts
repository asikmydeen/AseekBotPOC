import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { invokeBedrockAgent, S3FileInfo } from '@/app/utils/invokeBedrockAgent';
import { handleApiError } from '@/app/utils/apiErrorHandler';

// Define interface for type safety
interface UploadedFile {
  name: string;
  mimeType: string;
  s3Url: string;
  useCase?: string;
}

/**
 * Handles POST requests to process chat messages with the Bedrock agent
 * @param req The incoming request object
 * @returns A NextResponse with the agent's response or error details
 */
export async function POST(req: Request) {
  try {
    // Extract form data using the formData() method
    const formData = await req.formData();

    // Extract message (prompt) and sessionId from form data
    const prompt = formData.get('message') as string;
    let sessionId = formData.get('sessionId') as string;

    // Generate a sessionId if not provided
    if (!sessionId) {
      sessionId = uuidv4();
    }

    // Process S3 file references if any
    const s3Files = formData.get('s3Files') as string;
    let parsedFiles: UploadedFile[] | undefined;
    let s3FileInfos: S3FileInfo[] = [];

    if (s3Files) {
      try {
        parsedFiles = JSON.parse(s3Files);
        console.log('Parsed S3 files:', JSON.stringify(parsedFiles, null, 2));

        // Convert to S3FileInfo format for the invokeBedrockAgent utility
        if (parsedFiles && parsedFiles.length > 0) {
          s3FileInfos = parsedFiles.map(file => ({
            name: file.name,
            s3Url: file.s3Url,
            mimeType: file.mimeType,
            useCase: file.useCase
          }));
        }
      } catch (error) {
        console.error('Error parsing s3Files:', error);
      }
    }

    // Invoke the Bedrock agent using the utility function
    const response = await invokeBedrockAgent(prompt, sessionId, {
      s3Files: s3FileInfos.length > 0 ? s3FileInfos : undefined,
      agentId: '7FDALECWCL',
      agentAliasId: 'NMGKRJLDQQ',
      region: 'us-east-1'
    });

    // Return the response
    return NextResponse.json({
      message: response.completion,
      sessionId: response.sessionId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error processing chat message:', error);
    return handleApiError(error);
  }
}
