// app/components/chat/ChatHeader.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import {
  MdDarkMode,
  MdLightMode,
  MdSearch,
  MdDownload,
  MdFeedback,
  MdAdd,
  MdOutlineMoreVert
} from 'react-icons/md';
import { FiHelpCircle } from 'react-icons/fi';
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
}

const ChatHeader: React.FC<ChatHeaderProps> = ({
  isDarkMode,
  toggleTheme,
  searchQuery,
  setSearchQuery,
  exportChat,
  setShowFeedbackForm,
  setShowTicketForm
}) => {
  const { createChat, activeChat } = useChatHistory();

  return (
    <header className={`px-6 py-4 flex items-center justify-between border-b ${isDarkMode ? 'dark-bg dark-border' : 'bg-white border-gray-200'}`}>
      {/* Logo/Title and Chat Info */}
      <div className="flex items-center">
        <h1 className={`text-xl font-semibold ${isDarkMode ? 'dark-text' : 'text-gray-900'}`}>
          AseekBot
        </h1>
        {activeChat && (
          <span className={`ml-4 text-sm ${isDarkMode ? 'dark-text-secondary' : 'text-gray-600'}`}>
            {activeChat.title}
          </span>
        )}
      </div>

      {/* Search Bar */}
      <div className={`relative mx-4 flex-grow max-w-2xl ${isDarkMode ? 'dark-text' : 'text-gray-900'}`}>
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MdSearch className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`block w-full pl-10 pr-3 py-2 rounded-md ${isDarkMode
              ? 'dark-bg-secondary dark-border dark-placeholder dark-text focus:ring-blue-500 focus:border-blue-500'
              : 'bg-gray-100 border-gray-300 placeholder-gray-500 text-gray-900 focus:ring-blue-600 focus:border-blue-600'
            } border focus:outline-none focus:ring-2 transition-colors`}
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-4">
        {/* New Chat Button */}
        <button
          onClick={createChat}
          className={`p-2 rounded-full ${isDarkMode
              ? 'hover:dark-bg-secondary dark-text-secondary'
              : 'hover:bg-gray-200 text-gray-700'
            } transition-colors flex items-center`}
          aria-label="Start new chat"
        >
          <MdAdd className="h-5 w-5 mr-1" />
          <span className="hidden sm:inline">New Chat</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`p-2 rounded-full ${isDarkMode
              ? 'hover:dark-bg-secondary dark-text-secondary'
              : 'hover:bg-gray-200 text-gray-700'
            } transition-colors`}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDarkMode ? <MdLightMode className="h-5 w-5" /> : <MdDarkMode className="h-5 w-5" />}
        </button>

        {/* Help Button */}
        <Link
          href="/userguide"
          className={`p-2 rounded-full ${isDarkMode
              ? 'hover:dark-bg-secondary dark-text-secondary'
              : 'hover:bg-gray-200 text-gray-700'
            } transition-colors`}
          aria-label="User Guide"
        >
          <FiHelpCircle className="h-5 w-5" />
        </Link>

        {/* Export Chat */}
        {exportChat && (
          <button
            onClick={exportChat}
            className={`p-2 rounded-full ${isDarkMode
                ? 'hover:dark-bg-secondary dark-text-secondary'
                : 'hover:bg-gray-200 text-gray-700'
              } transition-colors`}
            aria-label="Export conversation"
          >
            <MdDownload className="h-5 w-5" />
          </button>
        )}

        {/* Feedback */}
        {setShowFeedbackForm && (
          <button
            onClick={setShowFeedbackForm}
            className={`p-2 rounded-full ${isDarkMode
                ? 'hover:dark-bg-secondary dark-text-secondary'
                : 'hover:bg-gray-200 text-gray-700'
              } transition-colors`}
            aria-label="Provide feedback"
          >
            <MdFeedback className="h-5 w-5" />
          </button>
        )}

        {/* Ticket */}
        {setShowTicketForm && (
          <button
            onClick={setShowTicketForm}
            className={`p-2 rounded-full ${isDarkMode
                ? 'hover:dark-bg-secondary dark-text-secondary'
                : 'hover:bg-gray-200 text-gray-700'
              } transition-colors`}
            aria-label="Create a ticket"
          >
            <TicketIcon className="h-5 w-5" />
          </button>
        )}
      </div>
    </header>
  );
};

export default ChatHeader;
