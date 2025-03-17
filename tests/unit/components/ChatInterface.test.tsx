import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import ChatInterface from '../../../components/ChatInterface';
import { useChatMessages } from '../../../hooks/useChatMessages';
import { useFileUpload } from '../../../hooks/useFileUpload';
import { useTicketSystem } from '../../../hooks/useTicketSystem';

// Mock the hooks
jest.mock('../../../hooks/useChatMessages', () => ({
  useChatMessages: jest.fn(),
}));

jest.mock('../../../hooks/useFileUpload', () => ({
  useFileUpload: jest.fn(),
}));

jest.mock('../../../hooks/useTicketSystem', () => ({
  useTicketSystem: jest.fn(),
}));

// Mock components that might be complex to render in tests
jest.mock('../../../components/ChatHeader', () => ({
  __esModule: true,
  default: () => <div data-testid="chat-header">Chat Header</div>,
}));

jest.mock('../../../components/MessageList', () => ({
  __esModule: true,
  default: ({ messages }) => (
    <div data-testid="message-list">
      {messages.map((msg, i) => (
        <div key={i} data-testid={`message-${i}`}>
          {msg.content}
        </div>
      ))}
    </div>
  ),
}));

jest.mock('../../../components/FileDropzone', () => ({
  __esModule: true,
  default: ({ onFileSelect }) => (
    <div data-testid="file-dropzone" onClick={() => onFileSelect([{ name: 'test.pdf' }])}>
      File Dropzone
    </div>
  ),
}));

