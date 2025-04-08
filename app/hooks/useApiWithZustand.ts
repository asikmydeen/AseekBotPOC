// app/hooks/useApiWithZustand.ts
import { useState, useEffect, useCallback } from 'react';
import { useApiStore } from '../store/apiStore';

/**
 * Custom hook that uses the Zustand API store directly
 * 
 * @param apiFunction - The API function to call
 * @param options - Options for the API call
 * @returns An object with data, loading state, error, and execute function
 */
export function useApiWithZustand<T, P extends any[]>(
  apiFunction: (...args: P) => Promise<T>,
  options: {
    enabled?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    initialData?: T;
    requestId?: string;
  } = {}
) {
  // Extract options with defaults
  const {
    enabled = true,
    onSuccess,
    onError,
    initialData,
    requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
  } = options;

  // Get API store actions
  const { startRequest, setResponse, setError } = useApiStore(state => ({
    startRequest: state.startRequest,
    setResponse: state.setResponse,
    setError: state.setError,
  }));

  // Get API store state for this request
  const request = useApiStore(state => state.requests[requestId]);
  const response = useApiStore(state => state.responses[requestId]);
  const error = useApiStore(state => state.errors[requestId]);

  // Local state for the data
  const [data, setData] = useState<T | undefined>(initialData);

  // Update local data when response changes
  useEffect(() => {
    if (response) {
      setData(response.data);
    }
  }, [response]);

  // Function to execute the API call
  const execute = useCallback(
    async (...args: P): Promise<T> => {
      try {
        // Start the request in the store
        startRequest(requestId, apiFunction.name, 'EXECUTE', args);
        
        // Execute the API function
        const result = await apiFunction(...args);
        
        // Update the store with the successful response
        setResponse(requestId, result, 200);
        
        // Call onSuccess callback if provided
        if (onSuccess) {
          onSuccess(result);
        }
        
        return result;
      } catch (err) {
        // Handle any errors
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        
        // Update the store with the error
        setError(requestId, errorMessage);
        
        // Call onError callback if provided
        if (onError) {
          onError(err instanceof Error ? err : new Error(errorMessage));
        }
        
        throw err;
      }
    },
    [apiFunction, onSuccess, onError, requestId, startRequest, setResponse, setError]
  );
  
  // Auto-execute the API call if enabled
  useEffect(() => {
    if (enabled) {
      // We're not passing args here, so this is for auto-executing without parameters
      execute().catch(() => {
        // Error is already handled in the execute function
      });
    }
  }, [enabled, execute]);
  
  return {
    data,
    isLoading: request?.status === 'pending',
    error: error?.message,
    execute,
    // Additional utility functions
    refetch: execute,
    reset: () => {
      setData(initialData);
    },
  };
}
