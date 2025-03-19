import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorBoundary from '@/app/components/ErrorBoundary';

// Mock console.error to prevent test output pollution
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Component that throws an error when rendered
const ErrorThrowingComponent = ({ shouldThrow = true }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>Normal component rendering</div>;
};

describe('ErrorBoundary', () => {
  test('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Normal component rendering')).toBeInTheDocument();
  });

  test('renders fallback UI when an error occurs', () => {
    // We need to suppress the error boundary warning in the test environment
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );
    
    // Check if the fallback UI is displayed
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Try again/i })).toBeInTheDocument();
  });

  test('displays the error message', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );
    
    // Check if the error message is displayed
    expect(screen.getByText(/Test error/i)).toBeInTheDocument();
  });

  test('retry button resets the error boundary', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    
    const { rerender } = render(
      <ErrorBoundary>
        <ErrorThrowingComponent />
      </ErrorBoundary>
    );
    
    // Verify error UI is shown
    expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    
    // Click the retry button
    fireEvent.click(screen.getByRole('button', { name: /Try again/i }));
    
    // Rerender with a non-throwing component to simulate successful retry
    rerender(
      <ErrorBoundary>
        <ErrorThrowingComponent shouldThrow={false} />
      </ErrorBoundary>
    );
    
    // Verify the normal content is now displayed
    expect(screen.getByText('Normal component rendering')).toBeInTheDocument();
  });
});