import { NextResponse, NextRequest } from 'next/server';
import {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} from '@aws-sdk/client-bedrock-agent-runtime';

// Define interface for command input
interface CommandInput {
  agentId: string;
  agentAliasId: string;
  sessionId: string;
  inputText: string;
  sessionState?: {
    files: Array<{
      name: string;
      source: {
        byteContent: Uint8Array;
        mediaType: string;
      };
      useCase: string;
    }>;
  };
}

/**
 * Invokes the Amazon Bedrock agent with the given prompt and session ID
 * @param prompt - The user's message to send to the agent
 * @param sessionId - The session ID for conversation continuity
 * @param fileInfo - Optional file information if a file is attached
 * @returns Object containing sessionId and completion (agent's response)
 */
async function invokeBedrockAgent(
  prompt: string,
  sessionId: string,
  fileInfo?: { name: string; content: Uint8Array; type: string }
) {
  // Initialize the Bedrock agent client
  const client = new BedrockAgentRuntimeClient({
    region: 'us-east-1', // Use the appropriate region
  });

  // Set agent configuration parameters
  const agentId = 'AJBHXXILZN';
  const agentAliasId = 'AVKP1ITZAA';

  // Prepare the command input
  const commandInput: CommandInput = {
    agentId,
    agentAliasId,
    sessionId,
    inputText: prompt,
  };

  // If a file is attached, include it in the sessionState
  if (fileInfo) {
    commandInput.sessionState = {
      files: [
        {
          name: fileInfo.name,
          source: {
            // Using byteContent for direct binary data approach
            byteContent: fileInfo.content,
            mediaType: fileInfo.type,
          },
          useCase: 'CHAT',
        },
      ],
    };
  }

  // Create and send the command
  const command = new InvokeAgentCommand(commandInput);

  try {
    const response = await client.send(command);

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

/**
 * POST handler for the processMessage API route
 * Processes incoming messages and sends them to the Bedrock agent
 */
export async function POST(req: NextRequest) {
  try {
    // Parse the incoming form data
    const formData = await req.formData();

    // Extract prompt and sessionId
    const prompt = formData.get('prompt') as string;
    const sessionId = formData.get('sessionId') as string;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Check if a file is attached
    let fileInfo;

    // Look for any field with key starting with 'file'
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file') && value instanceof Blob) {
        const file = value as File;

        // Read the file as binary data
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        fileInfo = {
          name: file.name,
          content: uint8Array,
          type: file.type,
        };

        break; // Process only the first file for now
      }
    }

    // Invoke the Bedrock agent
    const result = await invokeBedrockAgent(prompt, sessionId, fileInfo);

    // Transform the response to match the expected format in the Message component
    const transformedResponse = {
      text: result.completion, // Rename 'message' to 'text' for the Message component
      sessionId: result.sessionId,
      timestamp: new Date().toISOString(), // Add timestamp for the Message component
    };

    // Return the transformed response
    return NextResponse.json(transformedResponse);
  } catch (error) {
    console.error('Error processing message:', error);

    return NextResponse.json(
      { error: 'Failed to process message', details: (error as Error).message },
      { status: 500 }
    );
  }
}
