import { NextResponse } from 'next/server';
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { v4 as uuidv4 } from 'uuid';

// Constants for retry mechanism
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second base delay

/**
 * Retry an async operation with exponential backoff and jitter
 * @param operation The async operation to retry
 * @returns The result of the operation
 * @throws The last error encountered if all retries fail
 */
async function retryWithExponentialBackoff<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: Error = new Error('Operation failed after maximum retries');

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable
      const isRetryable =
        error instanceof Error &&
        (error.message.includes('DependencyFailedException') ||
         error.message.includes('timeout') ||
         error.message.includes('Try the request again'));

      if (!isRetryable) {
        throw error; // Don't retry non-retryable errors
      }

      console.error('Retry attempt failed with error:', error);

      if (attempt < MAX_RETRIES - 1) {
        // Calculate delay with exponential backoff and jitter
        const delay = BASE_DELAY * Math.pow(2, attempt) * (0.5 + Math.random() * 0.5);
        console.log(`Retrying operation after ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // If we've exhausted all retries
  throw lastError;
}

// Define interfaces for type safety
interface UploadedFile {
  name: string;
  mimeType: string;
  s3Url: string;
  useCase?: string;
}

interface S3Location {
  uri: string;
}

interface FileSource {
  sourceType: "S3";
  s3Location: S3Location;
}

interface FormattedFile {
  name: string;
  source: FileSource;
  useCase: string;
}

interface SessionState {
  files: FormattedFile[];
}

interface CommandInput {
  agentId: string;
  agentAliasId: string;
  sessionId: string;
  inputText: string;
  sessionState?: SessionState;
}

// This is the App Router version of the processChatMessage API endpoint
// Instead of exporting a default handler function, we export HTTP method handlers directly

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

    if (s3Files) {
      try {
        parsedFiles = JSON.parse(s3Files);
        console.log('Parsed S3 files:', JSON.stringify(parsedFiles, null, 2));
      } catch (error) {
        console.error('Error parsing s3Files:', error);
      }
    }

    // Initialize the Bedrock Agent Runtime client
    const client = new BedrockAgentRuntimeClient({ region: 'us-east-1' });

    // Build the command input
    const commandInput: CommandInput = {
      agentId: '7FDALECWCL',
      agentAliasId: '11OBDAVIQQ',
      sessionId,
      inputText: prompt,
    };

    // Add S3 file references to sessionState if they exist
    if (parsedFiles && parsedFiles.length > 0) {
      // Format files according to Bedrock API requirements
      const formattedFiles = parsedFiles.map(file => {
        // Transform HTTPS URL to S3 URI format
        let uri = file.s3Url;
        if (file.s3Url.startsWith('https://')) {
          try {
            const url = new URL(file.s3Url);
            const hostnameParts = url.hostname.split('.');
            const bucketName = hostnameParts[0];
            const key = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
            uri = `s3://${bucketName}/${key}`;
          } catch (error) {
            console.error('Error transforming S3 URL:', error, 'Original URL:', file.s3Url);
          }
        }

        // Log the final S3 URI for debugging
        console.log(`Transformed S3 URI for file ${file.name}:`, uri);

        // Determine the useCase value
        // Special handling for bid-analysis to convert it to CODE_INTERPRETER
        let useCase = file.useCase ? (file.useCase === 'bid-analysis' ? 'CODE_INTERPRETER' : file.useCase) : 'CHAT';

        return {
          name: file.name,
          source: {
            sourceType: "S3",
            s3Location: {
              uri: uri
            }
          },
          useCase: useCase
        };
      });

      commandInput.sessionState = {
        files: formattedFiles
      };
    }

    // Create and send the command with retry logic
    console.log('Invoking Bedrock agent with payload:', JSON.stringify(commandInput, null, 2));
    const command = new InvokeAgentCommand(commandInput);
    const response = await retryWithExponentialBackoff(() => client.send(command));

    // Process the streaming response
    let completion = '';
    if (response.completion) {
      for await (const chunkEvent of response.completion) {
        if (chunkEvent.chunk?.bytes) {
          const decodedChunk = new TextDecoder('utf-8').decode(chunkEvent.chunk.bytes);
          completion += decodedChunk;
        }
      }
    }

    // Return the response
    return NextResponse.json({
      message: completion,
      sessionId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error processing chat message:', error);
    const errorMessage = (error as Error).message;

    // S3 permission related errors
    if (errorMessage.includes('S3') ||
        errorMessage.includes('AccessDenied') ||
        errorMessage.includes('Unable to download') ||
        errorMessage.includes('access denied')) {
      console.error('This may be due to insufficient S3 permissions. Verify that your Bedrock agent execution role has proper access to the S3 bucket and objects.');
      console.error('Make sure the S3 URI format is correct and the bucket policy allows the agent role to access the objects.');

      return NextResponse.json({
        error: 'File access error',
        message: 'Unable to access the uploaded file(s)',
        details: errorMessage,
        suggestions: [
          'Verify that the S3 bucket permissions are correctly configured',
          'Check that the file exists in the specified location',
          'Ensure the Bedrock agent has the necessary IAM permissions to access the S3 bucket'
        ]
      }, { status: 403 });
    }

    // Bedrock timeout or dependency errors
    if (errorMessage.includes('timeout') ||
        errorMessage.includes('DependencyFailedException') ||
        errorMessage.includes('Try the request again') ||
        errorMessage.includes('service is currently unavailable')) {

      return NextResponse.json({
        error: 'Service temporarily unavailable',
        message: 'The AI service is currently experiencing high load or temporary issues',
        details: errorMessage,
        suggestions: [
          'Please try your request again in a few moments',
          'Consider simplifying your query or breaking it into smaller parts',
          'If you uploaded a large file, try with a smaller file'
        ]
      }, { status: 503 });
    }

    // Validation errors
    if (errorMessage.includes('validation') ||
        errorMessage.includes('invalid') ||
        errorMessage.includes('malformed')) {

      return NextResponse.json({
        error: 'Invalid request',
        message: 'The request contains invalid parameters or formatting',
        details: errorMessage,
        suggestions: [
          'Check the format of your request',
          'Ensure all required parameters are provided correctly',
          'Verify that file references are properly formatted'
        ]
      }, { status: 400 });
    }

    // Generic catch-all for other errors
    return NextResponse.json({
      error: 'Failed to process chat message',
      message: 'An unexpected error occurred while processing your request',
      details: errorMessage,
      suggestions: [
        'Try your request again',
        'If the problem persists, contact support with the error details'
      ]
    }, { status: 500 });
  }
}
