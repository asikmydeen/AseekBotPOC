import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../utils/apiService';
import {
  ProcessingStatus,
  WorkflowType,
  isStatusAdvanced as isStatusAdvancedUtil,
  isTerminalStatus
} from '../types/status';

// Define the UnifiedApiResponse interface
interface UnifiedApiResponse {
  requestId?: string;
  status?: string; // Will be converted to ProcessingStatus
  progress?: number;
  result?: any;
  error?: string | { message?: string; name?: string };
  message?: string;
  timestamp?: string;
  workflowType?: string; // Will be converted to WorkflowType
  updatedAt?: string;
}

// Helper function to determine if a status is more advanced than another
const isStatusAdvanced = (currentStatus: string, newStatus: string | undefined): boolean => {
  if (!newStatus) return false;

  // Convert string statuses to ProcessingStatus enum values if they're valid
  const currentEnum = Object.values(ProcessingStatus).includes(currentStatus as ProcessingStatus)
    ? currentStatus as ProcessingStatus
    : ProcessingStatus.QUEUED;

  const newEnum = Object.values(ProcessingStatus).includes(newStatus as ProcessingStatus)
    ? newStatus as ProcessingStatus
    : undefined;

  return isStatusAdvancedUtil(currentEnum, newEnum);
};

export interface AsyncProcessingResult {
  status: ProcessingStatus;
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
  workflowType?: WorkflowType;
}

interface UseAsyncProcessingOptions {
  pollingInterval?: number;
  maxPollingTime?: number;
  onStatusChange?: (status: AsyncProcessingResult) => void;
}

// Helper function to convert UnifiedApiResponse to AsyncProcessingResult
const convertToAsyncProcessingResult = (response: UnifiedApiResponse): AsyncProcessingResult => {
  // Convert string status to ProcessingStatus enum
  const status = response.status && Object.values(ProcessingStatus).includes(response.status as ProcessingStatus)
    ? response.status as ProcessingStatus
    : ProcessingStatus.QUEUED;

  // Convert string workflowType to WorkflowType enum
  const workflowType = response.workflowType && Object.values(WorkflowType).includes(response.workflowType as WorkflowType)
    ? response.workflowType as WorkflowType
    : undefined;

  return {
    status,
    requestId: response.requestId || '',
    progress: response.progress || 0,
    result: response.result,
    error: response.error,
    message: response.message,
    timestamp: response.timestamp,
    updatedAt: (response as any).updatedAt,
    workflowType
  };
};

export function useAsyncProcessing(
  requestId: string | null,
  options: UseAsyncProcessingOptions = {}
) {
  const [result, setResult] = useState<any>(null);
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.QUEUED);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<any>(null);
  const [lastStatusResponse, setLastStatusResponse] = useState<AsyncProcessingResult | null>(null);
  const [hasErrored, setHasErrored] = useState<boolean>(false);
  const [workflowType, setWorkflowType] = useState<WorkflowType | undefined>(undefined);

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
      const apiResponse = await apiService.checkStatus(requestId);

      // Convert API response to AsyncProcessingResult
      const response = convertToAsyncProcessingResult(apiResponse);

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

      // Persist to localStorage if still in progress
      if (response.status === ProcessingStatus.QUEUED || response.status === ProcessingStatus.PROCESSING) {
        try {
          const stored = localStorage.getItem('pendingRequests') || '{}';
          const pending = JSON.parse(stored);
          pending[requestId] = {
            status: response.status,
            progress: response.progress || 0,
            timestamp: Date.now()
          };
          localStorage.setItem('pendingRequests', JSON.stringify(pending));
        } catch (e) {
          console.error('Error saving pending request to localStorage:', e);
        }
      } else if (response.status === ProcessingStatus.COMPLETED || response.status === ProcessingStatus.FAILED) {
        // Remove from localStorage if completed or failed
        try {
          const stored = localStorage.getItem('pendingRequests');
          if (stored) {
            const pending = JSON.parse(stored);
            if (pending[requestId]) {
              delete pending[requestId];
              localStorage.setItem('pendingRequests', JSON.stringify(pending));
            }
          }
        } catch (e) {
          console.error('Error removing completed request from localStorage:', e);
        }
      }

      if (response.status === ProcessingStatus.COMPLETED && response.result) {
        setResult(response.result);
        setIsLoading(false);
        clearPollingInterval();
      } else if (response.status === ProcessingStatus.FAILED) {
        let errorMsg = 'Unknown error occurred';
        if (typeof response.error === 'string') {
          errorMsg = response.error;
        } else if (response.error && typeof response.error === 'object' && 'message' in response.error) {
          errorMsg = (response.error as { message?: string }).message || errorMsg;
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
        onStatusChange(response);
      }

      return response;
    } catch (err) {
      console.error('Error checking status:', err);

      // Check if we've reached max retry attempts
      if (pollingAttemptsRef.current >= maxPollingAttemptsRef.current) {
        console.error(`Failed after ${pollingAttemptsRef.current} attempts, giving up.`);
        setError(err instanceof Error ? err : new Error('Unknown error occurred'));
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

    // Check if there is a pending state in localStorage for this requestId
    try {
      const stored = localStorage.getItem('pendingRequests');
      if (stored) {
        const pending = JSON.parse(stored);
        if (pending[requestId] && (
          pending[requestId].status === ProcessingStatus.QUEUED ||
          pending[requestId].status === ProcessingStatus.PROCESSING
        )) {
          // Optionally, update state with the persisted progress before starting polling
          const persisted = pending[requestId];
          setStatus(persisted.status);
          setProgress(persisted.progress || 0);
        }
      }
    } catch (e) {
      console.error('Error reading pending request from localStorage:', e);
    }

    // Existing polling logic proceeds below as before ...
    let startTime = Date.now();
    setHasErrored(false);
    setError(null);
    pollingAttemptsRef.current = 0;
    setIsLoading(true);
    setResult(null);
    if (!status || status === ProcessingStatus.COMPLETED || status === ProcessingStatus.FAILED) {
      setStatus(ProcessingStatus.QUEUED);
    }
    setProgress(0);

    // IMPORTANT: This polling will now continue even if the page is refreshed, as the pending state can be reloaded from localStorage.
    fetchStatus().then(initialResponse => {
      if (!initialResponse) return;

      // If it's already completed or failed, don't start polling
      if (initialResponse.status === ProcessingStatus.COMPLETED || initialResponse.status === ProcessingStatus.FAILED) {
        return;
      }

      if (initialResponse.status && !isStatusAdvanced(status, initialResponse.status)) {
        setStatus(initialResponse.status);
      }

      clearPollingInterval(); // Clear any existing interval first

      intervalIdRef.current = setInterval(async () => {
        if (Date.now() - startTime > maxPollingTime) {
          clearPollingInterval();
          setError({ message: 'Request timed out after maximum polling time' });
          setIsLoading(false);
          setHasErrored(true);
          return;
        }

        const apiResponse = await fetchStatus();

        // Stop polling if completed, failed, or errored
        if (hasErrored || (apiResponse && isTerminalStatus(apiResponse.status))) {
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
