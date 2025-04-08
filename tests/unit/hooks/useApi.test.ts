// tests/unit/hooks/useApi.test.ts
import { renderHook, act } from '@testing-library/react';
import { useApi } from '../../../app/hooks/useApi';
import { useApiStore } from '../../../app/store/apiStore';

// Mock fetch globally
global.fetch = jest.fn();

describe('useApi Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the API store
    act(() => {
      useApiStore.getState().clearAll();
    });
  });

  it('should return initial state correctly', () => {
    const mockApiFunction = jest.fn().mockResolvedValue({ data: 'test' });
    
    const { result } = renderHook(() => 
      useApi(mockApiFunction, { enabled: false })
    );
    
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.execute).toBe('function');
  });

  it('should execute API call and update state on success', async () => {
    const mockData = { message: 'Success' };
    const mockApiFunction = jest.fn().mockResolvedValue(mockData);
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useApi(mockApiFunction, { enabled: true })
    );
    
    // Initially loading
    expect(result.current.isLoading).toBe(true);
    
    // Wait for the API call to complete
    await waitForNextUpdate();
    
    // After successful API call
    expect(result.current.data).toEqual(mockData);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockApiFunction).toHaveBeenCalledTimes(1);
  });

  it('should handle errors correctly', async () => {
    const mockError = new Error('API Error');
    const mockApiFunction = jest.fn().mockRejectedValue(mockError);
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useApi(mockApiFunction, { enabled: true })
    );
    
    // Initially loading
    expect(result.current.isLoading).toBe(true);
    
    // Wait for the API call to complete
    await waitForNextUpdate();
    
    // After failed API call
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toEqual(mockError);
    expect(mockApiFunction).toHaveBeenCalledTimes(1);
  });

  it('should not auto-execute when enabled is false', () => {
    const mockApiFunction = jest.fn().mockResolvedValue({ data: 'test' });
    
    renderHook(() => useApi(mockApiFunction, { enabled: false }));
    
    expect(mockApiFunction).not.toHaveBeenCalled();
  });

  it('should execute manually when calling execute function', async () => {
    const mockData = { message: 'Success' };
    const mockApiFunction = jest.fn().mockResolvedValue(mockData);
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useApi(mockApiFunction, { enabled: false })
    );
    
    // Manually execute the API call
    act(() => {
      result.current.execute();
    });
    
    // Should be loading
    expect(result.current.isLoading).toBe(true);
    
    // Wait for the API call to complete
    await waitForNextUpdate();
    
    // After successful API call
    expect(result.current.data).toEqual(mockData);
    expect(result.current.isLoading).toBe(false);
    expect(mockApiFunction).toHaveBeenCalledTimes(1);
  });

  it('should call onSuccess callback when API call succeeds', async () => {
    const mockData = { message: 'Success' };
    const mockApiFunction = jest.fn().mockResolvedValue(mockData);
    const onSuccess = jest.fn();
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useApi(mockApiFunction, { enabled: true, onSuccess })
    );
    
    // Wait for the API call to complete
    await waitForNextUpdate();
    
    expect(onSuccess).toHaveBeenCalledWith(mockData);
  });

  it('should call onError callback when API call fails', async () => {
    const mockError = new Error('API Error');
    const mockApiFunction = jest.fn().mockRejectedValue(mockError);
    const onError = jest.fn();
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useApi(mockApiFunction, { enabled: true, onError })
    );
    
    // Wait for the API call to complete
    await waitForNextUpdate();
    
    expect(onError).toHaveBeenCalledWith(mockError);
  });

  it('should retry failed API calls when retry is enabled', async () => {
    const mockError = new Error('API Error');
    const mockApiFunction = jest.fn()
      .mockRejectedValueOnce(mockError)
      .mockResolvedValueOnce({ message: 'Success after retry' });
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useApi(mockApiFunction, { 
        enabled: true, 
        retry: true,
        retryDelay: 100 // Short delay for testing
      })
    );
    
    // Wait for the first API call to fail
    await waitForNextUpdate();
    
    // Wait for the retry
    await waitForNextUpdate();
    
    // After successful retry
    expect(result.current.data).toEqual({ message: 'Success after retry' });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockApiFunction).toHaveBeenCalledTimes(2);
  });

  it('should use cached data when available', async () => {
    const mockData = { message: 'Cached data' };
    const mockApiFunction = jest.fn().mockResolvedValue(mockData);
    
    // First render to populate the cache
    const { result: result1, waitForNextUpdate: wait1 } = renderHook(() => 
      useApi(mockApiFunction, { enabled: true, cacheTime: 60000 })
    );
    
    await wait1();
    
    // Second render should use cached data
    const { result: result2 } = renderHook(() => 
      useApi(mockApiFunction, { enabled: true, cacheTime: 60000 })
    );
    
    // Should immediately have data from cache
    expect(result2.current.data).toEqual(mockData);
    expect(mockApiFunction).toHaveBeenCalledTimes(1); // Only called once
  });

  it('should reset state when calling reset function', async () => {
    const mockData = { message: 'Success' };
    const mockApiFunction = jest.fn().mockResolvedValue(mockData);
    const initialData = { message: 'Initial' };
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useApi(mockApiFunction, { enabled: true, initialData })
    );
    
    // Wait for the API call to complete
    await waitForNextUpdate();
    
    // After successful API call
    expect(result.current.data).toEqual(mockData);
    
    // Reset the state
    act(() => {
      result.current.reset();
    });
    
    // Should be back to initial state
    expect(result.current.data).toEqual(initialData);
    expect(result.current.error).toBeNull();
  });
});
