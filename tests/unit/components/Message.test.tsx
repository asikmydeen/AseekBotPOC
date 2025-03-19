import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Message from '@/app/components/Message';
import { MessageRole } from '@/types/chat';

// Mock the next/image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} />;
  },
}));

describe('Message Component', () => {
  const mockOnReaction = jest.fn();
  const mockOnMediaClick = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  const defaultProps = {
    message: {
      id: '1',
      content: 'Hello, this is a test message',
      role: MessageRole.User,
      createdAt: new Date().toISOString(),
    },
    isTyping: false,
    onReaction: mockOnReaction,
    onMediaClick: mockOnMediaClick,
  };

  test('renders user message correctly', () => {
    render(<Message {...defaultProps} />);
    
    expect(screen.getByText('Hello, this is a test message')).toBeInTheDocument();
    expect(screen.getByTestId('user-avatar')).toBeInTheDocument();
  });

  test('renders bot message correctly', () => {
    const botProps = {
      ...defaultProps,
      message: {
        ...defaultProps.message,
        role: MessageRole.Assistant,
      },
    };
    
    render(<Message {...botProps} />);
    
    expect(screen.getByText('Hello, this is a test message')).toBeInTheDocument();
    expect(screen.getByTestId('bot-avatar')).toBeInTheDocument();
  });

  test('renders markdown content correctly', () => {
    const markdownProps = {
      ...defaultProps,
      message: {
        ...defaultProps.message,
        content: '# Heading\n**Bold text**\n- List item',
      },
    };
    
    render(<Message {...markdownProps} />);
    
    expect(screen.getByRole('heading', { level: 1, name: 'Heading' })).toBeInTheDocument();
    expect(screen.getByText('Bold text')).toBeInTheDocument();
    expect(screen.getByText('List item')).toBeInTheDocument();
  });

  test('shows typing effect for bot messages when isTyping is true', async () => {
    const typingProps = {
      ...defaultProps,
      message: {
        ...defaultProps.message,
        role: MessageRole.Assistant,
        content: 'This is a typing message',
      },
      isTyping: true,
    };
    
    render(<Message {...typingProps} />);
    
    // Initially, we should see the typing indicator
    expect(screen.getByTestId('typing-indicator')).toBeInTheDocument();
    
    // The content should be rendered character by character
    await waitFor(() => {
      expect(screen.getByText('This is a typing message')).toBeInTheDocument();
    });
  });

  test('renders file attachments correctly', () => {
    const attachmentProps = {
      ...defaultProps,
      message: {
        ...defaultProps.message,
        attachments: [
          {
            id: 'file1',
            filename: 'test-file.pdf',
            contentType: 'application/pdf',
            size: 1024,
            url: 'https://example.com/test-file.pdf',
          },
        ],
      },
    };
    
    render(<Message {...attachmentProps} />);
    
    expect(screen.getByText('test-file.pdf')).toBeInTheDocument();
    expect(screen.getByTestId('file-attachment')).toBeInTheDocument();
  });

  test('renders image attachments correctly and handles clicks', () => {
    const imageAttachmentProps = {
      ...defaultProps,
      message: {
        ...defaultProps.message,
        attachments: [
          {
            id: 'image1',
            filename: 'test-image.jpg',
            contentType: 'image/jpeg',
            size: 2048,
            url: 'https://example.com/test-image.jpg',
          },
        ],
      },
    };
    
    render(<Message {...imageAttachmentProps} />);
    
    const imageElement = screen.getByAltText('test-image.jpg');
    expect(imageElement).toBeInTheDocument();
    
    // Test clicking on the image
    fireEvent.click(imageElement);
    expect(mockOnMediaClick).toHaveBeenCalledWith(imageAttachmentProps.message.attachments[0]);
  });

  test('handles reaction button clicks', () => {
    render(<Message {...defaultProps} />);
    
    const reactionButton = screen.getByTestId('reaction-button');
    fireEvent.click(reactionButton);
    
    expect(mockOnReaction).toHaveBeenCalledWith(defaultProps.message.id, expect.any(String));
  });

  test('displays existing reactions', () => {
    const reactionsProps = {
      ...defaultProps,
      message: {
        ...defaultProps.message,
        reactions: [
          { id: 'r1', emoji: '👍', userId: 'user1' },
          { id: 'r2', emoji: '❤️', userId: 'user2' },
        ],
      },
    };
    
    render(<Message {...reactionsProps} />);
    
    expect(screen.getByText('👍')).toBeInTheDocument();
    expect(screen.getByText('❤️')).toBeInTheDocument();
  });

  test('renders code blocks correctly', () => {
    const codeProps = {
      ...defaultProps,
      message: {
        ...defaultProps.message,
        content: '```javascript\nconst test = "Hello World";\nconsole.log(test);\n```',
      },
    };
    
    render(<Message {...codeProps} />);
    
    expect(screen.getByText('const test = "Hello World";')).toBeInTheDocument();
    expect(screen.getByText('console.log(test);')).toBeInTheDocument();
  });

  test('renders video attachments correctly and handles clicks', () => {
    const videoAttachmentProps = {
      ...defaultProps,
      message: {
        ...defaultProps.message,
        attachments: [
          {
            id: 'video1',
            filename: 'test-video.mp4',
            contentType: 'video/mp4',
            size: 5120,
            url: 'https://example.com/test-video.mp4',
          },
        ],
      },
    };
    
    render(<Message {...videoAttachmentProps} />);
    
    const videoThumbnail = screen.getByTestId('video-thumbnail');
    expect(videoThumbnail).toBeInTheDocument();
    
    // Test clicking on the video thumbnail
    fireEvent.click(videoThumbnail);
    expect(mockOnMediaClick).toHaveBeenCalledWith(videoAttachmentProps.message.attachments[0]);
  });
});