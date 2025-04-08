// app/store/apiStore.ts
import { create } from 'zustand';
import { LAMBDA_ENDPOINTS } from '../utils/lambdaApi';

// Define types for our API state
interface ApiRequest {
  id: string;
  url: string;
  method: string;
  body?: any;
  timestamp: number;
  status: 'pending' | 'success' | 'error';
}

interface ApiResponse {
  id: string;
  data: any;
  status: number;
  timestamp: number;
}

interface ApiError {
  id: string;
  message: string;
  code?: string;
  timestamp: number;
}

interface ApiState {
  requests: Record<string, ApiRequest>;
  responses: Record<string, ApiResponse>;
  errors: Record<string, ApiError>;
  isLoading: boolean;
  activeRequestCount: number;
  
  // Actions
  startRequest: (id: string, url: string, method: string, body?: any) => void;
  setResponse: (id: string, data: any, status: number) => void;
  setError: (id: string, message: string, code?: string) => void;
  clearRequest: (id: string) => void;
  clearAll: () => void;
}

// Generate a unique request ID
const generateRequestId = () => `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// Create the store
export const useApiStore = create<ApiState>((set) => ({
  requests: {},
  responses: {},
  errors: {},
  isLoading: false,
  activeRequestCount: 0,
  
  // Start a new API request
  startRequest: (id, url, method, body) => set((state) => {
    const newRequests = {
      ...state.requests,
      [id]: {
        id,
        url,
        method,
        body,
        timestamp: Date.now(),
        status: 'pending',
      },
    };
    
    return {
      requests: newRequests,
      isLoading: true,
      activeRequestCount: state.activeRequestCount + 1,
    };
  }),
  
  // Set a successful response
  setResponse: (id, data, status) => set((state) => {
    const newResponses = {
      ...state.responses,
      [id]: {
        id,
        data,
        status,
        timestamp: Date.now(),
      },
    };
    
    const newRequests = { ...state.requests };
    if (newRequests[id]) {
      newRequests[id] = {
        ...newRequests[id],
        status: 'success',
      };
    }
    
    const newActiveRequestCount = state.activeRequestCount - 1;
    
    return {
      responses: newResponses,
      requests: newRequests,
      isLoading: newActiveRequestCount > 0,
      activeRequestCount: newActiveRequestCount,
    };
  }),
  
  // Set an error response
  setError: (id, message, code) => set((state) => {
    const newErrors = {
      ...state.errors,
      [id]: {
        id,
        message,
        code,
        timestamp: Date.now(),
      },
    };
    
    const newRequests = { ...state.requests };
    if (newRequests[id]) {
      newRequests[id] = {
        ...newRequests[id],
        status: 'error',
      };
    }
    
    const newActiveRequestCount = state.activeRequestCount - 1;
    
    return {
      errors: newErrors,
      requests: newRequests,
      isLoading: newActiveRequestCount > 0,
      activeRequestCount: newActiveRequestCount,
    };
  }),
  
  // Clear a specific request and its associated data
  clearRequest: (id) => set((state) => {
    const { [id]: _, ...newRequests } = state.requests;
    const { [id]: __, ...newResponses } = state.responses;
    const { [id]: ___, ...newErrors } = state.errors;
    
    return {
      requests: newRequests,
      responses: newResponses,
      errors: newErrors,
    };
  }),
  
  // Clear all requests, responses, and errors
  clearAll: () => set({
    requests: {},
    responses: {},
    errors: {},
    isLoading: false,
    activeRequestCount: 0,
  }),
}));

// Selector hooks for convenience
export const useApiLoading = () => useApiStore((state) => state.isLoading);
export const useApiRequest = (id: string) => useApiStore((state) => state.requests[id]);
export const useApiResponse = (id: string) => useApiStore((state) => state.responses[id]);
export const useApiError = (id: string) => useApiStore((state) => state.errors[id]);
