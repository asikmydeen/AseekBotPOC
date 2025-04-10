'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  messageAnimationVariants,
  darkMessageAnimationVariants,
  buttonAnimationVariants,
  getMessageStyles
} from '../../styles/messageStyles';

// Import sub-components
import MessageAvatar from './MessageAvatar';
import MessageContent from './MessageContent';
import MessageAttachments from './MessageAttachments';
import MessageActions from './MessageActions';
import ImageDialog from './ImageDialog';

// Import types
import { MessageType, MultimediaData } from '../../types/shared';

interface MessageProps {
  message: MessageType;
  onMultimediaClick?: (multimedia: MultimediaData) => void;
  onReact?: (messageId: string, reaction: boolean) => void;
  onPin?: (messageId: string, isPinned: boolean) => void;
  isDarkMode: boolean;
  showCitations?: boolean;
  id?: string;
}

function Message({
  message,
  onMultimediaClick,
  onReact,
  onPin,
  isDarkMode,
  showCitations = false,
  id
}: MessageProps) {
  // State
  const [displayedText, setDisplayedText] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [showCitationPanel, setShowCitationPanel] = useState<boolean>(showCitations);
  const [imageDialogOpen, setImageDialogOpen] = useState<boolean>(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  // Get all styles for the message component
  const styles = getMessageStyles(isDarkMode, message.sender);

  // Helper function to get message content with improved priority and logging
  const getMessageContent = useCallback((): string => {
    // Prioritize completion field if available, then fall back to other fields
    const content = message.completion || message.formattedMessage || message.text || message.message || "";
    // Log content for debugging if it's empty or very short
    if (!content || content.length < 5) {
      console.log('Message content issue:', {
        hasCompletion: !!message.completion,
        hasFormattedMessage: !!message.formattedMessage,
        hasText: !!message.text,
        hasMessage: !!message.message,
        contentLength: content.length,
        messageId: message.id
      });
    }
    return content;
  }, [message.completion, message.formattedMessage, message.text, message.message, message.id]);

  // Process message content when it changes
  useEffect(() => {
    // Get message content regardless of sender
    const messageContent = getMessageContent();

    // Handle empty content case
    if (!messageContent) {
      const errorMessage = message.sender === 'bot'
        ? "Error: No message content available."
        : "";
      setDisplayedText(errorMessage);
      setIsTyping(false);
      return;
    }

    // Set displayed text immediately for both user and bot
    setDisplayedText(messageContent);
    setIsTyping(false);
  }, [message.text, message.message, message.formattedMessage, message.completion, message.sender, getMessageContent]);

  // Handle image click
  const handleImageClick = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setImageDialogOpen(true);
  };

  // Handle image dialog confirmation
  const handleImageConfirm = () => {
    // Open the image in a new tab
    if (selectedImageUrl) {
      window.open(selectedImageUrl, '_blank');
    }
    setImageDialogOpen(false);
  };

  // Handle file download
  const handleFileDownload = (fileUrl: string, fileName: string) => {
    // Create a temporary anchor element
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Handle reaction
  const handleReaction = (reaction: boolean) => {
    if (onReact) {
      onReact(message.id ?? '', reaction);
    }
  };

  // Handle pin
  const handlePin = () => {
    if (onPin) {
      onPin(message.id ?? '', !message.pinned);
    }
  };

  // Toggle citations panel
  const toggleCitationPanel = () => {
    setShowCitationPanel(!showCitationPanel);
  };

  return (
    <div id={id} className={styles.wrapper}>
      <div className={styles.flexContainer}>
        {/* Avatar */}
        <MessageAvatar
          sender={message.sender}
          isDarkMode={isDarkMode}
          styles={styles}
        />

        {/* Message Content */}
        <motion.div
          variants={isDarkMode ? darkMessageAnimationVariants : messageAnimationVariants}
          initial="initial"
          animate="animate"
          whileHover="hover"
          className={styles.container.relative}
          style={styles.container.backgroundColor}
        >
          {/* Message Text Content */}
          <MessageContent
            content={displayedText}
            isTyping={isTyping}
            isDarkMode={isDarkMode}
            styles={styles}
            onImageClick={handleImageClick}
          />

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <MessageAttachments
              attachments={message.attachments?.map(file => ({
                id: file.url,  // Using url as id since it's unique
                name: file.name,
                size: file.size,
                type: file.type,
                url: file.url
              }))}
              isDarkMode={isDarkMode}
              styles={styles}
              onDownload={handleFileDownload}
              onView={(url) => window.open(url, '_blank')}
            />
          )}

          {/* Multimedia Button */}
          {message.multimedia && onMultimediaClick && (
            <motion.button
              variants={buttonAnimationVariants}
              initial="idle"
              whileHover="hover"
              whileTap="tap"
              onClick={() => onMultimediaClick(message.multimedia!)}
              className={styles.multimedia.button}
              aria-label={`View ${message.multimedia.type}`}
            >
              <span className={styles.multimedia.icon}>
                View {message.multimedia.type.charAt(0).toUpperCase() + message.multimedia.type.slice(1)}
              </span>
            </motion.button>
          )}

          {/* Message Actions */}
          {message.sender === 'bot' && (
            <MessageActions
              reaction={message.reaction === 'thumbs-up' ? true : message.reaction === 'thumbs-down' ? false : null}
              isPinned={!!message.pinned}
              showCitations={showCitationPanel}
              onReact={handleReaction}
              onPin={handlePin}
              onToggleCitations={toggleCitationPanel}
              isDarkMode={isDarkMode}
              styles={styles}
              buttonVariants={buttonAnimationVariants}
            />
          )}
        </motion.div>
      </div>

      {/* Image Dialog */}
      <ImageDialog
        isOpen={imageDialogOpen}
        imageUrl={selectedImageUrl}
        onClose={() => setImageDialogOpen(false)}
        onConfirm={handleImageConfirm}
        isDarkMode={isDarkMode}
        styles={styles}
      />
    </div>
  );
}

export default Message;
