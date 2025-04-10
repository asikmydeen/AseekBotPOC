import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('Received message request:', body);

    // Validate required fields
    if (!body.userId || !body.sessionId || !body.chatId) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, sessionId, or chatId' },
        { status: 400 }
      );
    }

    // Check if we have a promptId or message
    if (!body.promptId && !body.message) {
      return NextResponse.json(
        { error: 'Either promptId or message is required' },
        { status: 400 }
      );
    }

    // Check if we have files
    const hasFiles = body.s3Files && Array.isArray(body.s3Files) && body.s3Files.length > 0;
    console.log('Has files:', hasFiles, body.s3Files?.length || 0);

    // Generate a mock requestId
    const requestId = `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Return a success response with the requestId
    return NextResponse.json({
      requestId,
      status: 'PROCESSING',
      message: 'Message received and processing started',
      details: {
        promptId: body.promptId,
        userId: body.userId,
        sessionId: body.sessionId,
        chatId: body.chatId,
        hasFiles,
        fileCount: body.s3Files?.length || 0
      }
    });
  } catch (error) {
    console.error('Error processing message:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
