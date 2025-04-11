// app/types/status.ts
/**
 * Enum for all possible processing status values
 */
export enum ProcessingStatus {
  QUEUED = 'QUEUED',
  STARTED = 'STARTED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ERROR = 'ERROR'
}

/**
 * Enum for workflow types
 */
export enum WorkflowType {
  CHAT = 'CHAT',
  DOCUMENT_ANALYSIS = 'DOCUMENT_ANALYSIS',
  DATA_ANALYSIS = 'DATA_ANALYSIS'
}

/**
 * Interface for status update payload
 */
export interface StatusUpdatePayload {
  status: ProcessingStatus;
  progress: number;
  message?: string;
  isPromptMessage?: boolean;
  workflowType?: WorkflowType;
  result?: any;
  error?: string | { message?: string; name?: string };
}

/**
 * Type guard to check if a string is a valid ProcessingStatus
 */
export function isValidProcessingStatus(status: string): status is ProcessingStatus {
  return Object.values(ProcessingStatus).includes(status as ProcessingStatus);
}

/**
 * Type guard to check if a string is a valid WorkflowType
 */
export function isValidWorkflowType(type: string): type is WorkflowType {
  return Object.values(WorkflowType).includes(type as WorkflowType);
}

/**
 * Helper function to determine if a status is more advanced than another
 */
export function isStatusAdvanced(currentStatus: ProcessingStatus, newStatus: ProcessingStatus | undefined): boolean {
  if (!newStatus) return false;

  const statusOrder = {
    [ProcessingStatus.QUEUED]: 0,
    [ProcessingStatus.STARTED]: 1,
    [ProcessingStatus.PROCESSING]: 2,
    [ProcessingStatus.COMPLETED]: 3,
    [ProcessingStatus.FAILED]: 3, // Same level as COMPLETED since both are terminal states
    [ProcessingStatus.ERROR]: 3   // Same level as FAILED
  };

  return (statusOrder[currentStatus] || 0) >= (statusOrder[newStatus] || 0);
}

/**
 * Helper function to check if a status is a terminal status
 */
export function isTerminalStatus(status: ProcessingStatus): boolean {
  return status === ProcessingStatus.COMPLETED || 
         status === ProcessingStatus.FAILED || 
         status === ProcessingStatus.ERROR;
}

/**
 * Helper function to check if a status is an error status
 */
export function isErrorStatus(status: ProcessingStatus): boolean {
  return status === ProcessingStatus.FAILED || status === ProcessingStatus.ERROR;
}

/**
 * Helper function to get a human-readable status message
 */
export function getStatusMessage(status: ProcessingStatus): string {
  switch (status) {
    case ProcessingStatus.QUEUED:
      return 'Queued for processing';
    case ProcessingStatus.STARTED:
      return 'Starting process';
    case ProcessingStatus.PROCESSING:
      return 'Processing your request';
    case ProcessingStatus.COMPLETED:
      return 'Processing completed';
    case ProcessingStatus.FAILED:
      return 'Processing failed';
    case ProcessingStatus.ERROR:
      return 'An error occurred';
    default:
      return 'Unknown status';
  }
}
