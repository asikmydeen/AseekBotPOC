import { useState, useEffect, useCallback, useRef } from 'react';
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
  const [hasErrored, setHasErrored] = useState<boolean>(false);

  // Tracking interval and polling state
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);
  const pollingAttemptsRef = useRef<number>(0);
  const maxPollingAttemptsRef = useRef<number>(5); // Max retries before giving up
  const lastCheckedTimeRef = useRef<number>(0);

  const {
    pollingInterval = 3000, // 3 seconds by default
    maxPollingTime = 15 * 60 * 1000, // 15 minutes by default
    onStatusChange
  } = options;

  const clearPollingInterval = useCallback(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  }, []);

  const fetchStatus = useCallback(async () => {
    if (!requestId || hasErrored) return null;

    // Prevent duplicate fetches in quick succession (debounce)
    const now = Date.now();
    if (now - lastCheckedTimeRef.current < 1000) { // 1 second debounce
      return null;
    }
    lastCheckedTimeRef.current = now;

    try {
      pollingAttemptsRef.current += 1;
      const response = await checkStatus(requestId);

      // Reset polling attempts counter on success
      pollingAttemptsRef.current = 0;

      setLastStatusResponse(response);

      // Update state based on response
      setStatus(response.status);
      setProgress(response.progress || 0);

      if (response.status === 'COMPLETED' && response.result) {
        setResult(response.result);
        setIsLoading(false);
        clearPollingInterval();
      } else if (response.status === 'FAILED') {
        setError(response.error || { message: 'Unknown error occurred' });
        setIsLoading(false);
        setHasErrored(true);
        clearPollingInterval();
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

      // Check if we've reached max retry attempts
      if (pollingAttemptsRef.current >= maxPollingAttemptsRef.current) {
        console.error(`Failed after ${pollingAttemptsRef.current} attempts, giving up.`);
        setError(err);
        setIsLoading(false);
        setHasErrored(true);
        clearPollingInterval();
      }

      return null;
    }
  }, [requestId, clearPollingInterval, onStatusChange, hasErrored]);

  // Start polling when requestId changes
  useEffect(() => {
    if (!requestId) {
      setIsLoading(false);
      return () => {};
    }

    let startTime = Date.now();

    // Reset error state when starting a new request
    setHasErrored(false);
    setError(null);
    pollingAttemptsRef.current = 0;

    setIsLoading(true);
    setResult(null);
    setStatus('QUEUED');
    setProgress(0);

    // Initial check
    fetchStatus().then(initialResponse => {
      if (!initialResponse) return;

      // If it's already completed or failed, don't start polling
      if (initialResponse.status === 'COMPLETED' || initialResponse.status === 'FAILED') {
        return;
      }

      // Start polling
      clearPollingInterval(); // Clear any existing interval first

      intervalIdRef.current = setInterval(async () => {
        // Check if we've exceeded max polling time
        if (Date.now() - startTime > maxPollingTime) {
          clearPollingInterval();
          setError({ message: 'Request timed out after maximum polling time' });
          setIsLoading(false);
          setHasErrored(true);
          return;
        }

        // Fetch status
        const response = await fetchStatus();

        // Stop polling if completed, failed, or errored
        if (response && (response.status === 'COMPLETED' || response.status === 'FAILED') || hasErrored) {
          clearPollingInterval();
        }
      }, pollingInterval);
    });

    // Cleanup on unmount or when requestId changes
    return () => {
      clearPollingInterval();
    };
  }, [requestId, pollingInterval, maxPollingTime, fetchStatus, clearPollingInterval, hasErrored]);

  // Function to manually trigger a status check
  const refreshStatus = useCallback(() => {
    if (hasErrored) {
      // Reset error state to allow retrying
      setHasErrored(false);
      pollingAttemptsRef.current = 0;
    }
    return fetchStatus();
  }, [fetchStatus, hasErrored]);

  return {
    result,
    status,
    isLoading,
    progress,
    error,
    refreshStatus,
    lastResponse: lastStatusResponse,
    hasErrored
  };
}