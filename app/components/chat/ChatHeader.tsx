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
import { CHAT_UI_TEXT } from '../../constants/chatConstants';

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
          {CHAT_UI_TEXT.CHAT_HEADER_TITLE}
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
          placeholder={CHAT_UI_TEXT.CHAT_HEADER_SEARCH_PLACEHOLDER}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchBar.input}
        />
      </div>

      {/* Action Buttons */}
      <div className={styles.actionsContainer}>
        {/* Artifacts Button - New */}
        {artifactsCount > 0 && (
          <button
            onClick={onToggleArtifacts}
            className={`${styles.actionButton} ${isArtifactPanelOpen ? styles.actionButtonActive : ''} relative`}
            aria-label={CHAT_UI_TEXT.ARIA_TOGGLE_ARTIFACTS}
          >
            <FiCode className={styles.actionButtonIcon} />
            {/* Notification badge */}
            <span className={styles.notificationBadge}>
              {artifactsCount}
            </span>
          </button>
        )}

        {/* New Chat Button */}
        <button
          onClick={createChat}
          className={styles.actionButtonWithText}
          aria-label={CHAT_UI_TEXT.ARIA_START_NEW_CHAT}
        >
          <MdAdd className={styles.actionButtonIcon} />
          <span className={styles.actionButtonText}>{CHAT_UI_TEXT.CHAT_HEADER_NEW_CHAT}</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={styles.actionButton}
          aria-label={isDarkMode ? CHAT_UI_TEXT.ARIA_TOGGLE_THEME.replace('{0}', 'light') : CHAT_UI_TEXT.ARIA_TOGGLE_THEME.replace('{0}', 'dark')}
        >
          {isDarkMode ? <MdLightMode className={styles.actionButtonIcon} /> : <MdDarkMode className={styles.actionButtonIcon} />}
        </button>

        {/* Help Button */}
        <Link
          href="/userguide"
          className={styles.actionButton}
          aria-label={CHAT_UI_TEXT.ARIA_USER_GUIDE}
        >
          <FiHelpCircle className={styles.actionButtonIcon} />
        </Link>

        {/* Export Chat */}
        {exportChat && (
          <button
            onClick={exportChat}
            className={styles.actionButton}
            aria-label={CHAT_UI_TEXT.ARIA_EXPORT_CONVERSATION}
          >
            <MdDownload className={styles.actionButtonIcon} />
          </button>
        )}

        {/* Feedback */}
        {setShowFeedbackForm && (
          <button
            onClick={setShowFeedbackForm}
            className={styles.actionButton}
            aria-label={CHAT_UI_TEXT.ARIA_PROVIDE_FEEDBACK}
          >
            <MdFeedback className={styles.actionButtonIcon} />
          </button>
        )}

        {/* Ticket */}
        {setShowTicketForm && (
          <button
            onClick={setShowTicketForm}
            className={styles.actionButton}
            aria-label={CHAT_UI_TEXT.ARIA_CREATE_TICKET}
          >
            <TicketIcon className={styles.actionButtonIcon} />
          </button>
        )}

        {/* Mobile Search Button */}
        <button
          className={styles.mobileSearchButton}
          aria-label={CHAT_UI_TEXT.ARIA_SEARCH}
        >
          <MdSearch className={styles.actionButtonIcon} />
        </button>

        {/* User Profile */}
        <Link href="/profile" aria-label={CHAT_UI_TEXT.ARIA_GO_TO_PROFILE || "Go to profile"} className={styles.userSection}>
          <UserThumbnail userId={getCurrentUserId()} size={16} className={styles.userThumbnail} />
        </Link>
      </div>
    </header>
  );
};

export default ChatHeader;