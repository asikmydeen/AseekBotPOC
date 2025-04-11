// app/components/chat/ChatHeader.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import UserThumbnail from '../UserThumbnail';
import {
  MdDarkMode,
  MdLightMode,
  MdSearch,
  MdDownload,
  MdFeedback,
  MdAdd,
  MdOutlineMoreVert,
  MdCode
} from 'react-icons/md';
import { FiHelpCircle, FiCode } from 'react-icons/fi';
import { TicketIcon } from '@heroicons/react/24/outline';
import { useChatHistory } from '../../hooks/useChatHistory';
import { getCurrentUserId } from '../../store/userStore';
import { getChatHeaderStyles } from '../../styles/chatStyles';

interface ChatHeaderProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  exportChat?: () => void;
  setShowFeedbackForm?: () => void;
  setShowTicketForm?: () => void;
  // New props for artifact panel
  artifactsCount?: number;
  onToggleArtifacts?: () => void;
  isArtifactPanelOpen?: boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  isDarkMode,
  toggleTheme,
  searchQuery,
  setSearchQuery,
  exportChat,
  setShowFeedbackForm,
  setShowTicketForm,
  // New props with defaults
  artifactsCount = 0,
  onToggleArtifacts = () => { },
  isArtifactPanelOpen = false
}) => {
  const { createChat, activeChat } = useChatHistory();

  // Get centralized styles
  const styles = getChatHeaderStyles(isDarkMode);

  return (
    <header className={styles.container}>
      {/* Logo/Title and Chat Info */}
      <div className={styles.logoSection}>
        <h1 className={styles.title}>
          AseekBot
        </h1>
        {activeChat && (
          <span className={styles.chatTitle}>
            {activeChat.title}
          </span>
        )}
      </div>

      {/* Search Bar */}
      <div className={styles.searchBar.container}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MdSearch className={styles.searchBar.icon} />
        </div>
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchBar.input}
        />
      </div>

      {/* Action Buttons */}
      <div className={styles.actionsContainer + " space-x-1 sm:space-x-2 md:space-x-3"}>
        {/* Artifacts Button - New */}
        {artifactsCount > 0 && (
          <button
            onClick={onToggleArtifacts}
            className={`${styles.actionButton} flex items-center ${isArtifactPanelOpen
                ? isDarkMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-500 text-white'
                : ''
              } relative`}
            aria-label="Toggle artifacts panel"
          >
            <FiCode className="h-4 w-4 sm:h-5 sm:w-5" />
            {/* Notification badge */}
            <span className={`absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-xs rounded-full ${isDarkMode ? 'bg-blue-500 text-white' : 'bg-blue-600 text-white'
              }`}>
              {artifactsCount}
            </span>
          </button>
        )}

        {/* New Chat Button */}
        <button
          onClick={createChat}
          className={`${styles.actionButton} flex items-center`}
          aria-label="Start new chat"
        >
          <MdAdd className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
          <span className="hidden sm:inline">New Chat</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={styles.actionButton}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <MdLightMode className="h-4 w-4 sm:h-5 sm:w-5" /> : <MdDarkMode className="h-4 w-4 sm:h-5 sm:w-5" />}
        </button>

        {/* Help Button */}
        <Link
          href="/userguide"
          className={styles.actionButton}
          aria-label="User Guide"
        >
          <FiHelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
        </Link>

        {/* Export Chat */}
        {exportChat && (
          <button
            onClick={exportChat}
            className={styles.actionButton}
            aria-label="Export conversation"
          >
            <MdDownload className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        )}

        {/* Feedback */}
        {setShowFeedbackForm && (
          <button
            onClick={setShowFeedbackForm}
            className={styles.actionButton}
            aria-label="Provide feedback"
          >
            <MdFeedback className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        )}

        {/* Ticket */}
        {setShowTicketForm && (
          <button
            onClick={setShowTicketForm}
            className={styles.actionButton}
            aria-label="Create a ticket"
          >
            <TicketIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        )}

        {/* Mobile Search Button */}
        <button
          className={`${styles.actionButton} sm:hidden`}
          aria-label="Search"
        >
          <MdSearch className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* User Profile */}
        <Link href="/profile" aria-label="Go to profile" className={styles.userSection}>
          <UserThumbnail userId={getCurrentUserId()} size={16} className="sm:w-5 sm:h-5" />
        </Link>
      </div>
    </header>
  );
};

export default ChatHeader;