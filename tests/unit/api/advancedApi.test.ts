import { processChatMessage, uploadFileApi } from '../../../src/utils/advancedApi';

// Mock fetch globally
global.fetch = jest.fn();

describe('Advanced API Utility Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processChatMessage', () => {
    const mockMessage = { content: 'Hello, how can I help?', role: 'user' };
    const mockConversationId = 'conv123';
    const mockResponse = { 
      id: 'resp123', 
      content: 'I can help with that!', 
      role: 'assistant',
      conversationId: 'conv123'
    };

    it('should process a chat message successfully', async () => {
      // Mock successful response
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await processChatMessage(mockMessage, mockConversationId);

      // Verify fetch was called with correct parameters
      expect(fetch).toHaveBeenCalledWith('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: mockMessage,
          conversationId: mockConversationId,
        }),
      });

      // Verify the result matches the mock response
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors gracefully', async () => {
      // Mock error response
      const errorMessage = 'Failed to process message';
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => errorMessage,
      });

      // Verify the function throws an error with appropriate message
      await expect(processChatMessage(mockMessage, mockConversationId))
        .rejects
        .toThrow(`Error processing message: 500 Internal Server Error - ${errorMessage}`);

      // Verify fetch was called
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle network errors', async () => {
      // Mock network failure
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

      // Verify the function throws an error
      await expect(processChatMessage(mockMessage, mockConversationId))
        .rejects
        .toThrow('Error processing message: Network failure');

      // Verify fetch was called
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('uploadFileApi', () => {
    const mockFile = new File(['file content'], 'test.txt', { type: 'text/plain' });
    const mockConversationId = 'conv123';
    const mockResponse = { 
      fileId: 'file123',
      fileName: 'test.txt',
      fileUrl: 'https://example.com/files/test.txt'
    };

    it('should upload a file successfully', async () => {
      // Mock successful response
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await uploadFileApi(mockFile, mockConversationId);

      // Verify fetch was called
      expect(fetch).toHaveBeenCalledTimes(1);
      
      // Get the FormData from the fetch call
      const fetchCall = (fetch as jest.Mock).mock.calls[0];
      const [url, options] = fetchCall;
      
      // Verify URL and method
      expect(url).toBe('/api/upload');
      expect(options.method).toBe('POST');
      
      // Verify FormData was constructed correctly
      const formData = options.body;
      expect(formData instanceof FormData).toBe(true);
      
      // Verify the result matches the mock response
      expect(result).toEqual(mockResponse);
    });

    it('should include file and conversationId in FormData', async () => {
      // Mock successful response
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      // Create a spy on FormData.prototype.append
      const appendSpy = jest.spyOn(FormData.prototype, 'append');

      await uploadFileApi(mockFile, mockConversationId);

      // Verify FormData.append was called with correct parameters
      expect(appendSpy).toHaveBeenCalledWith('file', mockFile);
      expect(appendSpy).toHaveBeenCalledWith('conversationId', mockConversationId);
      
      // Clean up spy
      appendSpy.mockRestore();
    });

    it('should handle API errors gracefully', async () => {
      // Mock error response
      const errorMessage = 'Failed to upload file';
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 413,
        statusText: 'Payload Too Large',
        text: async () => errorMessage,
      });

      // Verify the function throws an error with appropriate message
      await expect(uploadFileApi(mockFile, mockConversationId))
        .rejects
        .toThrow(`Error uploading file: 413 Payload Too Large - ${errorMessage}`);

      // Verify fetch was called
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    it('should handle network errors', async () => {
      // Mock network failure
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network failure'));

      // Verify the function throws an error
      await expect(uploadFileApi(mockFile, mockConversationId))
        .rejects
        .toThrow('Error uploading file: Network failure');

      // Verify fetch was called
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });
});