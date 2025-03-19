import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TypingIndicator } from '../../../app/components/chat/MessageList';
import { ThemeProvider } from 'next-themes';

describe('TypingIndicator', () => {
  const renderWithTheme = (isDarkMode = false) => {
    return render(
      <ThemeProvider forcedTheme={isDarkMode ? 'dark' : 'light'} attribute="class">
        <TypingIndicator />
      </ThemeProvider>
    );
  };

  it('renders correctly in light mode', () => {
    renderWithTheme(false);
    
    // Check if the component renders
    const typingIndicator = screen.getByTestId('typing-indicator');
    expect(typingIndicator).toBeInTheDocument();
    
    // Check for the presence of the animated dots
    const dots = screen.getAllByTestId('typing-dot');
    expect(dots.length).toBe(3); // Assuming there are 3 dots in the animation
    
    // Check if the container has the light mode styling
    expect(typingIndicator).toHaveClass('bg-gray-200');
    expect(typingIndicator).not.toHaveClass('bg-gray-700');
  });

  it('renders correctly in dark mode', () => {
    renderWithTheme(true);
    
    // Check if the component renders
    const typingIndicator = screen.getByTestId('typing-indicator');
    expect(typingIndicator).toBeInTheDocument();
    
    // Check for the presence of the animated dots
    const dots = screen.getAllByTestId('typing-dot');
    expect(dots.length).toBe(3); // Assuming there are 3 dots in the animation
    
    // Check if the container has the dark mode styling
    expect(typingIndicator).toHaveClass('bg-gray-700');
    expect(typingIndicator).not.toHaveClass('bg-gray-200');
  });

  it('has animated dots with proper styling', () => {
    renderWithTheme();
    
    const dots = screen.getAllByTestId('typing-dot');
    
    // Check if each dot has the base styling
    dots.forEach(dot => {
      expect(dot).toHaveClass('animate-bounce');
      expect(dot).toHaveClass('bg-gray-500');
    });
    
    // Check if dots have different animation delays
    expect(dots[0]).toHaveStyle('animation-delay: 0ms');
    expect(dots[1]).toHaveStyle('animation-delay: 150ms');
    expect(dots[2]).toHaveStyle('animation-delay: 300ms');
  });
});