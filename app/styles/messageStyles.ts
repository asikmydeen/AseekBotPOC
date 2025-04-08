// app/styles/messageStyles.ts
// Centralized styles for the Message component

// Import types
import { CSSProperties } from 'react';

/**
 * Animation variants for message containers
 */
export const messageAnimationVariants = {
  initial: {
    opacity: 0,
    y: 10,
    scale: 0.98,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30,
      mass: 1
    }
  },
  hover: {
    scale: 1.01,
    boxShadow: '0 20px 25px -5px rgba(59, 130, 246, 0.2), 0 8px 10px -6px rgba(59, 130, 246, 0.1)',
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 20
    }
  }
};

/**
 * Animation variants for message containers in dark mode
 */
export const darkMessageAnimationVariants = {
  initial: {
    opacity: 0,
    y: 10,
    scale: 0.98,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2)'
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30,
      mass: 1
    }
  },
  hover: {
    scale: 1.01,
    boxShadow: '0 20px 25px -5px rgba(30, 64, 175, 0.3), 0 8px 10px -6px rgba(30, 64, 175, 0.3)',
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 20
    }
  }
};

/**
 * Animation variants for buttons
 */
export const buttonAnimationVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.1 },
  tap: { scale: 0.9 }
};

/**
 * Get message container class based on sender and theme
 */
export const getMessageContainerClass = (sender: 'user' | 'bot', isDarkMode: boolean): string => {
  if (sender === 'user') {
    return isDarkMode
      ? 'bg-gradient-to-br from-gray-800 to-gray-900 dark-text border dark-border text-left'
      : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-900 border border-gray-200 text-left';
  } else {
    return isDarkMode
      ? 'bg-gradient-to-br from-blue-900 to-blue-950 dark-text border dark-border'
      : 'bg-gradient-to-br from-blue-100 to-blue-200 text-gray-900 border border-blue-300';
  }
};

/**
 * Get avatar container class based on sender and theme
 */
export const getAvatarContainerClass = (sender: 'user' | 'bot', isDarkMode: boolean): string => {
  return sender === 'user'
    ? isDarkMode ? 'dark-active' : 'bg-gray-200'
    : isDarkMode ? 'dark-info-bg' : 'bg-blue-100';
};

/**
 * Get markdown content class based on theme
 */
export const getMarkdownContentClass = (isDarkMode: boolean): string => {
  return `text-base leading-relaxed prose max-w-none break-words overflow-hidden
    ${isDarkMode ? 'prose-invert dark-text' : 'text-gray-900'}
    prose-a:${isDarkMode ? 'dark-primary' : 'text-blue-600'}
    prose-img:max-w-full prose-img:rounded-md prose-img:my-2
    prose-pre:max-w-full prose-pre:overflow-x-auto
    prose-code:text-sm prose-code:p-1 prose-code:rounded
    prose-code:before:content-none prose-code:after:content-none
    ${isDarkMode ? 'prose-code:bg-gray-800' : 'prose-code:bg-gray-100'}
    prose-headings:mt-4 prose-headings:mb-2
    prose-p:my-2 prose-ul:my-2 prose-ol:my-2
    prose-li:my-1 prose-blockquote:my-2
    prose-table:my-2 prose-hr:my-4`;
};

/**
 * Get attachments container class based on theme
 */
export const getAttachmentsContainerClass = (isDarkMode: boolean): string => {
  return `mt-3 p-3 rounded-xl ${isDarkMode ? 'dark-card-bg' : 'attachment-bg-light'} shadow-md`;
};

/**
 * Get report container class based on theme
 */
export const getReportContainerClass = (isDarkMode: boolean): string => {
  return `mt-4 p-5 rounded-xl ${isDarkMode ? 'dark-bg' : 'bg-gray-100'} shadow-lg border ${
    isDarkMode ? 'dark-border' : 'border-gray-300'
  }`;
};

/**
 * Get button class based on theme and state
 */
export const getButtonClass = (
  type: 'primary' | 'secondary' | 'reaction' | 'toggle',
  isDarkMode: boolean,
  isActive?: boolean
): string => {
  switch (type) {
    case 'primary':
      return isDarkMode
        ? 'dark-primary-bg hover:bg-blue-700 text-blue-100'
        : 'bg-blue-100 hover:bg-blue-200 text-blue-800';
    case 'secondary':
      return isDarkMode
        ? 'dark-active dark-text hover:dark-hover'
        : 'bg-gray-200 text-gray-800 hover:bg-gray-300';
    case 'reaction':
      if (isActive) {
        return isDarkMode
          ? isActive === true
            ? 'dark-success-bg text-white'
            : 'dark-error-bg text-white'
          : isActive === true
            ? 'bg-green-100 text-green-600'
            : 'bg-red-100 text-red-600';
      }
      return isDarkMode
        ? 'dark-bg dark-text hover:dark-hover hover:dark-text'
        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700';
    case 'toggle':
      if (isActive) {
        return isDarkMode
          ? 'dark-primary-bg text-white'
          : 'bg-blue-100 text-blue-600';
      }
      return isDarkMode
        ? 'dark-bg dark-text hover:dark-hover hover:dark-text'
        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700';
    default:
      return '';
  }
};

/**
 * Get citation panel class based on theme
 */
export const getCitationPanelClass = (isDarkMode: boolean): string => {
  return `mt-4 p-4 rounded-lg ${
    isDarkMode ? 'dark-info-bg border dark-border' : 'bg-blue-50 border border-blue-200'
  }`;
};

/**
 * Get ticket info class based on theme
 */
export const getTicketInfoClass = (isDarkMode: boolean): string => {
  return `mt-4 p-3 rounded-lg ${
    isDarkMode ? 'dark-success-bg border dark-border' : 'bg-green-50 border border-green-200'
  }`;
};

/**
 * Get image confirmation dialog class based on theme
 */
export const getImageConfirmationDialogClass = (isDarkMode: boolean): string => {
  return `p-6 rounded-xl ${isDarkMode ? 'dark-bg' : 'bg-white'} max-w-lg w-full shadow-2xl`;
};

/**
 * Get file item class based on theme
 */
export const getFileItemClass = (isDarkMode: boolean): string => {
  return `flex items-center p-3 rounded-lg ${
    isDarkMode ? 'dark-active hover:dark-hover' : 'bg-white hover:bg-gray-50'
  } cursor-pointer transition-all duration-200 shadow-sm`;
};

/**
 * Get file button class based on theme
 */
export const getFileButtonClass = (isDarkMode: boolean): string => {
  return `p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`;
};

/**
 * Get timestamp class based on theme
 */
export const getTimestampClass = (isDarkMode: boolean): string => {
  return `text-xs rounded-full px-2 py-1 ${isDarkMode ? 'dark-bg dark-text' : 'bg-gray-100 text-gray-500'}`;
};
