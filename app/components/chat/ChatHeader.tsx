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
import { useChatHistory } from '../../context/ChatHistoryContext';

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

  return (
    <header className={`h-16 px-3 sm:px-4 md:px-6 flex items-center justify-between border-b ${isDarkMode ? 'dark-bg dark-border' : 'bg-white border-gray-200'}`}>
      {/* Logo/Title and Chat Info */}
      <div className="flex items-center">
        <h1 className={`text-lg sm:text-xl font-semibold ${isDarkMode ? 'dark-text' : 'text-gray-900'}`}>
          AseekBot
        </h1>
        {activeChat && (
          <span className={`ml-2 sm:ml-4 text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[200px] ${isDarkMode ? 'dark-text-secondary' : 'text-gray-600'}`}>
            {activeChat.title}
          </span>
        )}
      </div>

      {/* Search Bar */}
      <div className={`relative mx-2 sm:mx-4 flex-grow max-w-md sm:max-w-xl md:max-w-2xl hidden sm:block ${isDarkMode ? 'dark-text' : 'text-gray-900'}`}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MdSearch className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`block w-full pl-10 pr-3 py-2 rounded-md ${isDarkMode
            ? 'dark-card-bg dark-border dark-placeholder dark-text focus:ring-blue-500 focus:border-blue-500'
            : 'bg-gray-100 border-gray-300 placeholder-gray-500 text-gray-900 focus:ring-blue-600 focus:border-blue-600'
            } border focus:outline-none focus:ring-2 transition-colors`}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-3">
        {/* Artifacts Button - New */}
        {artifactsCount > 0 && (
          <button
            onClick={onToggleArtifacts}
            className={`p-1 sm:p-2 rounded-full flex items-center ${isArtifactPanelOpen
                ? isDarkMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-500 text-white'
                : isDarkMode
                  ? 'hover:dark-card-bg dark-text-secondary'
                  : 'hover:bg-gray-200 text-gray-700'
              } transition-colors relative`}
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
          className={`p-1 sm:p-2 rounded-full ${isDarkMode
            ? 'hover:dark-card-bg dark-text-secondary'
            : 'hover:bg-gray-200 text-gray-700'
            } transition-colors flex items-center`}
          aria-label="Start new chat"
        >
          <MdAdd className="h-4 w-4 sm:h-5 sm:w-5 mr-1" />
          <span className="hidden sm:inline">New Chat</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`p-1 sm:p-2 rounded-full ${isDarkMode
            ? 'hover:dark-card-bg dark-text-secondary'
            : 'hover:bg-gray-200 text-gray-700'
            } transition-colors`}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <MdLightMode className="h-4 w-4 sm:h-5 sm:w-5" /> : <MdDarkMode className="h-4 w-4 sm:h-5 sm:w-5" />}
        </button>

        {/* Help Button */}
        <Link
          href="/userguide"
          className={`p-1 sm:p-2 rounded-full ${isDarkMode
            ? 'hover:dark-card-bg dark-text-secondary'
            : 'hover:bg-gray-200 text-gray-700'
            } transition-colors`}
          aria-label="User Guide"
        >
          <FiHelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
        </Link>

        {/* Export Chat */}
        {exportChat && (
          <button
            onClick={exportChat}
            className={`p-1 sm:p-2 rounded-full ${isDarkMode
              ? 'hover:dark-card-bg dark-text-secondary'
              : 'hover:bg-gray-200 text-gray-700'
              } transition-colors`}
            aria-label="Export conversation"
          >
            <MdDownload className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        )}

        {/* Feedback */}
        {setShowFeedbackForm && (
          <button
            onClick={setShowFeedbackForm}
            className={`p-1 sm:p-2 rounded-full ${isDarkMode
              ? 'hover:dark-card-bg dark-text-secondary'
              : 'hover:bg-gray-200 text-gray-700'
              } transition-colors`}
            aria-label="Provide feedback"
          >
            <MdFeedback className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        )}

        {/* Ticket */}
        {setShowTicketForm && (
          <button
            onClick={setShowTicketForm}
            className={`p-1 sm:p-2 rounded-full ${isDarkMode
              ? 'hover:dark-card-bg dark-text-secondary'
              : 'hover:bg-gray-200 text-gray-700'
              } transition-colors`}
            aria-label="Create a ticket"
          >
            <TicketIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        )}

        {/* Mobile Search Button */}
        <button
          className={`p-1 sm:p-2 rounded-full sm:hidden ${isDarkMode
            ? 'hover:dark-card-bg dark-text-secondary'
            : 'hover:bg-gray-200 text-gray-700'
            } transition-colors`}
          aria-label="Search"
        >
          <MdSearch className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>

        {/* User Profile */}
        <Link href="/profile" aria-label="Go to profile">
          <UserThumbnail userId="test-user" size={16} className="sm:w-5 sm:h-5" />
        </Link>
      </div>
    </header>
  );
};

export default ChatHeader;