import { NextResponse, NextRequest } from 'next/server';
import { invokeBedrockAgent, BinaryFileInfo } from '../../utils/invokeBedrockAgent';
import { handleApiError } from '../../utils/apiErrorHandler';

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
    let binaryFile: BinaryFileInfo | undefined;

    // Look for any field with key starting with 'file'
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('file') && value instanceof Blob) {
        const file = value as File;

        // Read the file as binary data
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        binaryFile = {
          name: file.name,
          content: uint8Array,
          type: file.type,
          useCase: 'CHAT'
        };

        break; // Process only the first file for now
      }
    }

    // Invoke the Bedrock agent using the utility function
    const result = await invokeBedrockAgent(prompt, sessionId, {
      binaryFile
    });

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
    return handleApiError(error);
  }
}
