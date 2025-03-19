import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import FeedbackForm from '../../../../app/components/chat/FeedbackForm';

describe('FeedbackForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnClose = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('renders the feedback form correctly', () => {
    render(<FeedbackForm onSubmit={mockOnSubmit} onClose={mockOnClose} />);
    
    // Check if the form elements are rendered
    expect(screen.getByText('How was your experience?')).toBeInTheDocument();
    expect(screen.getByLabelText('Feedback')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    
    // Check if rating stars are rendered
    const stars = screen.getAllByRole('radio');
    expect(stars.length).toBe(5);
  });
  
  it('allows user to input feedback text', async () => {
    render(<FeedbackForm onSubmit={mockOnSubmit} onClose={mockOnClose} />);
    
    const feedbackInput = screen.getByLabelText('Feedback');
    await userEvent.type(feedbackInput, 'This is a test feedback');
    
    expect(feedbackInput).toHaveValue('This is a test feedback');
  });
  
  it('allows user to select a rating', async () => {
    render(<FeedbackForm onSubmit={mockOnSubmit} onClose={mockOnClose} />);
    
    const fourStarRating = screen.getAllByRole('radio')[3]; // 4-star rating (0-indexed)
    await userEvent.click(fourStarRating);
    
    expect(fourStarRating).toBeChecked();
  });
  
  it('submits the form with correct data when filled and submitted', async () => {
    render(<FeedbackForm onSubmit={mockOnSubmit} onClose={mockOnClose} />);
    
    // Fill the form
    const feedbackInput = screen.getByLabelText('Feedback');
    await userEvent.type(feedbackInput, 'This is a test feedback');
    
    const fourStarRating = screen.getAllByRole('radio')[3]; // 4-star rating (0-indexed)
    await userEvent.click(fourStarRating);
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await userEvent.click(submitButton);
    
    // Check if onSubmit was called with correct data
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith({
      feedback: 'This is a test feedback',
      rating: 4
    });
  });
  
  it('does not submit the form when feedback is empty', async () => {
    render(<FeedbackForm onSubmit={mockOnSubmit} onClose={mockOnClose} />);
    
    // Select rating but leave feedback empty
    const fourStarRating = screen.getAllByRole('radio')[3];
    await userEvent.click(fourStarRating);
    
    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await userEvent.click(submitButton);
    
    // Check that onSubmit was not called
    expect(mockOnSubmit).not.toHaveBeenCalled();
    
    // Check for validation message
    expect(screen.getByText('Please provide feedback')).toBeInTheDocument();
  });
  
  it('calls onClose when Cancel button is clicked', async () => {
    render(<FeedbackForm onSubmit={mockOnSubmit} onClose={mockOnClose} />);
    
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    await userEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  it('resets the form after successful submission', async () => {
    render(<FeedbackForm onSubmit={mockOnSubmit} onClose={mockOnClose} />);
    
    // Fill and submit the form
    const feedbackInput = screen.getByLabelText('Feedback');
    await userEvent.type(feedbackInput, 'This is a test feedback');
    
    const fourStarRating = screen.getAllByRole('radio')[3];
    await userEvent.click(fourStarRating);
    
    const submitButton = screen.getByRole('button', { name: 'Submit' });
    await userEvent.click(submitButton);
    
    // Check if form was reset
    await waitFor(() => {
      expect(feedbackInput).toHaveValue('');
      // Note: Testing the reset of radio buttons might be tricky as it depends on implementation
      // We could check if none of the stars are checked, but this depends on how the component works
    });
  });
});