import { useState, useCallback } from 'react';
import { MessageType } from '../components/chat/ChatInterface';
import { TicketStep, TicketDetails } from '../types';
import { createTicketApi } from '../api/advancedApi';

/**
 * Custom hook to manage the ticket system functionality
 * @returns Object containing ticket state and functions
 */
const useTicketSystem = () => {
  // State for controlling ticket form visibility
  const [showTicketForm, setShowTicketForm] = useState<boolean>(false);

  // State for storing ticket details
  const [ticketDetails, setTicketDetails] = useState<TicketDetails>({
    title: '',
    description: '',
    priority: 'medium',
    category: 'general',
  });

  // State for tracking the current step in the ticket creation process
  const [ticketStep, setTicketStep] = useState<TicketStep>(TicketStep.Title);

  /**
   * Opens the ticket form
   * @param context - Optional context to pre-populate the ticket title
   */
  const openTicketForm = useCallback((context?: string) => {
    setShowTicketForm(true);
    setTicketStep(TicketStep.Title);

    if (context) {
      setTicketDetails(prevDetails => ({
        ...prevDetails,
        title: context
      }));
    } else {
      setTicketDetails({
        title: '',
        description: '',
        priority: 'medium',
        category: 'general'
      });
    }
  }, []);

  /**
   * Closes the ticket form and resets states
   */
  const closeTicketForm = useCallback(() => {
    setShowTicketForm(false);
    setTicketStep(TicketStep.Title);
    setTicketDetails({
      title: '',
      description: '',
      priority: 'medium',
      category: 'general',
    });
  }, []);

  /**
   * Creates a new ticket and returns a message object
   * @returns Promise with the ticket message object
   */
  const createTicket = useCallback(async () => {
    try {
      // Call the API to create a ticket
      const response = await createTicketApi({
        subject: ticketDetails.title,
        description: ticketDetails.description,
        priority: ticketDetails.priority,
        category: ticketDetails.category
      });

      // Create the ticket message using the API response
      const ticketMessage: MessageType = {
        sender: 'bot',
        text: `Ticket created: ${response.subject}`,
        timestamp: response.createdAt,
        ticket: {
          id: response.ticketId,
          status: response.status,
        },
      };

      // Move to the submitted step
      setTicketStep(TicketStep.Description);

      // Return the ticket message to be added to the chat
      return ticketMessage;
    } catch (error) {
      console.error('Error creating ticket:', error);

      // Return an error message if ticket creation fails
      return {
        sender: 'bot',
        text: 'Failed to create ticket. Please try again.',
        timestamp: new Date().toISOString(),
        isError: true,
      } as MessageType;
    }
  }, [ticketDetails]);

  return {
    showTicketForm,
    ticketDetails,
    ticketStep,
    setShowTicketForm,
    setTicketDetails,
    setTicketStep,
    openTicketForm,
    closeTicketForm,
    createTicket,
  };
};

export default useTicketSystem;
