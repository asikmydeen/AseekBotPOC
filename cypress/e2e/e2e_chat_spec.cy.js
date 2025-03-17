/// <reference types="cypress" />

describe('AseekBot Chat Interface E2E Tests', () => {
  beforeEach(() => {
    // Visit the home page before each test
    cy.visit('/');
    
    // Intercept API calls to mock responses
    cy.intercept('POST', '/api/chat', (req) => {
      // Mock the bot response based on the request
      const messageContent = req.body.message;
      
      if (messageContent.includes('ticket')) {
        // Trigger ticket creation flow
        req.reply({
          statusCode: 200,
          body: {
            message: 'I can help you create a ticket. Please provide more details.',
            suggestedActions: [
              { label: 'Create Ticket', action: 'CREATE_TICKET' }
            ]
          }
        });
      } else if (messageContent.includes('file')) {
        // Response for file-related queries
        req.reply({
          statusCode: 200,
          body: {
            message: 'I can help you with files. Would you like to upload one?'
          }
        });
      } else {
        // Default response
        req.reply({
          statusCode: 200,
          body: {
            message: `I received your message: "${messageContent}". How can I assist you further?`
          }
        });
      }
    }).as('chatApiCall');

    // Intercept file upload API calls
    cy.intercept('POST', '/api/upload', {
      statusCode: 200,
      body: {
        success: true,
        fileId: 'mock-file-id-123',
        fileName: 'test-file.pdf'
      }
    }).as('fileUpload');

    // Intercept ticket creation API calls
    cy.intercept('POST', '/api/tickets', {
      statusCode: 200,
      body: {
        success: true,
        ticketId: 'TKT-12345',
        message: 'Ticket created successfully'
      }
    }).as('ticketCreation');
  });

  it('should load the chat interface correctly', () => {
    // Verify that the main chat components are visible
    cy.get('[data-testid="chat-container"]').should('be.visible');
    cy.get('[data-testid="chat-input"]').should('be.visible');
    cy.get('[data-testid="send-button"]').should('be.visible');
    
    // Verify welcome message is displayed
    cy.get('[data-testid="message-list"]').should('contain.text', 'Welcome to AseekBot');
    
    // Verify quick links section is present
    cy.get('[data-testid="quick-links"]').should('be.visible');
  });

  it('should send a message and receive a response', () => {
    // Type a message in the chat input
    const userMessage = 'Hello, I need some help';
    cy.get('[data-testid="chat-input"]').type(userMessage);
    
    // Click the send button
    cy.get('[data-testid="send-button"]').click();
    
    // Verify the user message appears in the chat
    cy.get('[data-testid="user-message"]').last().should('contain.text', userMessage);
    
    // Verify typing indicator appears
    cy.get('[data-testid="typing-indicator"]').should('be.visible');
    
    // Wait for the API response
    cy.wait('@chatApiCall');
    
    // Verify bot response appears
    cy.get('[data-testid="bot-message"]').last().should('contain.text', 'I received your message');
    
    // Verify typing indicator disappears
    cy.get('[data-testid="typing-indicator"]').should('not.exist');
  });

  it('should handle file uploads correctly', () => {
    // Create a test file
    cy.fixture('test-file.pdf', 'base64').then(fileContent => {
      // Convert the base64 string to a Blob
      const blob = Cypress.Blob.base64StringToBlob(fileContent, 'application/pdf');
      const testFile = new File([blob], 'test-file.pdf', { type: 'application/pdf' });
      
      // Create a DataTransfer object and add the file
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(testFile);
      
      // Trigger file drop on the chat container
      cy.get('[data-testid="chat-container"]').trigger('drop', {
        dataTransfer
      });
      
      // Verify file upload progress bar appears
      cy.get('[data-testid="progress-bar"]').should('be.visible');
      
      // Wait for the upload API call
      cy.wait('@fileUpload');
      
      // Verify file upload message appears in chat
      cy.get('[data-testid="file-message"]').should('contain.text', 'test-file.pdf');
      
      // Verify progress bar completes and disappears
      cy.get('[data-testid="progress-bar"]').should('not.exist');
      
      // Verify bot response to file upload
      cy.get('[data-testid="bot-message"]').last().should('contain.text', 'I can help you with files');
    });
  });

  it('should open and interact with multimedia modal', () => {
    // Upload a file first
    cy.fixture('test-image.jpg', 'base64').then(fileContent => {
      const blob = Cypress.Blob.base64StringToBlob(fileContent, 'image/jpeg');
      const testFile = new File([blob], 'test-image.jpg', { type: 'image/jpeg' });
      
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(testFile);
      
      cy.get('[data-testid="chat-container"]').trigger('drop', {
        dataTransfer
      });
      
      cy.wait('@fileUpload');
      
      // Click on the uploaded image to open the multimedia modal
      cy.get('[data-testid="file-message"]').click();
      
      // Verify modal opens
      cy.get('[data-testid="multimedia-modal"]').should('be.visible');
      
      // Verify image is displayed in the modal
      cy.get('[data-testid="modal-content"] img').should('be.visible');
      
      // Close the modal
      cy.get('[data-testid="modal-close-button"]').click();
      
      // Verify modal is closed
      cy.get('[data-testid="multimedia-modal"]').should('not.exist');
    });
  });

  it('should trigger and complete the ticket creation flow', () => {
    // Send a message that will trigger the ticket suggestion
    cy.get('[data-testid="chat-input"]').type('I need to create a ticket for an issue');
    cy.get('[data-testid="send-button"]').click();
    
    // Wait for the API response
    cy.wait('@chatApiCall');
    
    // Verify suggested action for ticket creation appears
    cy.get('[data-testid="suggested-action"]').contains('Create Ticket').should('be.visible');
    
    // Click on the suggested action
    cy.get('[data-testid="suggested-action"]').contains('Create Ticket').click();
    
    // Verify ticket form appears
    cy.get('[data-testid="ticket-form"]').should('be.visible');
    
    // Fill out the ticket form
    cy.get('[data-testid="ticket-subject"]').type('Test Ticket Subject');
    cy.get('[data-testid="ticket-description"]').type('This is a test ticket description');
    cy.get('[data-testid="ticket-priority"]').select('High');
    
    // Submit the ticket form
    cy.get('[data-testid="submit-ticket"]').click();
    
    // Wait for ticket creation API call
    cy.wait('@ticketCreation');
    
    // Verify success message
    cy.get('[data-testid="ticket-success-message"]').should('contain.text', 'TKT-12345');
    
    // Verify ticket form is no longer visible
    cy.get('[data-testid="ticket-form"]').should('not.exist');
    
    // Verify the ticket creation confirmation appears in chat
    cy.get('[data-testid="bot-message"]').last().should('contain.text', 'Ticket created successfully');
  });

  it('should show typing indicator when bot is responding', () => {
    // Intercept API call with delay to simulate typing
    cy.intercept('POST', '/api/chat', (req) => {
      // Add a delay to simulate typing
      setTimeout(() => {
        req.reply({
          statusCode: 200,
          body: {
            message: 'This is a delayed response to test typing indicator'
          }
        });
      }, 2000);
    }).as('delayedChatApiCall');
    
    // Send a message
    cy.get('[data-testid="chat-input"]').type('Test typing indicator');
    cy.get('[data-testid="send-button"]').click();
    
    // Verify typing indicator appears
    cy.get('[data-testid="typing-indicator"]').should('be.visible');
    
    // Wait for the delayed API response
    cy.wait('@delayedChatApiCall');
    
    // Verify typing indicator disappears after response
    cy.get('[data-testid="typing-indicator"]').should('not.exist');
    
    // Verify bot response appears
    cy.get('[data-testid="bot-message"]').last().should('contain.text', 'This is a delayed response');
  });

  it('should use quick links to send predefined messages', () => {
    // Find and click a quick link
    cy.get('[data-testid="quick-links"] button').first().click();
    
    // Verify the quick link text is sent as a message
    cy.get('[data-testid="user-message"]').last().should('contain.text');
    
    // Wait for the API response
    cy.wait('@chatApiCall');
    
    // Verify bot response appears
    cy.get('[data-testid="bot-message"]').last().should('be.visible');
  });
});