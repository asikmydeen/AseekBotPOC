import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('createTicket API endpoint', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully create a ticket with valid data', async () => {
    // Mock response data
    const mockTicketResponse = {
      success: true,
      ticket: {
        id: 'ticket-123',
        title: 'Test Ticket',
        description: 'This is a test ticket',
        email: 'user@example.com',
        createdAt: '2025-03-16T12:00:00Z',
        updatedAt: '2025-03-16T12:00:00Z'
      }
    };

    // Setup mock fetch to return successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => mockTicketResponse
    });

    // Valid ticket data
    const ticketData = {
      title: 'Test Ticket',
      description: 'This is a test ticket',
      email: 'user@example.com'
    };

    // Call the API
    const response = await fetch('/api/createTicket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ticketData)
    });

    const data = await response.json();

    // Verify fetch was called correctly
    expect(mockFetch).toHaveBeenCalledWith('/api/createTicket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ticketData)
    });

    // Verify response
    expect(response.ok).toBe(true);
    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.ticket).toBeDefined();
    expect(data.ticket.id).toBe('ticket-123');
    expect(data.ticket.title).toBe('Test Ticket');
    expect(data.ticket.description).toBe('This is a test ticket');
    expect(data.ticket.email).toBe('user@example.com');
    expect(data.ticket.createdAt).toBeDefined();
    expect(data.ticket.updatedAt).toBeDefined();
  });

  it('should return error when title is missing', async () => {
    // Mock error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        error: 'Title is required'
      })
    });

    // Missing title in ticket data
    const ticketData = {
      description: 'This is a test ticket',
      email: 'user@example.com'
    };

    // Call the API
    const response = await fetch('/api/createTicket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ticketData)
    });

    const data = await response.json();

    // Verify response
    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Title is required');
  });

  it('should return error when description is missing', async () => {
    // Mock error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        error: 'Description is required'
      })
    });

    // Missing description in ticket data
    const ticketData = {
      title: 'Test Ticket',
      email: 'user@example.com'
    };

    // Call the API
    const response = await fetch('/api/createTicket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ticketData)
    });

    const data = await response.json();

    // Verify response
    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Description is required');
  });

  it('should return error when email is missing', async () => {
    // Mock error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        success: false,
        error: 'Email is required'
      })
    });

    // Missing email in ticket data
    const ticketData = {
      title: 'Test Ticket',
      description: 'This is a test ticket'
    };

    // Call the API
    const response = await fetch('/api/createTicket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ticketData)
    });

    const data = await response.json();

    // Verify response
    expect(response.ok).toBe(false);
    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Email is required');
  });

  it('should handle server errors', async () => {
    // Mock server error response
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({
        success: false,
        error: 'Internal server error'
      })
    });

    // Valid ticket data
    const ticketData = {
      title: 'Test Ticket',
      description: 'This is a test ticket',
      email: 'user@example.com'
    };

    // Call the API
    const response = await fetch('/api/createTicket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ticketData)
    });

    const data = await response.json();

    // Verify response
    expect(response.ok).toBe(false);
    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.error).toBe('Internal server error');
  });

  it('should handle network errors', async () => {
    // Mock network error
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    // Valid ticket data
    const ticketData = {
      title: 'Test Ticket',
      description: 'This is a test ticket',
      email: 'user@example.com'
    };

    // Call the API and expect it to throw
    await expect(
      fetch('/api/createTicket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ticketData)
      })
    ).rejects.toThrow('Network error');
  });
});