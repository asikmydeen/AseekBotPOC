import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from '@aws-sdk/client-bedrock-agent-runtime';

// Constants for retry mechanism
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second base delay

// Define interfaces for type safety
interface S3Location {
  uri: string;
}

interface FileSource {
  sourceType: 'S3';
  s3Location: S3Location;
}

interface BinaryFileSource {
  byteContent: Uint8Array;
  mediaType: string;
}

interface FormattedFile {
  name: string;
  source: FileSource | BinaryFileSource;
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

// File information for direct binary uploads
export interface BinaryFileInfo {
  name: string;
  content: Uint8Array;
  type: string;
  useCase?: string;
}

// File information for S3-based files
export interface S3FileInfo {
  name: string;
  s3Url: string;
  mimeType: string;
  useCase?: string;
}

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

/**
 * Transforms an S3 HTTPS URL to S3 URI format (s3://bucket/key)
 * @param s3Url The HTTPS URL to transform
 * @returns The S3 URI
 */
function transformS3Url(s3Url: string): string {
  if (!s3Url.startsWith('https://')) {
    return s3Url; // Already in the correct format or not an HTTPS URL
  }

  try {
    const url = new URL(s3Url);
    const hostnameParts = url.hostname.split('.');
    const bucketName = hostnameParts[0];
    const key = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
    return `s3://${bucketName}/${key}`;
  } catch (error) {
    console.error('Error transforming S3 URL:', error, 'Original URL:', s3Url);
    return s3Url; // Return original URL if transformation fails
  }
}

/**
 * Normalizes the useCase value for Bedrock agent
 * @param useCase The original useCase value
 * @returns The normalized useCase value
 */
function normalizeUseCase(useCase?: string): string {
  if (!useCase) return 'CHAT';
  
  // Special handling for bid-analysis to convert it to CODE_INTERPRETER
  if (useCase.toLowerCase() === 'bid-analysis') {
    return 'CODE_INTERPRETER';
  }
  
  return useCase;
}

/**
 * Invokes the Amazon Bedrock agent with the given parameters
 * @param prompt - The user's message to send to the agent
 * @param sessionId - The session ID for conversation continuity
 * @param options - Optional configuration parameters
 * @returns Object containing sessionId and completion (agent's response)
 */
export async function invokeBedrockAgent(
  prompt: string,
  sessionId: string,
  options?: {
    binaryFile?: BinaryFileInfo;
    s3Files?: S3FileInfo[];
    agentId?: string;
    agentAliasId?: string;
    region?: string;
  }
) {
  // Initialize the Bedrock agent client with the specified region or default to us-east-1
  const client = new BedrockAgentRuntimeClient({
    region: options?.region || 'us-east-1',
  });

  // Set agent configuration parameters with defaults
  const agentId = options?.agentId || 'AJBHXXILZN';
  const agentAliasId = options?.agentAliasId || 'AVKP1ITZAA';

  // Prepare the command input
  const commandInput: CommandInput = {
    agentId,
    agentAliasId,
    sessionId,
    inputText: prompt,
  };

  // Process files if provided
  const files: FormattedFile[] = [];

  // Add binary file if provided
  if (options?.binaryFile) {
    const { name, content, type, useCase } = options.binaryFile;
    files.push({
      name,
      source: {
        byteContent: content,
        mediaType: type,
      },
      useCase: normalizeUseCase(useCase),
    });
  }

  // Add S3 files if provided
  if (options?.s3Files && options.s3Files.length > 0) {
    options.s3Files.forEach(file => {
      const uri = transformS3Url(file.s3Url);
      console.log(`Transformed S3 URI for file ${file.name}:`, uri);
      
      files.push({
        name: file.name,
        source: {
          sourceType: 'S3',
          s3Location: {
            uri,
          },
        },
        useCase: normalizeUseCase(file.useCase),
      });
    });
  }

  // Add files to sessionState if any exist
  if (files.length > 0) {
    commandInput.sessionState = {
      files,
    };
  }

  // Log the command input for debugging
  console.log('Invoking Bedrock agent with payload:', JSON.stringify(commandInput, null, 2));

  // Create the command
  const command = new InvokeAgentCommand(commandInput);

  try {
    // Send the command with retry logic
    const response = await retryWithExponentialBackoff(() => client.send(command));

    // Process the streaming response
    let completion = '';

    if (response.completion) {
      for await (const chunk of response.completion) {
        if (chunk.chunk?.bytes) {
          // Decode the chunk and append to the completion
          const decoder = new TextDecoder();
          const text = decoder.decode(chunk.chunk.bytes);
          completion += text;
        }
      }
    }

    return {
      sessionId,
      completion,
    };
  } catch (error) {
    console.error('Error invoking Bedrock agent:', error);
    throw error;
  }
}