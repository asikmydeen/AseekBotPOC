import { renderHook, act } from '@testing-library/react-hooks';
import { useTicketSystem } from '../../../src/hooks/useTicketSystem';
import * as ticketApi from '../../../src/api/ticketApi';

// Mock the createTicketApi function
jest.mock('../../../src/api/ticketApi', () => ({
  createTicketApi: jest.fn(),
}));

describe('useTicketSystem Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize with default values', () => {
    const { result } = renderHook(() => useTicketSystem());
    
    expect(result.current.isTicketFormOpen).toBe(false);
    expect(result.current.currentStep).toBe(1);
    expect(result.current.ticketDetails).toEqual({
      subject: '',
      description: '',
      priority: 'medium',
      category: '',
      email: '',
      name: '',
    });
  });

  test('should open and close ticket form', () => {
    const { result } = renderHook(() => useTicketSystem());
    
    // Initially closed
    expect(result.current.isTicketFormOpen).toBe(false);
    
    // Open the form
    act(() => {
      result.current.openTicketForm();
    });
    expect(result.current.isTicketFormOpen).toBe(true);
    
    // Close the form
    act(() => {
      result.current.closeTicketForm();
    });
    expect(result.current.isTicketFormOpen).toBe(false);
  });

  test('should change ticket steps', () => {
    const { result } = renderHook(() => useTicketSystem());
    
    // Initially at step 1
    expect(result.current.currentStep).toBe(1);
    
    // Move to next step
    act(() => {
      result.current.nextStep();
    });
    expect(result.current.currentStep).toBe(2);
    
    // Move to previous step
    act(() => {
      result.current.prevStep();
    });
    expect(result.current.currentStep).toBe(1);
    
    // Set specific step
    act(() => {
      result.current.setStep(3);
    });
    expect(result.current.currentStep).toBe(3);
  });

  test('should update ticket details', () => {
    const { result } = renderHook(() => useTicketSystem());
    
    const newDetails = {
      subject: 'Test Subject',
      description: 'Test Description',
      priority: 'high',
      category: 'technical',
      email: 'test@example.com',
      name: 'Test User',
    };
    
    act(() => {
      result.current.updateTicketDetails(newDetails);
    });
    
    expect(result.current.ticketDetails).toEqual(newDetails);
  });

  test('should pre-populate ticket details based on context', () => {
    const contextData = {
      subject: 'Issue from chat',
      description: 'This is a pre-populated description from the chat context',
    };
    
    const { result } = renderHook(() => useTicketSystem());
    
    act(() => {
      result.current.openTicketFormWithContext(contextData);
    });
    
    // Form should be open
    expect(result.current.isTicketFormOpen).toBe(true);
    
    // Details should be pre-populated
    expect(result.current.ticketDetails.subject).toBe(contextData.subject);
    expect(result.current.ticketDetails.description).toBe(contextData.description);
  });

  test('should create a ticket successfully', async () => {
    // Mock successful API response
    const mockTicketResponse = { id: '123', status: 'created' };
    (ticketApi.createTicketApi as jest.Mock).mockResolvedValue(mockTicketResponse);
    
    const { result, waitForNextUpdate } = renderHook(() => useTicketSystem());
    
    // Set ticket details
    act(() => {
      result.current.updateTicketDetails({
        subject: 'Test Ticket',
        description: 'This is a test ticket',
        priority: 'high',
        category: 'technical',
        email: 'test@example.com',
        name: 'Test User',
      });
    });
    
    // Submit the ticket
    act(() => {
      result.current.submitTicket();
    });
    
    // Should be in loading state
    expect(result.current.isSubmitting).toBe(true);
    
    // Wait for the API call to resolve
    await waitForNextUpdate();
    
    // API should have been called with the correct data
    expect(ticketApi.createTicketApi).toHaveBeenCalledWith(result.current.ticketDetails);
    
    // Should no longer be in loading state
    expect(result.current.isSubmitting).toBe(false);
    
    // Should have ticket response
    expect(result.current.ticketResponse).toEqual(mockTicketResponse);
    
    // Form should be closed after successful submission
    expect(result.current.isTicketFormOpen).toBe(false);
  });

  test('should handle ticket creation error', async () => {
    // Mock API error
    const mockError = new Error('API Error');
    (ticketApi.createTicketApi as jest.Mock).mockRejectedValue(mockError);
    
    const { result, waitForNextUpdate } = renderHook(() => useTicketSystem());
    
    // Set ticket details
    act(() => {
      result.current.updateTicketDetails({
        subject: 'Test Ticket',
        description: 'This is a test ticket',
        priority: 'medium',
        category: 'general',
        email: 'test@example.com',
        name: 'Test User',
      });
    });
    
    // Submit the ticket
    act(() => {
      result.current.submitTicket();
    });
    
    // Should be in loading state
    expect(result.current.isSubmitting).toBe(true);
    
    // Wait for the API call to reject
    await waitForNextUpdate();
    
    // API should have been called
    expect(ticketApi.createTicketApi).toHaveBeenCalled();
    
    // Should no longer be in loading state
    expect(result.current.isSubmitting).toBe(false);
    
    // Should have error
    expect(result.current.error).toBe('Failed to create ticket: API Error');
    
    // Form should still be open after failed submission
    expect(result.current.isTicketFormOpen).toBe(true);
  });

  test('should reset form state', () => {
    const { result } = renderHook(() => useTicketSystem());
    
    // Set some non-default values
    act(() => {
      result.current.openTicketForm();
      result.current.updateTicketDetails({
        subject: 'Test Subject',
        description: 'Test Description',
      });
      result.current.setStep(3);
    });
    
    // Reset the form
    act(() => {
      result.current.resetForm();
    });
    
    // Should be back to default values
    expect(result.current.isTicketFormOpen).toBe(false);
    expect(result.current.currentStep).toBe(1);
    expect(result.current.ticketDetails).toEqual({
      subject: '',
      description: '',
      priority: 'medium',
      category: '',
      email: '',
      name: '',
    });
    expect(result.current.error).toBe(null);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.ticketResponse).toBe(null);
  });
});