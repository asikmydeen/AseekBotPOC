import { NextResponse } from 'next/server';
import { BedrockAgentRuntimeClient, InvokeAgentCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { v4 as uuidv4 } from 'uuid';

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
      agentAliasId: 'OHSM2XQ0MZ',
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
        let useCase = 'CHAT'; // Default value
        if (file.useCase) {
          useCase = file.useCase === 'bid-analysis' ? 'CODE_INTERPRETER' : file.useCase;
        }

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

    // Create and send the command
    console.log('Invoking Bedrock agent with payload:', JSON.stringify(commandInput, null, 2));
    const command = new InvokeAgentCommand(commandInput);
    const response = await client.send(command);

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

    // Check if error might be related to S3 permissions
    if ((error as Error).message.includes('S3') ||
        (error as Error).message.includes('AccessDenied') ||
        (error as Error).message.includes('Unable to download')) {
      console.error('This may be due to insufficient S3 permissions. Verify that your Bedrock agent execution role has proper access to the S3 bucket and objects.');
      console.error('Make sure the S3 URI format is correct and the bucket policy allows the agent role to access the objects.');
    }

    // Error handling with appropriate status code
    return NextResponse.json(
      { error: 'Failed to process chat message', details: (error as Error).message },
      { status: 500 }
    );
  }
}
