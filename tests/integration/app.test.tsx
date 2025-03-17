import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { act } from 'react-dom/test-utils';
import Home from '../../app/page';
import { ChatProvider } from '../../app/contexts/ChatContext';
import { FileUploadProvider } from '../../app/contexts/FileUploadContext';
import { TicketSystemProvider } from '../../app/contexts/TicketSystemContext';
import * as useChatMessages from '../../app/hooks/useChatMessages';
import * as useFileUpload from '../../app/hooks/useFileUpload';
import * as useTicketSystem from '../../app/hooks/useTicketSystem';

// Mock the Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
}));

// Mock the API responses
jest.mock('../../app/api/chat/route', () => ({
  POST: jest.fn(() => Promise.resolve({ json: () => ({ message: 'Mock API response' }) })),
}));

jest.mock('../../app/api/upload/route', () => ({
  POST: jest.fn(() => Promise.resolve({ json: () => ({ success: true, fileId: 'mock-file-id' }) })),
}));

jest.mock('../../app/api/ticket/route', () => ({
  POST: jest.fn(() => Promise.resolve({ json: () => ({ success: true, ticketId: 'mock-ticket-id' }) })),
}));

// Create a wrapper component with all providers
const AllProviders = ({ children }) => {
  return (
    <ChatProvider>
      <FileUploadProvider>
        <TicketSystemProvider>
          {children}
        </TicketSystemProvider>
      </FileUploadProvider>
    </ChatProvider>
  );
};

