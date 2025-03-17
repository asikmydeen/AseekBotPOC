import { renderHook, act } from '@testing-library/react-hooks';
import { useFileUpload } from '../../../src/hooks/useFileUpload';
import { uploadFileApi } from '../../../src/api/uploadFileApi';

// Mock the uploadFileApi module
jest.mock('../../../src/api/uploadFileApi');
const mockedUploadFileApi = uploadFileApi as jest.MockedFunction<typeof uploadFileApi>;

describe('useFileUpload Hook', () => {
  // Create mock file for testing
  const createMockFile = (name: string, size: number, type: string) => {
    const file = new File([], name, { type });
    Object.defineProperty(file, 'size', {
      get() {
        return size;
      }
    });
    return file;
  };

  const mockFile1 = createMockFile('test1.pdf', 1024, 'application/pdf');
  const mockFile2 = createMockFile('test2.jpg', 2048, 'image/jpeg');

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('should initialize with empty files array', () => {
    const { result } = renderHook(() => useFileUpload());
    
    expect(result.current.files).toEqual([]);
    expect(result.current.isUploading).toBe(false);
  });

  test('should handle file drop and update through upload states', async () => {
    // Mock successful upload
    mockedUploadFileApi.mockResolvedValue({
      id: 'file-123',
      name: mockFile1.name,
      size: mockFile1.size,
      type: mockFile1.type,
      url: 'https://example.com/files/file-123'
    });

    const { result, waitForNextUpdate } = renderHook(() => useFileUpload());

    // Simulate file drop
    act(() => {
      result.current.onDrop([mockFile1]);
    });

    // Check pending state
    expect(result.current.files.length).toBe(1);
    expect(result.current.files[0].status).toBe('pending');
    expect(result.current.files[0].file).toBe(mockFile1);
    expect(result.current.isUploading).toBe(true);

    // Wait for upload to complete
    await waitForNextUpdate();

    // Check success state
    expect(result.current.files.length).toBe(1);
    expect(result.current.files[0].status).toBe('success');
    expect(result.current.files[0].id).toBe('file-123');
    expect(result.current.files[0].url).toBe('https://example.com/files/file-123');
    expect(result.current.isUploading).toBe(false);
    
    // Verify uploadFileApi was called correctly
    expect(mockedUploadFileApi).toHaveBeenCalledWith(mockFile1);
    expect(mockedUploadFileApi).toHaveBeenCalledTimes(1);
  });

  test('should handle multiple file uploads', async () => {
    // Mock successful uploads for both files
    mockedUploadFileApi
      .mockResolvedValueOnce({
        id: 'file-123',
        name: mockFile1.name,
        size: mockFile1.size,
        type: mockFile1.type,
        url: 'https://example.com/files/file-123'
      })
      .mockResolvedValueOnce({
        id: 'file-456',
        name: mockFile2.name,
        size: mockFile2.size,
        type: mockFile2.type,
        url: 'https://example.com/files/file-456'
      });

    const { result, waitForNextUpdate } = renderHook(() => useFileUpload());

    // Simulate multiple file drop
    act(() => {
      result.current.onDrop([mockFile1, mockFile2]);
    });

    // Check pending state
    expect(result.current.files.length).toBe(2);
    expect(result.current.files[0].status).toBe('pending');
    expect(result.current.files[1].status).toBe('pending');
    expect(result.current.isUploading).toBe(true);

    // Wait for uploads to complete
    await waitForNextUpdate();
    await waitForNextUpdate();

    // Check success state for both files
    expect(result.current.files.length).toBe(2);
    expect(result.current.files[0].status).toBe('success');
    expect(result.current.files[1].status).toBe('success');
    expect(result.current.isUploading).toBe(false);
    
    // Verify uploadFileApi was called correctly for both files
    expect(mockedUploadFileApi).toHaveBeenCalledTimes(2);
    expect(mockedUploadFileApi).toHaveBeenCalledWith(mockFile1);
    expect(mockedUploadFileApi).toHaveBeenCalledWith(mockFile2);
  });

  test('should handle error during file upload', async () => {
    // Mock failed upload
    const errorMessage = 'Upload failed';
    mockedUploadFileApi.mockRejectedValue(new Error(errorMessage));

    const { result, waitForNextUpdate } = renderHook(() => useFileUpload());

    // Simulate file drop
    act(() => {
      result.current.onDrop([mockFile1]);
    });

    // Check pending state
    expect(result.current.files.length).toBe(1);
    expect(result.current.files[0].status).toBe('pending');
    expect(result.current.isUploading).toBe(true);

    // Wait for upload to fail
    await waitForNextUpdate();

    // Check error state
    expect(result.current.files.length).toBe(1);
    expect(result.current.files[0].status).toBe('error');
    expect(result.current.files[0].error).toBe(errorMessage);
    expect(result.current.isUploading).toBe(false);
    
    // Verify uploadFileApi was called
    expect(mockedUploadFileApi).toHaveBeenCalledWith(mockFile1);
    expect(mockedUploadFileApi).toHaveBeenCalledTimes(1);
  });

  test('should remove a file', async () => {
    // Mock successful upload
    mockedUploadFileApi.mockResolvedValue({
      id: 'file-123',
      name: mockFile1.name,
      size: mockFile1.size,
      type: mockFile1.type,
      url: 'https://example.com/files/file-123'
    });

    const { result, waitForNextUpdate } = renderHook(() => useFileUpload());

    // Upload a file
    act(() => {
      result.current.onDrop([mockFile1]);
    });

    // Wait for upload to complete
    await waitForNextUpdate();
    expect(result.current.files.length).toBe(1);

    // Remove the file
    act(() => {
      result.current.removeFile('file-123');
    });

    // Check that file was removed
    expect(result.current.files.length).toBe(0);
  });

  test('should clear all files', async () => {
    // Mock successful uploads
    mockedUploadFileApi
      .mockResolvedValueOnce({
        id: 'file-123',
        name: mockFile1.name,
        size: mockFile1.size,
        type: mockFile1.type,
        url: 'https://example.com/files/file-123'
      })
      .mockResolvedValueOnce({
        id: 'file-456',
        name: mockFile2.name,
        size: mockFile2.size,
        type: mockFile2.type,
        url: 'https://example.com/files/file-456'
      });

    const { result, waitForNextUpdate } = renderHook(() => useFileUpload());

    // Upload multiple files
    act(() => {
      result.current.onDrop([mockFile1, mockFile2]);
    });

    // Wait for uploads to complete
    await waitForNextUpdate();
    await waitForNextUpdate();
    expect(result.current.files.length).toBe(2);

    // Clear all files
    act(() => {
      result.current.clearFiles();
    });

    // Check that all files were cleared
    expect(result.current.files.length).toBe(0);
  });

  test('should not upload files when onDrop is called with empty array', () => {
    const { result } = renderHook(() => useFileUpload());

    // Simulate empty file drop
    act(() => {
      result.current.onDrop([]);
    });

    // Check that no files were added and upload was not triggered
    expect(result.current.files.length).toBe(0);
    expect(result.current.isUploading).toBe(false);
    expect(mockedUploadFileApi).not.toHaveBeenCalled();
  });
});