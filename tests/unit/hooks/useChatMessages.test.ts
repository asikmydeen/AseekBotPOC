import { renderHook, act, waitFor } from '@testing-library/react';
import { useChatMessages } from '../../../src/hooks/useChatMessages';
import { processChatMessage } from '../../../src/api/chatApi';

// Mock the API call
jest.mock('../../../src/api/chatApi', () => ({
  processChatMessage: jest.fn(),
}));

describe('useChatMessages Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize with empty messages array', () => {
    const { result } = renderHook(() => useChatMessages());
    expect(result.current.messages).toEqual([]);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.progress).toBe(0);
  });

  test('should send a message and receive bot response', async () => {
    // Mock the API response
    const mockResponse = {
      id: 'bot-response-id',
      content: 'This is a bot response',
      role: 'assistant',
      timestamp: new Date().toISOString(),
    };
    
    (processChatMessage as jest.Mock).mockImplementation(
      (message, onProgress) => {
        // Simulate progress updates
        onProgress(0.5);
        return Promise.resolve(mockResponse);
      }
    );

    const { result } = renderHook(() => useChatMessages());

    // Send a user message
    await act(async () => {
      await result.current.sendMessage('Hello, bot!');
    });

    // Check that the user message was added
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0]).toEqual(expect.objectContaining({
      content: 'Hello, bot!',
      role: 'user',
    }));

    // Check that the bot response was added
    expect(result.current.messages[1]).toEqual(expect.objectContaining({
      content: 'This is a bot response',
      role: 'assistant',
    }));

    // Verify API was called with correct parameters
    expect(processChatMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'Hello, bot!',
        role: 'user',
      }),
      expect.any(Function)
    );
  });

  test('should update progress during message processing', async () => {
    // Mock the API with progress updates
    (processChatMessage as jest.Mock).mockImplementation(
      (message, onProgress) => {
        onProgress(0.25);
        onProgress(0.5);
        onProgress(0.75);
        onProgress(1.0);
        return Promise.resolve({
          id: 'bot-response-id',
          content: 'Response after progress',
          role: 'assistant',
          timestamp: new Date().toISOString(),
        });
      }
    );

    const { result } = renderHook(() => useChatMessages());

    // Start sending a message
    let sendPromise: Promise<void>;
    act(() => {
      sendPromise = result.current.sendMessage('Test progress updates');
    });

    // Check that isProcessing is true during processing
    expect(result.current.isProcessing).toBe(true);

    // Wait for progress updates
    await waitFor(() => {
      expect(result.current.progress).toBe(0.25);
    });
    
    await waitFor(() => {
      expect(result.current.progress).toBe(0.5);
    });
    
    await waitFor(() => {
      expect(result.current.progress).toBe(0.75);
    });
    
    await waitFor(() => {
      expect(result.current.progress).toBe(1);
    });

    // Wait for the message to complete processing
    await act(async () => {
      await sendPromise;
    });

    // Check that isProcessing is false after completion
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.progress).toBe(0);
  });

  test('should handle triggerMessage effect', async () => {
    // Mock the API response
    const mockResponse = {
      id: 'trigger-response-id',
      content: 'Triggered response',
      role: 'assistant',
      timestamp: new Date().toISOString(),
    };
    
    (processChatMessage as jest.Mock).mockResolvedValue(mockResponse);

    // Render hook with triggerMessage
    const triggerMessage = {
      content: 'Trigger this message',
      role: 'user',
      id: 'trigger-id',
      timestamp: new Date().toISOString(),
    };
    
    const { result } = renderHook(() => useChatMessages(triggerMessage));

    // Wait for the effect to process the trigger message
    await waitFor(() => {
      expect(result.current.messages).toHaveLength(2);
    });

    // Verify the trigger message and response were added
    expect(result.current.messages[0]).toEqual(expect.objectContaining({
      content: 'Trigger this message',
      role: 'user',
    }));
    
    expect(result.current.messages[1]).toEqual(expect.objectContaining({
      content: 'Triggered response',
      role: 'assistant',
    }));

    // Verify API was called with the trigger message
    expect(processChatMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        content: 'Trigger this message',
        role: 'user',
      }),
      expect.any(Function)
    );
  });

  test('should clean up on unmount', async () => {
    // Mock a delayed API response
    (processChatMessage as jest.Mock).mockImplementation(
      (message, onProgress) => {
        return new Promise(resolve => {
          const timeoutId = setTimeout(() => {
            resolve({
              id: 'delayed-response',
              content: 'Delayed response',
              role: 'assistant',
              timestamp: new Date().toISOString(),
            });
          }, 500);
          
          // Return a cleanup function that would be called on unmount
          return () => clearTimeout(timeoutId);
        });
      }
    );

    // Render the hook
    const { result, unmount } = renderHook(() => useChatMessages());

    // Start sending a message
    act(() => {
      result.current.sendMessage('Message before unmount');
    });

    // Unmount the component before the response is received
    unmount();

    // Wait a bit to ensure any unhandled promises would have resolved
    await new Promise(resolve => setTimeout(resolve, 600));

    // The test passes if no unhandled promise rejections occur
    // This is a negative test - we're verifying that cleanup prevents errors
  });

  test('should handle API errors gracefully', async () => {
    // Mock API to throw an error
    (processChatMessage as jest.Mock).mockRejectedValue(new Error('API error'));

    const { result } = renderHook(() => useChatMessages());
    
    // Send a message that will cause an error
    await act(async () => {
      await result.current.sendMessage('This will cause an error');
    });

    // Verify user message was added but no bot response
    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toEqual(expect.objectContaining({
      content: 'This will cause an error',
      role: 'user',
    }));
    
    // Verify processing state was reset
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.progress).toBe(0);
  });
});