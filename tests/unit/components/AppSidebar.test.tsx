import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import AppSidebar from '@/app/components/AppSidebar';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn().mockReturnValue('/'),
  useRouter: jest.fn().mockReturnValue({
    push: jest.fn(),
  }),
}));

// Mock the ChatContext
jest.mock('@/app/context/ChatContext', () => ({
  useChatContext: jest.fn().mockReturnValue({
    conversations: [],
    setSelectedConversationId: jest.fn(),
  }),
}));

describe('AppSidebar Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('renders the sidebar correctly', () => {
    render(<AppSidebar />);
    
    // Check if the sidebar container is rendered
    const sidebarElement = screen.getByTestId('app-sidebar');
    expect(sidebarElement).toBeInTheDocument();
  });

  it('displays the branding/logo', () => {
    render(<AppSidebar />);
    
    // Check if the logo or branding text is displayed
    const brandingElement = screen.getByText(/AseekBot/i);
    expect(brandingElement).toBeInTheDocument();
  });

  it('displays navigation links', () => {
    render(<AppSidebar />);
    
    // Check if navigation links are displayed
    const chatLink = screen.getByText(/Chat/i);
    expect(chatLink).toBeInTheDocument();
    
    const settingsLink = screen.getByText(/Settings/i);
    expect(settingsLink).toBeInTheDocument();
  });

  it('highlights the active navigation item based on current path', () => {
    // Update the mock to return a specific path
    const usePathnameMock = require('next/navigation').usePathname;
    usePathnameMock.mockReturnValue('/chat');
    
    render(<AppSidebar />);
    
    // The Chat link should have the active class or styling
    const chatLink = screen.getByText(/Chat/i).closest('a');
    expect(chatLink).toHaveClass('active');
  });

  it('navigates when a navigation item is clicked', () => {
    render(<AppSidebar />);
    
    const router = require('next/navigation').useRouter();
    
    // Find and click the Settings link
    const settingsLink = screen.getByText(/Settings/i);
    fireEvent.click(settingsLink);
    
    // Verify that the router.push was called with the correct path
    expect(router.push).toHaveBeenCalledWith('/settings');
  });

  it('toggles mobile menu when hamburger icon is clicked', () => {
    render(<AppSidebar />);
    
    // Find the hamburger menu button (assuming it exists for mobile view)
    const menuButton = screen.getByLabelText(/toggle menu/i);
    
    // Initially the mobile menu should be closed
    const mobileMenu = screen.getByTestId('mobile-menu');
    expect(mobileMenu).not.toHaveClass('open');
    
    // Click the menu button
    fireEvent.click(menuButton);
    
    // Now the mobile menu should be open
    expect(mobileMenu).toHaveClass('open');
    
    // Click again to close
    fireEvent.click(menuButton);
    
    // Menu should be closed again
    expect(mobileMenu).not.toHaveClass('open');
  });
});