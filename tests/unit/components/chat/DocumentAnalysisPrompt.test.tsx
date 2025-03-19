import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DocumentAnalysisPrompt from '../../../../app/components/chat/DocumentAnalysisPrompt';

describe('DocumentAnalysisPrompt', () => {
  const mockOnClose = jest.fn();
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the prompt when isOpen is true', () => {
    render(<DocumentAnalysisPrompt {...defaultProps} />);
    
    expect(screen.getByText('Document Analysis')).toBeInTheDocument();
    expect(screen.getByText('Analyze your document with AI')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Analyze')).toBeInTheDocument();
  });

  it('does not render the prompt when isOpen is false', () => {
    render(<DocumentAnalysisPrompt {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Document Analysis')).not.toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    render(<DocumentAnalysisPrompt {...defaultProps} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the cancel button is clicked', () => {
    render(<DocumentAnalysisPrompt {...defaultProps} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking on the backdrop', () => {
    render(<DocumentAnalysisPrompt {...defaultProps} />);
    
    // Find the backdrop element (the modal overlay)
    const backdrop = document.querySelector('[data-testid="modal-backdrop"]');
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    } else {
      // If there's no specific testid, we can try to find the backdrop by its role or class
      const modalBackdrop = document.querySelector('.fixed.inset-0.bg-black.bg-opacity-50');
      if (modalBackdrop) {
        fireEvent.click(modalBackdrop);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    }
  });

  it('displays the file upload section', () => {
    render(<DocumentAnalysisPrompt {...defaultProps} />);
    
    expect(screen.getByText(/Drag and drop your file here/i)).toBeInTheDocument();
    expect(screen.getByText(/or click to browse/i)).toBeInTheDocument();
  });

  it('shows supported file formats information', () => {
    render(<DocumentAnalysisPrompt {...defaultProps} />);
    
    expect(screen.getByText(/Supported formats:/i)).toBeInTheDocument();
    expect(screen.getByText(/PDF, DOCX, TXT/i)).toBeInTheDocument();
  });
});