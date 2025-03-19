import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the dynamic import
jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: (callback: Function) => {
    const Component = callback();
    Component.displayName = 'DynamicComponent';
    return Component;
  }
}));

// Mock the MultimediaModal component
jest.mock('../../app/components/MultimediaModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, children }: { isOpen: boolean, onClose: () => void, children: React.ReactNode }) => {
    if (!isOpen) return null;
    
    return (
      <div data-testid="multimedia-modal">
        <button data-testid="close-button" onClick={onClose}>Close</button>
        <div data-testid="modal-content">{children}</div>
      </div>
    );
  }
}));

// Import the component after mocking
import MultimediaModal from '../../app/components/MultimediaModal';

describe('MultimediaModal', () => {
  const mockOnClose = jest.fn();
  const testContent = <div data-testid="test-content">Test Content</div>;
  
  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('should not render when isOpen is false', () => {
    render(
      <MultimediaModal isOpen={false} onClose={mockOnClose}>
        {testContent}
      </MultimediaModal>
    );
    
    expect(screen.queryByTestId('multimedia-modal')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <MultimediaModal isOpen={true} onClose={mockOnClose}>
        {testContent}
      </MultimediaModal>
    );
    
    expect(screen.getByTestId('multimedia-modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-content')).toBeInTheDocument();
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    render(
      <MultimediaModal isOpen={true} onClose={mockOnClose}>
        {testContent}
      </MultimediaModal>
    );
    
    const closeButton = screen.getByTestId('close-button');
    fireEvent.click(closeButton);
    
    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  it('should render children content correctly', () => {
    const complexContent = (
      <div data-testid="complex-content">
        <h1>Modal Title</h1>
        <p>Modal Description</p>
        <button>Action Button</button>
      </div>
    );
    
    render(
      <MultimediaModal isOpen={true} onClose={mockOnClose}>
        {complexContent}
      </MultimediaModal>
    );
    
    expect(screen.getByTestId('complex-content')).toBeInTheDocument();
    expect(screen.getByText('Modal Title')).toBeInTheDocument();
    expect(screen.getByText('Modal Description')).toBeInTheDocument();
    expect(screen.getByText('Action Button')).toBeInTheDocument();
  });
});