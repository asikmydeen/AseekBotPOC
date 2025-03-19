import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import SuggestionChips from '../../../../app/components/chat/SuggestionChips';

describe('SuggestionChips Component', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });

  it('renders suggestion chips correctly', () => {
    const suggestions = ['Suggestion 1', 'Suggestion 2', 'Suggestion 3'];
    const onSuggestionClick = jest.fn();

    render(
      <SuggestionChips 
        suggestions={suggestions} 
        onSuggestionClick={onSuggestionClick} 
      />
    );

    // Check if all suggestions are rendered
    suggestions.forEach(suggestion => {
      expect(screen.getByText(suggestion)).toBeInTheDocument();
    });
  });

  it('calls onSuggestionClick when a chip is clicked', () => {
    const suggestions = ['Suggestion 1', 'Suggestion 2', 'Suggestion 3'];
    const onSuggestionClick = jest.fn();

    render(
      <SuggestionChips 
        suggestions={suggestions} 
        onSuggestionClick={onSuggestionClick} 
      />
    );

    // Click on the first suggestion
    fireEvent.click(screen.getByText('Suggestion 1'));
    expect(onSuggestionClick).toHaveBeenCalledWith('Suggestion 1');

    // Click on the second suggestion
    fireEvent.click(screen.getByText('Suggestion 2'));
    expect(onSuggestionClick).toHaveBeenCalledWith('Suggestion 2');

    // Verify the callback was called exactly twice
    expect(onSuggestionClick).toHaveBeenCalledTimes(2);
  });

  it('does not render anything when suggestions array is empty', () => {
    const onSuggestionClick = jest.fn();

    const { container } = render(
      <SuggestionChips 
        suggestions={[]} 
        onSuggestionClick={onSuggestionClick} 
      />
    );

    // Check if the component doesn't render any chips
    expect(container.firstChild).toBeNull();
  });

  it('renders chips with correct styling', () => {
    const suggestions = ['Suggestion 1'];
    const onSuggestionClick = jest.fn();

    render(
      <SuggestionChips 
        suggestions={suggestions} 
        onSuggestionClick={onSuggestionClick} 
      />
    );

    // Get the chip element
    const chipElement = screen.getByText('Suggestion 1').closest('div');
    
    // Check if the chip has the expected classes for styling
    expect(chipElement).toHaveClass('cursor-pointer');
    expect(chipElement).toHaveClass('rounded-full');
  });
});