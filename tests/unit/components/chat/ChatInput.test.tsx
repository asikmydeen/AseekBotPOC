import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatInput from '../../../../app/components/chat/ChatInput';

describe('ChatInput', () => {
  const mockOnSubmit = jest.fn();
  const mockOnInputChange = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    render(
      <ChatInput 
        value="" 
        onSubmit={mockOnSubmit} 
        onInputChange={mockOnInputChange} 
        isDisabled={false}
      />
    );
    
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('calls onInputChange when typing', async () => {
    const user = userEvent.setup();
    
    render(
      <ChatInput 
        value="" 
        onSubmit={mockOnSubmit} 
        onInputChange={mockOnInputChange} 
        isDisabled={false}
      />
    );
    
    const input = screen.getByPlaceholderText('Type a message...');
    await user.type(input, 'Hello');
    
    expect(mockOnInputChange).toHaveBeenCalledTimes(5); // Once for each character
    expect(mockOnInputChange).toHaveBeenLastCalledWith('Hello');
  });

  it('calls onSubmit when pressing Enter', async () => {
    const user = userEvent.setup();
    
    render(
      <ChatInput 
        value="Hello" 
        onSubmit={mockOnSubmit} 
        onInputChange={mockOnInputChange} 
        isDisabled={false}
      />
    );
    
    const input = screen.getByPlaceholderText('Type a message...');
    await user.type(input, '{enter}');
    
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });

  it('calls onSubmit when clicking the send button', async () => {
    const user = userEvent.setup();
    
    render(
      <ChatInput 
        value="Hello" 
        onSubmit={mockOnSubmit} 
        onInputChange={mockOnInputChange} 
        isDisabled={false}
      />
    );
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);
    
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
  });

  it('does not call onSubmit when input is empty', async () => {
    const user = userEvent.setup();
    
    render(
      <ChatInput 
        value="" 
        onSubmit={mockOnSubmit} 
        onInputChange={mockOnInputChange} 
        isDisabled={false}
      />
    );
    
    const input = screen.getByPlaceholderText('Type a message...');
    await user.type(input, '{enter}');
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('disables input and button when isDisabled is true', () => {
    render(
      <ChatInput 
        value="" 
        onSubmit={mockOnSubmit} 
        onInputChange={mockOnInputChange} 
        isDisabled={true}
      />
    );
    
    const input = screen.getByPlaceholderText('Type a message...');
    const sendButton = screen.getByRole('button', { name: /send/i });
    
    expect(input).toBeDisabled();
    expect(sendButton).toBeDisabled();
  });

  it('does not call onSubmit when disabled', async () => {
    const user = userEvent.setup();
    
    render(
      <ChatInput 
        value="Hello" 
        onSubmit={mockOnSubmit} 
        onInputChange={mockOnInputChange} 
        isDisabled={true}
      />
    );
    
    const sendButton = screen.getByRole('button', { name: /send/i });
    await user.click(sendButton);
    
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });
});