jest.mock('../../../components/TicketForm', () => ({
  __esModule: true,
  default: ({ onSubmit, onCancel }) => (
    <div data-testid="ticket-form">
      <button onClick={() => onSubmit({ title: 'Test Ticket', description: 'Test Description' })}>
        Submit Ticket
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

jest.mock('../../../components/FeedbackForm', () => ({
  __esModule: true,
  default: ({ onSubmit, onCancel }) => (
    <div data-testid="feedback-form">
      <button onClick={() => onSubmit({ rating: 5, comment: 'Great service!' })}>
        Submit Feedback
      </button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  ),
}));

describe('ChatInterface Component', () => {
  // Setup default mocks
  const mockSendMessage = jest.fn();
  const mockSetInputValue = jest.fn();
  const mockSetSuggestions = jest.fn();
  const mockUploadFile = jest.fn();
  const mockRemoveFile = jest.fn();
  const mockCreateTicket = jest.fn();
  const mockSubmitFeedback = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock useChatMessages hook
    useChatMessages.mockReturnValue({
      messages: [
        { id: '1', role: 'user', content: 'Hello' },
        { id: '2', role: 'assistant', content: 'Hi there!' },
      ],
      inputValue: '',
      suggestions: ['How can I help?', 'Tell me more'],
      isLoading: false,
      sendMessage: mockSendMessage,
      setInputValue: mockSetInputValue,
      setSuggestions: mockSetSuggestions,
    });
    
    // Mock useFileUpload hook
    useFileUpload.mockReturnValue({
      files: [],
      uploadFile: mockUploadFile,
      removeFile: mockRemoveFile,
      uploadProgress: 0,
      isUploading: false,
    });
    
    // Mock useTicketSystem hook
    useTicketSystem.mockReturnValue({
      showTicketForm: false,
      setShowTicketForm: jest.fn(),
      createTicket: mockCreateTicket,
      showFeedbackForm: false,
      setShowFeedbackForm: jest.fn(),
      submitFeedback: mockSubmitFeedback,
    });
  });

  const setup = (props = {}) => {
    return render(<ChatInterface {...props} />);
  };

  test('renders all major UI components', () => {
    setup();
    
    expect(screen.getByTestId('chat-header')).toBeInTheDocument();
    expect(screen.getByTestId('message-list')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/type your message/i)).toBeInTheDocument();
    expect(screen.getByTestId('file-dropzone')).toBeInTheDocument();
  });

  test('updates input value when user types', async () => {
    setup();
    
    const input = screen.getByPlaceholderText(/type your message/i);
    await userEvent.type(input, 'Hello world');
    
    expect(mockSetInputValue).toHaveBeenCalledWith('Hello world');
  });

  test('sends message when user presses Enter', async () => {
    // Update the mock to include an input value
    useChatMessages.mockReturnValue({
      messages: [
        { id: '1', role: 'user', content: 'Hello' },
        { id: '2', role: 'assistant', content: 'Hi there!' },
      ],
      inputValue: 'Test message',
      suggestions: [],
      isLoading: false,
      sendMessage: mockSendMessage,
      setInputValue: mockSetInputValue,
      setSuggestions: mockSetSuggestions,
    });
    
    setup();
    
    const input = screen.getByPlaceholderText(/type your message/i);
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    
    expect(mockSendMessage).toHaveBeenCalledWith('Test message');
  });

  test('sends message when send button is clicked', () => {
    // Update the mock to include an input value
    useChatMessages.mockReturnValue({
      messages: [
        { id: '1', role: 'user', content: 'Hello' },
        { id: '2', role: 'assistant', content: 'Hi there!' },
      ],
      inputValue: 'Test message',
      suggestions: [],
      isLoading: false,
      sendMessage: mockSendMessage,
      setInputValue: mockSetInputValue,
      setSuggestions: mockSetSuggestions,
    });
    
    setup();
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);
    
    expect(mockSendMessage).toHaveBeenCalledWith('Test message');
  });

  test('clicking on a suggestion sets it as input value', async () => {
    setup();
    
    const suggestion = screen.getByText('How can I help?');
    fireEvent.click(suggestion);
    
    expect(mockSetInputValue).toHaveBeenCalledWith('How can I help?');
  });

  test('handles file selection', async () => {
    setup();
    
    const fileDropzone = screen.getByTestId('file-dropzone');
    fireEvent.click(fileDropzone);
    
    expect(mockUploadFile).toHaveBeenCalledWith({ name: 'test.pdf' });
  });

  test('renders and interacts with ticket form when shown', () => {
    // Mock ticket form to be visible
    useTicketSystem.mockReturnValue({
      showTicketForm: true,
      setShowTicketForm: jest.fn(),
      createTicket: mockCreateTicket,
      showFeedbackForm: false,
      setShowFeedbackForm: jest.fn(),
      submitFeedback: mockSubmitFeedback,
    });
    
    setup();
    
    expect(screen.getByTestId('ticket-form')).toBeInTheDocument();
    
    const submitButton = screen.getByText('Submit Ticket');
    fireEvent.click(submitButton);
    
    expect(mockCreateTicket).toHaveBeenCalledWith({
      title: 'Test Ticket',
      description: 'Test Description'
    });
  });

  test('renders and interacts with feedback form when shown', () => {
    // Mock feedback form to be visible
    useTicketSystem.mockReturnValue({
      showTicketForm: false,
      setShowTicketForm: jest.fn(),
      createTicket: mockCreateTicket,
      showFeedbackForm: true,
      setShowFeedbackForm: jest.fn(),
      submitFeedback: mockSubmitFeedback,
    });
    
    setup();
    
    expect(screen.getByTestId('feedback-form')).toBeInTheDocument();
    
    const submitButton = screen.getByText('Submit Feedback');
    fireEvent.click(submitButton);
    
    expect(mockSubmitFeedback).toHaveBeenCalledWith({
      rating: 5,
      comment: 'Great service!'
    });
  });

  test('shows loading state when messages are being processed', () => {
    // Mock loading state
    useChatMessages.mockReturnValue({
      messages: [
        { id: '1', role: 'user', content: 'Hello' },
      ],
      inputValue: '',
      suggestions: [],
      isLoading: true,
      sendMessage: mockSendMessage,
      setInputValue: mockSetInputValue,
      setSuggestions: mockSetSuggestions,
    });
    
    setup();
    
    expect(screen.getByText(/thinking.../i)).toBeInTheDocument();
  });

  test('disables send button when input is empty', () => {
    // Mock empty input
    useChatMessages.mockReturnValue({
      messages: [],
      inputValue: '',
      suggestions: [],
      isLoading: false,
      sendMessage: mockSendMessage,
      setInputValue: mockSetInputValue,
      setSuggestions: mockSetSuggestions,
    });
    
    setup();
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).toBeDisabled();
  });

  test('enables send button when input has text', () => {
    // Mock non-empty input
    useChatMessages.mockReturnValue({
      messages: [],
      inputValue: 'Hello',
      suggestions: [],
      isLoading: false,
      sendMessage: mockSendMessage,
      setInputValue: mockSetInputValue,
      setSuggestions: mockSetSuggestions,
    });
    
    setup();
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    expect(sendButton).not.toBeDisabled();
  });
});