import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TicketForm from '../../../../app/components/chat/TicketForm';

// Mock the next/navigation module
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

describe('TicketForm Component', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form with empty fields when no ticket data is provided', () => {
    render(<TicketForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    // Check if form elements are rendered
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    
    // Check if fields are empty
    expect(screen.getByLabelText(/title/i)).toHaveValue('');
    expect(screen.getByLabelText(/description/i)).toHaveValue('');
  });

  it('renders the form with pre-populated fields when ticket data is provided', () => {
    const ticketData = {
      id: '123',
      title: 'Test Ticket',
      description: 'This is a test ticket description',
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    render(<TicketForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} ticket={ticketData} />);
    
    // Check if fields are pre-populated
    expect(screen.getByLabelText(/title/i)).toHaveValue('Test Ticket');
    expect(screen.getByLabelText(/description/i)).toHaveValue('This is a test ticket description');
  });

  it('calls onCancel when cancel button is clicked', async () => {
    render(<TicketForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('shows validation errors when submitting with empty fields', async () => {
    render(<TicketForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await userEvent.click(submitButton);
    
    // Check for validation error messages
    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('calls onSubmit with correct data when form is submitted with valid data', async () => {
    render(<TicketForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    // Fill in the form
    await userEvent.type(screen.getByLabelText(/title/i), 'New Test Ticket');
    await userEvent.type(screen.getByLabelText(/description/i), 'This is a new test ticket description');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await userEvent.click(submitButton);
    
    // Check if onSubmit was called with the correct data
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith({
        title: 'New Test Ticket',
        description: 'This is a new test ticket description',
      });
    });
  });

  it('calls onSubmit with updated data when editing an existing ticket', async () => {
    const ticketData = {
      id: '123',
      title: 'Test Ticket',
      description: 'This is a test ticket description',
      status: 'open',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    render(<TicketForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} ticket={ticketData} />);
    
    // Clear and update the title field
    const titleInput = screen.getByLabelText(/title/i);
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Updated Test Ticket');
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: /submit/i });
    await userEvent.click(submitButton);
    
    // Check if onSubmit was called with the updated data
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
      expect(mockOnSubmit).toHaveBeenCalledWith({
        id: '123',
        title: 'Updated Test Ticket',
        description: 'This is a test ticket description',
        status: 'open',
        createdAt: ticketData.createdAt,
        updatedAt: expect.any(String),
      });
    });
  });
});