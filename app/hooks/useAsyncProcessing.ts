import { useState, useEffect, useCallback, useRef } from 'react';
import { checkStatus } from '../api/advancedApi';

// Helper function to determine if a status is more advanced than another
const isStatusAdvanced = (currentStatus: string, newStatus: string | undefined): boolean => {
  if (!newStatus) return false;

  const statusOrder = {
    'QUEUED': 0,
    'PROCESSING': 1,
    'COMPLETED': 2,
    'FAILED': 2 // Same level as COMPLETED since both are terminal states
  };

  return (statusOrder[currentStatus as keyof typeof statusOrder] || 0) >=
    (statusOrder[newStatus as keyof typeof statusOrder] || 0);
};

export interface AsyncProcessingResult {
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  requestId: string;
  progress: number;
  result?: any;
  error?: {
    message?: string;
    name?: string;
  } | string;
  message?: string;
  timestamp?: string;
  updatedAt?: string;
  workflowType?: 'CHAT' | 'DOCUMENT_ANALYSIS' | 'DATA_ANALYSIS';
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
  const [workflowType, setWorkflowType] = useState<string | undefined>(undefined);

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

      // Use the new status endpoint
      const response = await checkStatus(requestId);

      // Reset polling attempts counter on success
      pollingAttemptsRef.current = 0;

      setLastStatusResponse(response);

      // Update workflow type if available
      if (response.workflowType) {
        setWorkflowType(response.workflowType);
      }

      // Update state based on response, but don't downgrade status
      if (response.status && !isStatusAdvanced(status, response.status)) {
        setStatus(response.status);
      }

      setProgress(response.progress || 0);

      if (response.status === 'COMPLETED' && response.result) {
        setResult(response.result);
        setIsLoading(false);
        clearPollingInterval();
      } else if (response.status === 'FAILED') {
        let errorMsg = 'Unknown error occurred';
        if (typeof response.error === 'string') {
          errorMsg = response.error;
        } else if (response.error && typeof response.error === 'object' && 'message' in response.error) {
          errorMsg = response.error.message || errorMsg;
        }

        setError({ message: errorMsg });
        setIsLoading(false);
        setHasErrored(true);
        clearPollingInterval();
      } else {
        // Still in progress or queued
        setIsLoading(true);
      }

      // Call the status change callback if provided
      if (onStatusChange) {
        // Type assertion to ensure the response matches AsyncProcessingResult
        onStatusChange(response as unknown as AsyncProcessingResult);
      }

      return response;
    } catch (err: any) {
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
  }, [requestId, clearPollingInterval, onStatusChange, hasErrored, status]);
  // Start polling when requestId changes
  useEffect(() => {
    if (!requestId) {
      setIsLoading(false);
      return () => { };
    }

    let startTime = Date.now();

    // Reset error state when starting a new request
    setHasErrored(false);
    setError(null);
    pollingAttemptsRef.current = 0;

    setIsLoading(true);
    setResult(null);

    // Only set status to QUEUED if we don't have a status yet or if we're starting fresh
    if (!status || status === 'COMPLETED' || status === 'FAILED') {
      setStatus('QUEUED');
    }

    setProgress(0);

    // Initial check
    fetchStatus().then(initialResponse => {
      if (!initialResponse) return;

      // If it's already completed or failed, don't start polling
      if (initialResponse.status &&
        (initialResponse.status === 'COMPLETED' || initialResponse.status === 'FAILED')) {
        return;
      }

      // Update status based on initial response if more advanced
      if (initialResponse.status && !isStatusAdvanced(status, initialResponse.status)) {
        setStatus(initialResponse.status);
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
        if (hasErrored ||
          (response && response.status &&
            (response.status === 'COMPLETED' || response.status === 'FAILED'))) {
          clearPollingInterval();
        }
      }, pollingInterval);

    });
    // Cleanup on unmount or when requestId changes
    return () => {
      clearPollingInterval();
    };
  }, [requestId, pollingInterval, maxPollingTime, fetchStatus, clearPollingInterval, hasErrored, status]);

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
    hasErrored,
    workflowType
  };
}