describe('Home Page Integration Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Mock the hooks
    jest.spyOn(useChatMessages, 'default').mockImplementation(() => ({
      messages: [],
      isLoading: false,
      error: null,
      sendMessage: jest.fn((message) => {
        return Promise.resolve({
          role: 'assistant',
          content: 'This is a mock response from the assistant',
        });
      }),
      clearMessages: jest.fn(),
    }));
    
    jest.spyOn(useFileUpload, 'default').mockImplementation(() => ({
      uploadedFiles: [],
      isUploading: false,
      uploadError: null,
      uploadFile: jest.fn((file) => {
        return Promise.resolve({
          id: 'mock-file-id',
          name: file.name,
          size: file.size,
          type: file.type,
          url: 'https://example.com/mock-file',
        });
      }),
      removeFile: jest.fn(),
    }));
    
    jest.spyOn(useTicketSystem, 'default').mockImplementation(() => ({
      tickets: [],
      isCreatingTicket: false,
      ticketError: null,
      createTicket: jest.fn((details) => {
        return Promise.resolve({
          id: 'mock-ticket-id',
          title: details.title,
          description: details.description,
          status: 'open',
          createdAt: new Date().toISOString(),
        });
      }),
    }));
  });

  test('renders Home page with Sidebar and ChatInterface', async () => {
    render(
      <AllProviders>
        <Home />
      </AllProviders>
    );

    // Verify that key components are rendered
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('chat-interface')).toBeInTheDocument();
    
    // Check for specific elements in the sidebar
    expect(screen.getByText(/AseekBot/i)).toBeInTheDocument();
    expect(screen.getByText(/New Chat/i)).toBeInTheDocument();
    
    // Check for chat interface elements
    expect(screen.getByPlaceholderText(/Type your message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  test('simulates a complete chat cycle', async () => {
    const mockSendMessage = jest.fn().mockResolvedValue({
      role: 'assistant',
      content: 'This is a mock response from the assistant',
    });
    
    jest.spyOn(useChatMessages, 'default').mockImplementation(() => ({
      messages: [
        { role: 'user', content: 'Hello, AseekBot!' },
        { role: 'assistant', content: 'This is a mock response from the assistant' },
      ],
      isLoading: false,
      error: null,
      sendMessage: mockSendMessage,
      clearMessages: jest.fn(),
    }));

    render(
      <AllProviders>
        <Home />
      </AllProviders>
    );

    // Type a message
    const inputField = screen.getByPlaceholderText(/Type your message/i);
    fireEvent.change(inputField, { target: { value: 'Hello, AseekBot!' } });
    
    // Send the message
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);
    
    // Verify the message was sent
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('Hello, AseekBot!');
    });
    
    // Verify messages are displayed
    expect(screen.getByText('Hello, AseekBot!')).toBeInTheDocument();
    expect(screen.getByText('This is a mock response from the assistant')).toBeInTheDocument();
  });

  test('simulates file upload functionality', async () => {
    const mockUploadFile = jest.fn().mockResolvedValue({
      id: 'mock-file-id',
      name: 'test-file.pdf',
      size: 1024,
      type: 'application/pdf',
      url: 'https://example.com/test-file.pdf',
    });
    
    jest.spyOn(useFileUpload, 'default').mockImplementation(() => ({
      uploadedFiles: [
        {
          id: 'mock-file-id',
          name: 'test-file.pdf',
          size: 1024,
          type: 'application/pdf',
          url: 'https://example.com/test-file.pdf',
        },
      ],
      isUploading: false,
      uploadError: null,
      uploadFile: mockUploadFile,
      removeFile: jest.fn(),
    }));

    render(
      <AllProviders>
        <Home />
      </AllProviders>
    );

    // Find the file input
    const fileInput = screen.getByTestId('file-upload-input');
    
    // Create a mock file
    const file = new File(['file content'], 'test-file.pdf', { type: 'application/pdf' });
    
    // Simulate file upload
    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });
    
    // Verify the upload function was called
    expect(mockUploadFile).toHaveBeenCalled();
    
    // Verify the uploaded file is displayed
    await waitFor(() => {
      expect(screen.getByText('test-file.pdf')).toBeInTheDocument();
    });
  });

  test('simulates ticket creation trigger', async () => {
    const mockCreateTicket = jest.fn().mockResolvedValue({
      id: 'mock-ticket-id',
      title: 'Test Ticket',
      description: 'This is a test ticket',
      status: 'open',
      createdAt: new Date().toISOString(),
    });
    
    jest.spyOn(useTicketSystem, 'default').mockImplementation(() => ({
      tickets: [],
      isCreatingTicket: false,
      ticketError: null,
      createTicket: mockCreateTicket,
    }));

    // Mock the chat messages to include a ticket creation trigger
    jest.spyOn(useChatMessages, 'default').mockImplementation(() => ({
      messages: [
        { role: 'user', content: 'I need to create a ticket' },
        { 
          role: 'assistant', 
          content: 'I can help you create a ticket. Please provide details.',
          actions: [{ type: 'createTicket', label: 'Create Ticket' }]
        },
      ],
      isLoading: false,
      error: null,
      sendMessage: jest.fn(),
      clearMessages: jest.fn(),
    }));

    render(
      <AllProviders>
        <Home />
      </AllProviders>
    );

    // Find and click the create ticket button
    const createTicketButton = screen.getByText('Create Ticket');
    fireEvent.click(createTicketButton);
    
    // Verify the ticket creation modal appears
    await waitFor(() => {
      expect(screen.getByTestId('ticket-creation-modal')).toBeInTheDocument();
    });
    
    // Fill in ticket details
    const titleInput = screen.getByLabelText(/Title/i);
    const descriptionInput = screen.getByLabelText(/Description/i);
    
    fireEvent.change(titleInput, { target: { value: 'Test Ticket' } });
    fireEvent.change(descriptionInput, { target: { value: 'This is a test ticket' } });
    
    // Submit the ticket
    const submitButton = screen.getByRole('button', { name: /Submit/i });
    fireEvent.click(submitButton);
    
    // Verify the create ticket function was called with correct parameters
    await waitFor(() => {
      expect(mockCreateTicket).toHaveBeenCalledWith({
        title: 'Test Ticket',
        description: 'This is a test ticket',
      });
    });
    
    // Verify success message is displayed
    await waitFor(() => {
      expect(screen.getByText(/Ticket created successfully/i)).toBeInTheDocument();
    });
  });
});