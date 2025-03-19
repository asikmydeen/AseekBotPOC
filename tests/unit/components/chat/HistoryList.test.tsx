import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HistoryList from '../../../../app/components/chat/HistoryList';
import { useChatHistory } from '../../../../app/context/ChatHistoryContext';

// Mock the ChatHistoryContext
jest.mock('../../../../app/context/ChatHistoryContext', () => ({
  useChatHistory: jest.fn()
}));

describe('HistoryList Component', () => {
  // Mock functions for the ChatHistoryContext
  const mockLoadChat = jest.fn();
  const mockRemoveChat = jest.fn();
  const mockRenameChat = jest.fn();
  const mockTogglePin = jest.fn();

  // Mock chat history data
  const mockChatHistory = {
    activeChat: { id: '2', title: 'Chat 2', updatedAt: new Date('2023-01-02').toISOString() },
    pinnedChats: [
      { id: '1', title: 'Chat 1', updatedAt: new Date('2023-01-01').toISOString() }
    ],
    recentChats: [
      { id: '2', title: 'Chat 2', updatedAt: new Date('2023-01-02').toISOString() },
      { id: '3', title: 'Chat 3', updatedAt: new Date('2023-01-03').toISOString() }
    ],
    loadChat: mockLoadChat,
    removeChatFromHistory: mockRemoveChat,
    renameChatHistory: mockRenameChat,
    togglePinChat: mockTogglePin
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up the mock return value for useChatHistory
    (useChatHistory as jest.Mock).mockReturnValue(mockChatHistory);
  });

  test('renders history items correctly', () => {
    render(<HistoryList isDarkMode={false} />);

    // Check if all history items are rendered
    expect(screen.getByText('Chat 1')).toBeInTheDocument();
    expect(screen.getByText('Chat 2')).toBeInTheDocument();
    expect(screen.getByText('Chat 3')).toBeInTheDocument();
  });

  test('renders empty state when no history items are provided', () => {
    // Mock empty chat history
    (useChatHistory as jest.Mock).mockReturnValueOnce({
      ...mockChatHistory,
      pinnedChats: [],
      recentChats: []
    });

    render(<HistoryList isDarkMode={false} />);

    // Check if empty state message is displayed
    expect(screen.getByText(/no chat history/i)).toBeInTheDocument();
  });

  test('calls loadChat with correct chat id when clicked', () => {
    render(<HistoryList isDarkMode={false} />);

    // Click on the third history item (Chat 3)
    fireEvent.click(screen.getByText('Chat 3'));

    // Check if loadChat was called with the correct chat id
    expect(mockLoadChat).toHaveBeenCalledTimes(1);
    expect(mockLoadChat).toHaveBeenCalledWith('3');
  });

  test('highlights the active chat item', () => {
    render(<HistoryList isDarkMode={false} />);

    // Find the active chat element (Chat 2)
    const activeChat = screen.getByText('Chat 2').closest('div[role="button"]');

    // Check if the active chat has the appropriate styling
    // Note: The exact class name may need to be adjusted based on the actual implementation
    expect(activeChat).toHaveClass('active');
  });

  test('renders formatted timestamps correctly', () => {
    render(<HistoryList isDarkMode={false} />);

    // Format dates as they would appear in the component
    const date1 = new Date('2023-01-01').toLocaleDateString();
    const date2 = new Date('2023-01-02').toLocaleDateString();
    const date3 = new Date('2023-01-03').toLocaleDateString();

    // Check if timestamps are rendered correctly
    const dateElements = screen.getAllByText(
      (content) => [date1, date2, date3].some(date => content.includes(date))
    );
    expect(dateElements.length).toBeGreaterThan(0);
  });
});
