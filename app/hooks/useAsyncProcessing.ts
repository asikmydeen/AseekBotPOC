import { useState, useEffect, useCallback } from 'react';
import { checkStatus } from '../utils/asyncApi';

export interface AsyncProcessingResult {
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  requestId: string;
  progress: number;
  result?: any;
  error?: {
    message: string;
    name: string;
  };
  timestamp?: string;
  updatedAt?: string;
}

interface UseAsyncProcessingOptions {
  pollingInterval?: number;
  maxPollingTime?: number;
  onStatusChange?: (status: AsyncProcessingResult) => void;
}

export function useAsyncProcessing(
  requestId: string | null,
  options: UseAsyncProcessingOptions = {}
) {
  const [result, setResult] = useState<any>(null);
  const [status, setStatus] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<any>(null);
  const [lastStatusResponse, setLastStatusResponse] = useState<AsyncProcessingResult | null>(null);

  const {
    pollingInterval = 3000, // 3 seconds by default
    maxPollingTime = 15 * 60 * 1000, // 15 minutes by default
    onStatusChange
  } = options;

  const fetchStatus = useCallback(async () => {
    if (!requestId) return;

    try {
      const response = await checkStatus(requestId);
      setLastStatusResponse(response);

      // Update state based on response
      setStatus(response.status);
      setProgress(response.progress || 0);

      if (response.status === 'COMPLETED' && response.result) {
        setResult(response.result);
        setIsLoading(false);
      } else if (response.status === 'FAILED') {
        setError(response.error || { message: 'Unknown error occurred' });
        setIsLoading(false);
      } else {
        // Still in progress or queued
        setIsLoading(true);
      }

      // Call the status change callback if provided
      if (onStatusChange) {
        onStatusChange(response);
      }

      return response;
    } catch (err) {
      console.error('Error checking status:', err);
      setError(err);
      setIsLoading(false);
      return null;
    }
  }, [requestId, onStatusChange]);

  // Start polling when requestId changes
  useEffect(() => {
    if (!requestId) {
      setIsLoading(false);
      return;
    }

    let intervalId: NodeJS.Timeout;
    let startTime = Date.now();
    let shouldContinuePolling = true;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setStatus('QUEUED');
    setProgress(0);

    // Initial check
    fetchStatus().then(initialResponse => {
      if (!initialResponse) return;

      // If it's already completed or failed, don't start polling
      if (initialResponse.status === 'COMPLETED' || initialResponse.status === 'FAILED') {
        shouldContinuePolling = false;
        return;
      }

      // Start polling
      intervalId = setInterval(async () => {
        // Check if we've exceeded max polling time
        if (Date.now() - startTime > maxPollingTime) {
          clearInterval(intervalId);
          setError({ message: 'Request timed out after maximum polling time' });
          setIsLoading(false);
          return;
        }

        // Fetch status
        const response = await fetchStatus();

        // Stop polling if completed or failed
        if (response && (response.status === 'COMPLETED' || response.status === 'FAILED')) {
          clearInterval(intervalId);
        }
      }, pollingInterval);
    });

    // Cleanup on unmount or when requestId changes
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [requestId, pollingInterval, maxPollingTime, fetchStatus]);

  // Function to manually trigger a status check
  const refreshStatus = useCallback(() => {
    return fetchStatus();
  }, [fetchStatus]);

  return {
    result,
    status,
    isLoading,
    progress,
    error,
    refreshStatus,
    lastResponse: lastStatusResponse
  };
}