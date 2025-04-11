// app/store/statusStore.ts
import { create } from 'zustand';
import { 
  ProcessingStatus, 
  WorkflowType, 
  StatusUpdatePayload,
  isValidProcessingStatus,
  isValidWorkflowType,
  isTerminalStatus
} from '../types/status';

interface StatusState {
  // Current processing status
  status: ProcessingStatus;
  
  // Progress percentage (0-100)
  progress: number;
  
  // Whether any async processing is happening
  isAsyncProcessing: boolean;
  
  // Current workflow type
  workflowType?: WorkflowType;
  
  // Request ID for the current operation
  requestId?: string;
  
  // Error information if status is ERROR or FAILED
  error?: string | { message?: string; name?: string };
  
  // Result data when status is COMPLETED
  result?: any;
  
  // Timestamp of the last status update
  lastUpdated: number;
  
  // Actions
  updateStatus: (payload: StatusUpdatePayload) => void;
  setRequestId: (requestId: string) => void;
  resetStatus: () => void;
  
  // Computed values
  isLoading: boolean;
  isComplete: boolean;
  isError: boolean;
}

export const useStatusStore = create<StatusState>((set, get) => ({
  // Initial state
  status: ProcessingStatus.QUEUED,
  progress: 0,
  isAsyncProcessing: false,
  lastUpdated: Date.now(),
  
  // Actions
  updateStatus: (payload) => {
    const { status, progress, workflowType, result, error } = payload;
    
    // Validate status if provided
    const validStatus = isValidProcessingStatus(status) 
      ? status 
      : get().status;
    
    // Validate workflow type if provided
    const validWorkflowType = workflowType && isValidWorkflowType(workflowType)
      ? workflowType
      : get().workflowType;
    
    set({
      status: validStatus,
      progress: typeof progress === 'number' ? progress : get().progress,
      workflowType: validWorkflowType,
      isAsyncProcessing: !isTerminalStatus(validStatus),
      result: result !== undefined ? result : get().result,
      error: error !== undefined ? error : get().error,
      lastUpdated: Date.now()
    });
    
    // If status is terminal, clean up after a delay
    if (isTerminalStatus(validStatus)) {
      setTimeout(() => {
        // Only reset if the status hasn't changed since this update
        if (get().status === validStatus && get().lastUpdated === Date.now()) {
          set({
            progress: 0,
            isAsyncProcessing: false
          });
        }
      }, validStatus === ProcessingStatus.COMPLETED ? 2000 : 5000);
    }
  },
  
  setRequestId: (requestId) => set({ requestId }),
  
  resetStatus: () => set({
    status: ProcessingStatus.QUEUED,
    progress: 0,
    isAsyncProcessing: false,
    error: undefined,
    result: undefined,
    lastUpdated: Date.now()
  }),
  
  // Computed values
  get isLoading() {
    return get().status === ProcessingStatus.QUEUED || 
           get().status === ProcessingStatus.STARTED || 
           get().status === ProcessingStatus.PROCESSING;
  },
  
  get isComplete() {
    return get().status === ProcessingStatus.COMPLETED;
  },
  
  get isError() {
    return get().status === ProcessingStatus.FAILED || 
           get().status === ProcessingStatus.ERROR;
  }
}));

// Helper function to get the current status
export const getCurrentStatus = (): ProcessingStatus => {
  return useStatusStore.getState().status;
};

// Helper function to check if a specific status is active
export const isStatusActive = (status: ProcessingStatus): boolean => {
  return useStatusStore.getState().status === status;
};

// Helper function to update status with a simpler API
export const updateStatus = (
  status: ProcessingStatus, 
  progress: number = 0, 
  options: Partial<Omit<StatusUpdatePayload, 'status' | 'progress'>> = {}
): void => {
  useStatusStore.getState().updateStatus({ status, progress, ...options });
};
