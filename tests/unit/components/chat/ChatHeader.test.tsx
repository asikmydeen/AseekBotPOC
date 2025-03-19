import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChatHeader from '../../../../app/components/chat/ChatHeader';

// Mock the useTheme hook
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: jest.fn(),
  }),
}));

// Mock the useChat hook
jest.mock('../../../../app/hooks/useChat', () => ({
  __esModule: true,
  default: () => ({
    searchTerm: '',
    setSearchTerm: jest.fn(),
    exportChat: jest.fn(),
    clearChat: jest.fn(),
  }),
}));

describe('ChatHeader Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with all expected elements', () => {
    render(<ChatHeader />);
    
    // Check for the search input
    expect(screen.getByPlaceholderText('Search messages...')).toBeInTheDocument();
    
    // Check for the theme toggle button
    expect(screen.getByLabelText('Toggle theme')).toBeInTheDocument();
    
    // Check for the export chat button
    expect(screen.getByLabelText('Export chat')).toBeInTheDocument();
    
    // Check for the clear chat button
    expect(screen.getByLabelText('Clear chat')).toBeInTheDocument();
  });

  it('handles search input changes', () => {
    const useChat = require('../../../../app/hooks/useChat').default;
    const mockSetSearchTerm = jest.fn();
    
    // Override the mock implementation for this test
    useChat.mockImplementation(() => ({
      searchTerm: '',
      setSearchTerm: mockSetSearchTerm,
      exportChat: jest.fn(),
      clearChat: jest.fn(),
    }));

    render(<ChatHeader />);
    
    const searchInput = screen.getByPlaceholderText('Search messages...');
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    
    expect(mockSetSearchTerm).toHaveBeenCalledWith('test query');
  });

  it('calls exportChat when export button is clicked', () => {
    const useChat = require('../../../../app/hooks/useChat').default;
    const mockExportChat = jest.fn();
    
    // Override the mock implementation for this test
    useChat.mockImplementation(() => ({
      searchTerm: '',
      setSearchTerm: jest.fn(),
      exportChat: mockExportChat,
      clearChat: jest.fn(),
    }));

    render(<ChatHeader />);
    
    const exportButton = screen.getByLabelText('Export chat');
    fireEvent.click(exportButton);
    
    expect(mockExportChat).toHaveBeenCalled();
  });

  it('calls clearChat when clear button is clicked', () => {
    const useChat = require('../../../../app/hooks/useChat').default;
    const mockClearChat = jest.fn();
    
    // Override the mock implementation for this test
    useChat.mockImplementation(() => ({
      searchTerm: '',
      setSearchTerm: jest.fn(),
      exportChat: jest.fn(),
      clearChat: mockClearChat,
    }));

    render(<ChatHeader />);
    
    const clearButton = screen.getByLabelText('Clear chat');
    fireEvent.click(clearButton);
    
    expect(mockClearChat).toHaveBeenCalled();
  });

  it('toggles theme when theme button is clicked', () => {
    const nextThemes = require('next-themes');
    const mockSetTheme = jest.fn();
    
    // Override the mock implementation for this test
    nextThemes.useTheme.mockImplementation(() => ({
      theme: 'light',
      setTheme: mockSetTheme,
    }));

    render(<ChatHeader />);
    
    const themeButton = screen.getByLabelText('Toggle theme');
    fireEvent.click(themeButton);
    
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
    
    // Change the mock to simulate dark theme
    nextThemes.useTheme.mockImplementation(() => ({
      theme: 'dark',
      setTheme: mockSetTheme,
    }));
    
    render(<ChatHeader />);
    
    const updatedThemeButton = screen.getByLabelText('Toggle theme');
    fireEvent.click(updatedThemeButton);
    
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });
});