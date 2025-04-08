// app/hooks/useApi.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { useApiStore } from '../store/apiStore';
import { apiService } from '../utils/apiService';

// Cache for storing API responses
const apiCache = new Map<string, { data: any; timestamp: number }>();

// Default cache time (5 minutes)
const DEFAULT_CACHE_TIME = 5 * 60 * 1000;

// In-flight requests tracker to prevent duplicate requests
const inFlightRequests = new Map<string, Promise<any>>();

// Generate a cache key from the function name and arguments
function generateCacheKey(fnName: string, args: any[]): string {
  return `${fnName}:${JSON.stringify(args)}`;
}

/**
 * Custom hook for making API requests with caching and deduplication
 *
 * @param apiFunction - The API function to call
 * @param options - Options for caching and error handling
 * @returns An object with data, loading state, error, and execute function
 */
export function useApi<T, P extends any[]>(
  apiFunction: (...args: P) => Promise<T>,
  options: {
    cacheTime?: number;
    enabled?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    retry?: boolean | number;
    retryDelay?: number;
    initialData?: T;
  } = {}
) {
  // Extract options with defaults
  const {
    cacheTime = DEFAULT_CACHE_TIME,
    enabled = true,
    onSuccess,
    onError,
    retry = false,
    retryDelay = 1000,
    initialData,
  } = options;

  // State for the hook
  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Refs to prevent stale closures in callbacks
  const retryCountRef = useRef(0);
  const isMountedRef = useRef(true);
  const functionNameRef = useRef(apiFunction.name || 'anonymous');

  // Function to execute the API call
  const execute = useCallback(
    async (...args: P): Promise<T> => {
      // Generate a cache key for this request
      const cacheKey = generateCacheKey(functionNameRef.current, args);

      // Check if we have a cached response that's still valid
      const cachedResponse = apiCache.get(cacheKey);
      if (cachedResponse && Date.now() - cachedResponse.timestamp < cacheTime) {
        setData(cachedResponse.data);
        return cachedResponse.data;
      }

      // Check if this request is already in flight
      if (inFlightRequests.has(cacheKey)) {
        try {
          const result = await inFlightRequests.get(cacheKey);
          if (isMountedRef.current) {
            setData(result);
          }
          return result;
        } catch (err) {
          if (isMountedRef.current) {
            setError(err instanceof Error ? err : new Error(String(err)));
          }
          throw err;
        }
      }

      // Start a new request
      setIsLoading(true);
      setError(null);

      // Create the promise for this request
      const promise = (async () => {
        try {
          const result = await apiFunction(...args);

          // Cache the successful response
          apiCache.set(cacheKey, {
            data: result,
            timestamp: Date.now(),
          });

          if (isMountedRef.current) {
            setData(result);
            setIsLoading(false);
          }

          // Call onSuccess callback if provided
          if (onSuccess && isMountedRef.current) {
            onSuccess(result);
          }

          return result;
        } catch (err) {
          // Handle retry logic
          if (retry && retryCountRef.current < (typeof retry === 'number' ? retry : 3)) {
            retryCountRef.current += 1;

            // Wait for the retry delay
            await new Promise(resolve => setTimeout(resolve, retryDelay));

            // Try again if still mounted
            if (isMountedRef.current) {
              return execute(...args);
            }
          }

          if (isMountedRef.current) {
            setError(err instanceof Error ? err : new Error(String(err)));
            setIsLoading(false);

            // Call onError callback if provided
            if (onError) {
              onError(err instanceof Error ? err : new Error(String(err)));
            }
          }

          throw err;
        } finally {
          // Remove this request from in-flight requests
          inFlightRequests.delete(cacheKey);
        }
      })();

      // Store the promise in the in-flight requests map
      inFlightRequests.set(cacheKey, promise);

      return promise;
    },
    [apiFunction, cacheTime, onSuccess, onError, retry, retryDelay]
  );

  // Auto-execute the API call if enabled
  useEffect(() => {
    isMountedRef.current = true;

    if (enabled) {
      // We're not passing args here, so this is for auto-executing without parameters
      execute(...[] as unknown as P).catch(() => {
        // Error is already handled in the execute function
      });
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [enabled, execute]);

  // Reset retry count when the function changes
  useEffect(() => {
    retryCountRef.current = 0;
    functionNameRef.current = apiFunction.name || 'anonymous';
  }, [apiFunction]);

  return {
    data,
    isLoading,
    error,
    execute,
    // Additional utility functions
    refetch: execute,
    reset: () => {
      setData(initialData);
      setError(null);
      retryCountRef.current = 0;
    },
  };
}

/**
 * Predefined hooks for common API operations
 */

export function useSendMessage() {
  return useApi(apiService.sendMessage);
}

export function useCheckStatus(requestId: string, options = {}) {
  return useApi(() => apiService.checkStatus(requestId), {
    enabled: !!requestId,
    ...options,
  });
}

export function useUploadFile() {
  return useApi(apiService.uploadFile);
}

export function useDeleteFile() {
  return useApi(apiService.deleteFile);
}

export function useDownloadFile() {
  return useApi(apiService.downloadFile);
}

export function useGetUserFiles(options = {}) {
  return useApi(apiService.getUserFiles, options);
}

export function useCreateTicket() {
  return useApi(apiService.createTicket);
}

export function useGetPrompts(options = {}) {
  return useApi(apiService.getPrompts, {
    cacheTime: 60 * 1000, // 1 minute cache
    ...options,
  });
}

export function useGetPromptById(id: string, options = {}) {
  return useApi(() => apiService.getPromptById(id), {
    enabled: !!id,
    ...options,
  });
}

export function useCreatePrompt() {
  return useApi(apiService.createPrompt);
}

export function useUpdatePrompt() {
  return useApi(
    (id: string, data: any) => apiService.updatePrompt(id, data)
  );
}

export function useDeletePrompt() {
  return useApi(apiService.deletePrompt);
}
