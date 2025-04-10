import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { requestId: string } }
) {
  try {
    const { requestId } = params;
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    console.log(`Checking status for requestId: ${requestId}, userId: ${userId}`);

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }

    // For testing purposes, we'll simulate different statuses based on the requestId
    // In a real implementation, you would check the actual status in your database
    const timestamp = parseInt(requestId.split('-')[1], 10);
    const now = Date.now();
    const elapsedTime = now - timestamp;

    let status = 'PROCESSING';
    let progress = 0;
    let completion = null;

    // Simulate different statuses based on elapsed time
    if (elapsedTime < 3000) {
      // Still processing
      status = 'PROCESSING';
      progress = Math.min(Math.floor(elapsedTime / 30), 99);
    } else {
      // Completed
      status = 'COMPLETED';
      progress = 100;
      completion = {
        text: `This is a simulated response for request ${requestId}. The analysis has been completed successfully.`,
        timestamp: new Date().toISOString(),
        metadata: {
          processingTime: elapsedTime,
          fileCount: 2,
          promptId: 'test-modal-dropdown-prompt'
        }
      };
    }

    return NextResponse.json({
      requestId,
      status,
      progress,
      completion,
      userId
    });
  } catch (error) {
    console.error('Error checking status:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
}
