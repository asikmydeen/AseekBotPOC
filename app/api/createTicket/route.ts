import { NextRequest, NextResponse } from 'next/server';

// Interface for the ticket data structure
interface TicketData {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  email: string;
}

// Interface for the response ticket with additional fields
interface TicketResponse extends TicketData {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * POST handler for ticket creation
 * This endpoint receives ticket details and returns a created ticket with ID and timestamps
 */
export async function POST(req: NextRequest) {
  try {
    // Step 1: Read and parse the JSON request body
    const ticketData: TicketData = await req.json();
    
    // Step 2: Validate the required fields
    if (!ticketData.title || !ticketData.description || !ticketData.email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Step 3: Generate a unique ticket ID (simple implementation for demo)
    const ticketId = `TICKET-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Step 4: Create timestamps for the ticket
    const currentTime = new Date().toISOString();
    
    // Step 5: Simulate processing delay (500ms)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Step 6: Prepare the response with the created ticket
    const ticketResponse: TicketResponse = {
      ...ticketData,
      id: ticketId,
      status: 'open',
      createdAt: currentTime,
      updatedAt: currentTime
    };
    
    // Step 7: Return the response with the created ticket
    return NextResponse.json(
      { 
        success: true, 
        message: 'Ticket created successfully', 
        ticket: ticketResponse 
      },
      { status: 201 }
    );
    
  } catch (error) {
    // Handle any errors that occur during processing
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create ticket' },
      { status: 500 }
    );
  }
}