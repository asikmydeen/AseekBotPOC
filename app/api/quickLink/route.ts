import { NextResponse } from 'next/server';

// Helper function to generate response for 'getHelp' action
function getHelpResponse() {
  return {
    message: 'Here are some commands you can use:',
    options: [
      { label: 'Create Ticket', value: 'createTicket' },
      { label: 'Upload File', value: 'uploadFile' },
      { label: 'Chat', value: 'chat' }
    ]
  };
}

// Helper function to generate response for 'getStarted' action
function getStartedResponse() {
  return {
    message: 'Welcome to AseekBot! How can I assist you today?',
    options: [
      { label: 'Create a new support ticket', value: 'createTicket' },
      { label: 'Chat with support', value: 'chat' },
      { label: 'View documentation', value: 'docs' }
    ]
  };
}

// Helper function to generate response for 'showOptions' action
function showOptionsResponse(parameter: string) {
  // Different options based on the parameter
  switch (parameter) {
    case 'ticket':
      return {
        message: 'Ticket options:',
        options: [
          { label: 'Create new ticket', value: 'createTicket' },
          { label: 'View my tickets', value: 'viewTickets' }
        ]
      };
    case 'support':
      return {
        message: 'Support options:',
        options: [
          { label: 'Chat with agent', value: 'chatAgent' },
          { label: 'View knowledge base', value: 'knowledgeBase' }
        ]
      };
    default:
      return {
        message: 'General options:',
        options: [
          { label: 'Get help', value: 'getHelp' },
          { label: 'Start over', value: 'getStarted' }
        ]
      };
  }
}

// Main POST handler for the quickLink API endpoint
export async function POST(request: Request) {
  try {
    // Parse the JSON body from the request
    const body = await request.json();
    
    // Extract action and parameter from the request body
    const { action, parameter } = body;
    
    // Validate that action is provided
    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      );
    }
    
    // Generate response based on the action
    let response;
    
    switch (action) {
      case 'getHelp':
        response = getHelpResponse();
        break;
      case 'getStarted':
        response = getStartedResponse();
        break;
      case 'showOptions':
        response = showOptionsResponse(parameter || '');
        break;
      default:
        // Handle unknown action
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
    
    // Return the response
    return NextResponse.json(response);
  } catch (error) {
    // Handle any errors that occur during processing
    console.error('Error processing quickLink request:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}