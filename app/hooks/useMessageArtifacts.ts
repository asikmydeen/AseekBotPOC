// app/hooks/useMessageArtifacts.ts
import { useEffect, useCallback, useRef } from 'react';
import { useArtifacts } from '../context/ArtifactContext';
import { MessageType } from '../types/shared';

/**
 * Hook for automatically extracting artifacts from bot messages
 */
export function useMessageArtifacts() {
  const { parseArtifactsFromMessage, artifacts } = useArtifacts();
  const processedMessagesRef = useRef<Set<string>>(new Set());

  // Process a single message to extract artifacts
  const processMessage = useCallback((message: MessageType) => {
    // Only process bot messages
    if (message.sender !== 'bot') return;

    // Skip if we've already processed this message
    const messageId = message.id || `${message.sender}-${message.timestamp}`;
    if (processedMessagesRef.current.has(messageId)) {
      return;
    }

    // Mark this message as processed
    processedMessagesRef.current.add(messageId);

    // Use the message text for parsing
    if (message.text) {
      parseArtifactsFromMessage(message.text);
    }
  }, [parseArtifactsFromMessage]);

  // Process an array of messages
  const processMessages = useCallback((messages: MessageType[]) => {
    // Get only new messages that we haven't processed yet
    const newMessages = messages.filter(message => {
      const messageId = message.id || `${message.sender}-${message.timestamp}`;
      return !processedMessagesRef.current.has(messageId);
    });

    // Process each new message
    newMessages.forEach(processMessage);
  }, [processMessage]);

  // Process messages when they arrive in real-time
  const processIncomingMessage = useCallback((message: MessageType) => {
    processMessage(message);
  }, [processMessage]);

  // Clean up function to reset processed messages when dependencies change
  useEffect(() => {
    return () => {
      processedMessagesRef.current.clear();
    };
  }, [parseArtifactsFromMessage]);

  return {
    artifacts,
    processMessage,
    processMessages,
    processIncomingMessage
  };
}

export default useMessageArtifacts;