'use client';

import { CSSProperties } from 'react';
import { SenderType } from '../constants';

// Animation interfaces
export interface PulseAnimation {
  scale: number;
  opacity: number;
}

export interface SpinnerAnimation {
  rotate: number;
}

export interface SpinnerTransition {
  repeat: number;
  duration: number;
  ease: string;
}

// Define interfaces for each component's styles
export interface ChatHeaderStyles {
  container: string;
  logoSection: string;
  title: string;
  chatTitle: string;
  searchBar: {
    container: string;
    icon: string;
    input: string;
  };
  actionsContainer: string;
  actionButton: string;
  userSection: string;
}

export interface ChatInputStyles {
  container: string;
  form: string;
  textarea: string;
  buttonsContainer: string;
  fileButton: string;
  fileButtonActive: string;
  sendButton: string;
  sendButtonDisabled: string;
}

export interface ChatFooterStyles {
  container: string;
}

export interface FileDropzoneStyles {
  container: string;
  toggleButton: string;
  dropArea: string;
  dropAreaActive: string;
  fileSizeLimit: string;
  uploadingText: string;
  dragPrompt: string;
  fileList: string;
  fileItem: string;
  fileIcon: {
    container: string;
    pdf: string;
    word: string;
    text: string;
    csv: string;
    excel: string;
    image: string;
    default: string;
  };
  fileName: string;
  fileSize: string;
  fileRemoveButton: string;
  progressContainer: string;
  progressBar: string;
  progressText: string;
}

export interface SuggestionChipStyles {
  container: string;
  chip: (isSelected: boolean, isHovered: boolean, isDarkMode: boolean) => string;
}

export interface EnhancedChatInputStyles {
  container: string;
  innerContainer: string;
  form: string;
  textarea: string;
  buttonsContainer: string;
  fileButton: string;
  fileButtonActive: string;
  sendButton: (isDisabled: boolean, isDarkMode: boolean) => string;
}

export interface EnhancedFileDropzoneStyles {
  container: string;
  header: string;
  title: string;
  closeButton: string;
  dropArea: string;
  dropAreaActive: string;
  uploadingText: string;
  dragPrompt: string;
  fileList: string;
  fileItem: string;
  fileIcon: {
    container: string;
    pdf: string;
    word: string;
    text: string;
    csv: string;
    excel: string;
    image: string;
    default: string;
  };
  fileName: string;
  fileSize: string;
  fileRemoveButton: string;
  progressContainer: string;
  progressBar: string;
  progressText: string;
}

export interface EnhancedTypingIndicatorStyles {
  container: string;
  text: string;
  dotsContainer: string;
  dot: string;
}

export interface MessageListStyles {
  container: string;
  messageItem: string;
}

export interface TicketFormStyles {
  container: string;
  title: string;
  formGroup: string;
  label: string;
  input: string;
  textarea: string;
  select: string;
  buttonContainer: string;
  button: string;
  buttonSecondary: string;
}

// Utility functions for ChatHeader
export const getChatHeaderContainerClass = (isDarkMode: boolean): string => {
  return `h-16 px-3 sm:px-4 md:px-6 flex items-center justify-between border-b ${
    isDarkMode ? 'dark-bg dark-border' : 'bg-white border-gray-200'
  }`;
};

export const getChatHeaderLogoSectionClass = (): string => {
  return 'flex items-center';
};

export const getChatHeaderTitleClass = (isDarkMode: boolean): string => {
  return `text-lg sm:text-xl font-semibold ${isDarkMode ? 'dark-text' : 'text-gray-900'}`;
};

export const getChatHeaderChatTitleClass = (isDarkMode: boolean): string => {
  return `ml-2 sm:ml-4 text-xs sm:text-sm truncate max-w-[100px] sm:max-w-[200px] ${
    isDarkMode ? 'dark-text-secondary' : 'text-gray-600'
  }`;
};

export const getChatHeaderSearchBarContainerClass = (isDarkMode: boolean): string => {
  return `relative mx-2 sm:mx-4 flex-grow max-w-md sm:max-w-xl md:max-w-2xl hidden sm:block ${
    isDarkMode ? 'dark-text' : 'text-gray-900'
  }`;
};

export const getChatHeaderSearchBarIconClass = (): string => {
  return 'absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none h-5 w-5 text-gray-400';
};

export const getChatHeaderSearchBarInputClass = (isDarkMode: boolean): string => {
  return `block w-full pl-10 pr-3 py-2 rounded-md ${
    isDarkMode
      ? 'dark-card-bg dark-border dark-placeholder dark-text focus:ring-blue-500 focus:border-blue-500'
      : 'bg-gray-100 border-gray-300 placeholder-gray-500 text-gray-900 focus:ring-blue-600 focus:border-blue-600'
  } border focus:outline-none focus:ring-2 transition-colors`;
};

export const getChatHeaderActionsContainerClass = (): string => {
  return 'flex items-center space-x-1 sm:space-x-2';
};

export const getChatHeaderActionButtonClass = (isDarkMode: boolean): string => {
  return `p-2 rounded-full transition-colors ${
    isDarkMode
      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
  }`;
};

export const getChatHeaderUserSectionClass = (): string => {
  return 'ml-2 sm:ml-4';
};

// Utility functions for ChatInput
export const getChatInputContainerClass = (): string => {
  return 'flex flex-col';
};

export const getChatInputFormClass = (): string => {
  return 'relative';
};

export const getChatInputTextareaClass = (isDarkMode: boolean): string => {
  return `w-full p-4 pr-24 rounded-lg resize-none focus:outline-none focus:ring-2 ${
    isDarkMode
      ? 'bg-gray-800 text-white border-gray-700 focus:ring-blue-500'
      : 'bg-white text-gray-900 border-gray-300 focus:ring-blue-600'
  } border transition-colors`;
};

export const getChatInputButtonsContainerClass = (): string => {
  return 'absolute right-3 bottom-3 flex items-center space-x-2';
};

export const getChatInputFileButtonClass = (isDarkMode: boolean, isActive: boolean): string => {
  return `p-2 rounded-full transition-colors ${
    isActive
      ? isDarkMode
        ? 'bg-gray-600 text-blue-300'
        : 'bg-gray-300 text-blue-500'
      : isDarkMode
        ? 'text-gray-400 hover:text-gray-200 bg-gray-700 hover:bg-gray-600'
        : 'text-gray-500 hover:text-gray-700 bg-gray-200 hover:bg-gray-300'
  }`;
};

export const getChatInputSendButtonClass = (isDarkMode: boolean, isDisabled: boolean): string => {
  return `p-2 rounded-full transition-colors ${
    isDisabled
      ? isDarkMode
        ? 'text-gray-500 bg-gray-700'
        : 'text-gray-400 bg-gray-200'
      : isDarkMode
        ? 'text-white bg-blue-600 hover:bg-blue-700'
        : 'text-white bg-blue-500 hover:bg-blue-600'
  }`;
};

// Utility functions for ChatFooter
export const getChatFooterContainerClass = (isDarkMode: boolean): string => {
  return `px-2 sm:px-4 pt-2 pb-3 sm:pb-4 border-t ${
    isDarkMode ? 'dark-border dark-bg' : 'border-gray-200 bg-white'
  }`;
};

// Utility functions for FileDropzone
export const getFileDropzoneContainerClass = (): string => {
  return 'mt-2 relative';
};

export const getFileDropzoneToggleButtonClass = (isDarkMode: boolean, isExpanded: boolean): string => {
  return `flex items-center justify-between w-full p-2 rounded-lg text-sm ${
    isDarkMode
      ? isExpanded
        ? 'bg-gray-700 text-gray-200'
        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
      : isExpanded
        ? 'bg-gray-200 text-gray-800'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  } transition-colors`;
};

export const getFileDropzoneDropAreaClass = (isDarkMode: boolean, isDragActive: boolean): string => {
  return `
    mt-2 p-3 border border-dashed rounded-lg text-center cursor-pointer transition-all
    ${
      isDarkMode
        ? 'bg-gray-800/50 border-gray-600 hover:border-blue-500'
        : 'bg-gray-50/50 border-gray-300 hover:border-blue-500'
    }
    ${
      isDragActive
        ? isDarkMode
          ? 'border-blue-400 bg-gray-700/50'
          : 'border-blue-400 bg-blue-50/50'
        : ''
    }
  `;
};

export const getFileDropzoneSizeLimitClass = (isDarkMode: boolean): string => {
  return `inline-block px-2 py-1 mb-2 rounded-full text-xs font-medium ${
    isDarkMode ? 'bg-blue-900/70 text-blue-200' : 'bg-blue-100 text-blue-800'
  }`;
};

export const getFileDropzoneUploadingTextClass = (isDarkMode: boolean): string => {
  return `text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`;
};

export const getFileDropzoneDragPromptClass = (isDarkMode: boolean): string => {
  return `text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`;
};

export const getFileDropzoneFileListClass = (): string => {
  return 'mt-3 space-y-2';
};

export const getFileDropzoneFileItemClass = (isDarkMode: boolean): string => {
  return `flex items-center justify-between p-2 rounded-lg ${
    isDarkMode ? 'bg-gray-700' : 'bg-white border border-gray-200'
  }`;
};

export const getFileDropzoneFileIconContainerClass = (): string => {
  return 'flex-shrink-0 mr-2';
};

export const getFileDropzoneFileIconClass = (fileType: string): string => {
  switch (fileType) {
    case 'pdf':
      return 'text-red-500';
    case 'word':
      return 'text-blue-500';
    case 'text':
      return 'text-gray-500';
    case 'csv':
      return 'text-green-500';
    case 'excel':
      return 'text-green-600';
    case 'image':
      return 'text-purple-500';
    default:
      return 'text-gray-400';
  }
};

export const getFileDropzoneFileNameClass = (isDarkMode: boolean): string => {
  return `text-sm font-medium truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`;
};

export const getFileDropzoneFileSizeClass = (isDarkMode: boolean): string => {
  return `text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`;
};

export const getFileDropzoneFileRemoveButtonClass = (isDarkMode: boolean): string => {
  return `p-1 rounded-full ${
    isDarkMode
      ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-600'
      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
  }`;
};

export const getFileDropzoneProgressContainerClass = (): string => {
  return 'w-full mt-2 bg-gray-200 rounded-full h-2.5 dark:bg-gray-700';
};

export const getFileDropzoneProgressBarClass = (): string => {
  return 'bg-blue-600 h-2.5 rounded-full';
};

export const getFileDropzoneProgressTextClass = (isDarkMode: boolean): string => {
  return `text-xs mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`;
};

// Utility functions for SuggestionChips
export const getSuggestionChipsContainerClass = (): string => {
  return 'flex flex-wrap gap-3 mb-4';
};

export const getSuggestionChipClass = (
  isSelected: boolean,
  isHovered: boolean,
  isDarkMode: boolean
): string => {
  return `px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${
    isSelected
      ? isDarkMode
        ? 'border-2 border-blue-400 bg-blue-800 shadow-lg shadow-blue-900/30'
        : 'border-2 border-blue-500 bg-blue-100 shadow-md shadow-blue-500/20'
      : isHovered
        ? isDarkMode
          ? 'bg-gray-700 shadow-md shadow-gray-900/20'
          : 'bg-gray-100 shadow-sm shadow-gray-300/20'
        : isDarkMode
          ? 'bg-gray-800 border border-gray-700'
          : 'bg-white border border-gray-200 shadow-sm'
  }`;
};

// Utility functions for EnhancedChatInput
export const getEnhancedChatInputContainerClass = (): string => {
  return 'relative';
};

export const getEnhancedChatInputInnerContainerClass = (isDarkMode: boolean): string => {
  return `relative rounded-xl overflow-hidden transition-all duration-300 ${
    isDarkMode
      ? 'bg-gray-800 shadow-lg shadow-black/20'
      : 'bg-white shadow-lg shadow-gray-200/50'
  }`;
};

export const getEnhancedChatInputFormClass = (): string => {
  return 'flex items-end';
};

export const getEnhancedChatInputTextareaClass = (isDarkMode: boolean): string => {
  return `w-full p-3 sm:p-4 pr-24 resize-none focus:outline-none ${
    isDarkMode
      ? 'bg-gray-800 text-white placeholder-gray-400'
      : 'bg-white text-gray-900 placeholder-gray-500'
  } transition-colors`;
};

export const getEnhancedChatInputButtonsContainerClass = (): string => {
  return 'absolute right-2 bottom-2 sm:right-3 sm:bottom-3 flex items-center space-x-1 sm:space-x-2';
};

export const getEnhancedChatInputFileButtonClass = (isDarkMode: boolean, isActive: boolean): string => {
  return `p-2 rounded-full transition-all duration-300 ${
    isActive
      ? isDarkMode
        ? 'bg-blue-700 text-blue-200'
        : 'bg-blue-100 text-blue-600'
      : isDarkMode
        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-gray-200'
        : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
  }`;
};

export const getEnhancedChatInputSendButtonClass = (isDisabled: boolean, isDarkMode: boolean): string => {
  return `p-2 sm:p-3 rounded-full transition-all duration-300 ${
    isDisabled
      ? isDarkMode
        ? 'dark-bg dark-text-disabled cursor-not-allowed'
        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
      : isDarkMode
        ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-md'
        : 'bg-blue-600 text-white hover:bg-blue-500 shadow-md'
  }`;
};

// Utility functions for EnhancedTypingIndicator
export const getEnhancedTypingIndicatorContainerClass = (isDarkMode: boolean): string => {
  return `p-3 sm:p-4 rounded-2xl inline-flex items-center ${
    isDarkMode
      ? 'bg-gray-800 shadow-lg shadow-gray-900/50'
      : 'bg-white shadow-lg shadow-gray-200/50'
  }`;
};

export const getEnhancedTypingIndicatorTextClass = (): string => {
  return 'font-semibold text-xs sm:text-sm mr-2 sm:mr-3';
};

export const getEnhancedTypingIndicatorDotsContainerClass = (): string => {
  return 'flex space-x-1.5';
};

export const getEnhancedTypingIndicatorDotClass = (isDarkMode: boolean): string => {
  return `w-2.5 h-2.5 rounded-full ${isDarkMode ? 'bg-blue-400' : 'bg-blue-600'}`;
};

// Utility functions for MessageList
export const getMessageListContainerClass = (): string => {
  return 'flex-1 overflow-y-auto p-4 space-y-4';
};

export const getMessageListItemClass = (): string => {
  return 'animate-fadeIn';
};

// Utility functions for TicketForm
export const getTicketFormContainerClass = (isDarkMode: boolean): string => {
  return `mb-6 p-4 rounded-lg shadow-lg ${
    isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
  }`;
};

export const getTicketFormTitleClass = (): string => {
  return 'text-lg font-semibold mb-4';
};

export const getTicketFormGroupClass = (): string => {
  return 'mb-4';
};

export const getTicketFormLabelClass = (): string => {
  return 'block mb-2 text-sm font-medium';
};

export const getTicketFormInputClass = (isDarkMode: boolean): string => {
  return `w-full p-2 rounded-md ${
    isDarkMode
      ? 'bg-gray-700 border-gray-600 text-white'
      : 'bg-white border-gray-300 text-gray-900'
  } border focus:outline-none focus:ring-2 focus:ring-blue-500`;
};

export const getTicketFormTextareaClass = (isDarkMode: boolean): string => {
  return `w-full p-2 rounded-md ${
    isDarkMode
      ? 'bg-gray-700 border-gray-600 text-white'
      : 'bg-white border-gray-300 text-gray-900'
  } border focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]`;
};

export const getTicketFormSelectClass = (isDarkMode: boolean): string => {
  return `w-full p-2 rounded-md ${
    isDarkMode
      ? 'bg-gray-700 border-gray-600 text-white'
      : 'bg-white border-gray-300 text-gray-900'
  } border focus:outline-none focus:ring-2 focus:ring-blue-500`;
};

export const getTicketFormButtonContainerClass = (): string => {
  return 'flex justify-end space-x-3 mt-6';
};

export const getTicketFormButtonClass = (isDarkMode: boolean): string => {
  return `px-4 py-2 rounded-md ${
    isDarkMode
      ? 'bg-blue-600 hover:bg-blue-700 text-white'
      : 'bg-blue-500 hover:bg-blue-600 text-white'
  } transition-colors`;
};

export const getTicketFormButtonSecondaryClass = (isDarkMode: boolean): string => {
  return `px-4 py-2 rounded-md ${
    isDarkMode
      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
  } transition-colors`;
};

// Get all styles for each component
export const getChatHeaderStyles = (isDarkMode: boolean): ChatHeaderStyles => {
  return {
    container: getChatHeaderContainerClass(isDarkMode),
    logoSection: getChatHeaderLogoSectionClass(),
    title: getChatHeaderTitleClass(isDarkMode),
    chatTitle: getChatHeaderChatTitleClass(isDarkMode),
    searchBar: {
      container: getChatHeaderSearchBarContainerClass(isDarkMode),
      icon: getChatHeaderSearchBarIconClass(),
      input: getChatHeaderSearchBarInputClass(isDarkMode),
    },
    actionsContainer: getChatHeaderActionsContainerClass(),
    actionButton: getChatHeaderActionButtonClass(isDarkMode),
    userSection: getChatHeaderUserSectionClass(),
  };
};

export const getChatInputStyles = (isDarkMode: boolean): ChatInputStyles => {
  return {
    container: getChatInputContainerClass(),
    form: getChatInputFormClass(),
    textarea: getChatInputTextareaClass(isDarkMode),
    buttonsContainer: getChatInputButtonsContainerClass(),
    fileButton: getChatInputFileButtonClass(isDarkMode, false),
    fileButtonActive: getChatInputFileButtonClass(isDarkMode, true),
    sendButton: getChatInputSendButtonClass(isDarkMode, false),
    sendButtonDisabled: getChatInputSendButtonClass(isDarkMode, true),
  };
};

export const getChatFooterStyles = (isDarkMode: boolean): ChatFooterStyles => {
  return {
    container: getChatFooterContainerClass(isDarkMode),
  };
};

export const getFileDropzoneStyles = (isDarkMode: boolean): FileDropzoneStyles => {
  return {
    container: getFileDropzoneContainerClass(),
    toggleButton: getFileDropzoneToggleButtonClass(isDarkMode, false),
    dropArea: getFileDropzoneDropAreaClass(isDarkMode, false),
    dropAreaActive: getFileDropzoneDropAreaClass(isDarkMode, true),
    fileSizeLimit: getFileDropzoneSizeLimitClass(isDarkMode),
    uploadingText: getFileDropzoneUploadingTextClass(isDarkMode),
    dragPrompt: getFileDropzoneDragPromptClass(isDarkMode),
    fileList: getFileDropzoneFileListClass(),
    fileItem: getFileDropzoneFileItemClass(isDarkMode),
    fileIcon: {
      container: getFileDropzoneFileIconContainerClass(),
      pdf: getFileDropzoneFileIconClass('pdf'),
      word: getFileDropzoneFileIconClass('word'),
      text: getFileDropzoneFileIconClass('text'),
      csv: getFileDropzoneFileIconClass('csv'),
      excel: getFileDropzoneFileIconClass('excel'),
      image: getFileDropzoneFileIconClass('image'),
      default: getFileDropzoneFileIconClass('default'),
    },
    fileName: getFileDropzoneFileNameClass(isDarkMode),
    fileSize: getFileDropzoneFileSizeClass(isDarkMode),
    fileRemoveButton: getFileDropzoneFileRemoveButtonClass(isDarkMode),
    progressContainer: getFileDropzoneProgressContainerClass(),
    progressBar: getFileDropzoneProgressBarClass(),
    progressText: getFileDropzoneProgressTextClass(isDarkMode),
  };
};

export const getSuggestionChipStyles = (): SuggestionChipStyles => {
  return {
    container: getSuggestionChipsContainerClass(),
    chip: getSuggestionChipClass,
  };
};

export const getEnhancedChatInputStyles = (isDarkMode: boolean): EnhancedChatInputStyles => {
  return {
    container: getEnhancedChatInputContainerClass(),
    innerContainer: getEnhancedChatInputInnerContainerClass(isDarkMode),
    form: getEnhancedChatInputFormClass(),
    textarea: getEnhancedChatInputTextareaClass(isDarkMode),
    buttonsContainer: getEnhancedChatInputButtonsContainerClass(),
    fileButton: getEnhancedChatInputFileButtonClass(isDarkMode, false),
    fileButtonActive: getEnhancedChatInputFileButtonClass(isDarkMode, true),
    sendButton: getEnhancedChatInputSendButtonClass,
  };
};

export const getEnhancedTypingIndicatorStyles = (isDarkMode: boolean): EnhancedTypingIndicatorStyles => {
  return {
    container: getEnhancedTypingIndicatorContainerClass(isDarkMode),
    text: getEnhancedTypingIndicatorTextClass(),
    dotsContainer: getEnhancedTypingIndicatorDotsContainerClass(),
    dot: getEnhancedTypingIndicatorDotClass(isDarkMode),
  };
};

export const getMessageListStyles = (): MessageListStyles => {
  return {
    container: getMessageListContainerClass(),
    messageItem: getMessageListItemClass(),
  };
};

export const getTicketFormStyles = (isDarkMode: boolean): TicketFormStyles => {
  return {
    container: getTicketFormContainerClass(isDarkMode),
    title: getTicketFormTitleClass(),
    formGroup: getTicketFormGroupClass(),
    label: getTicketFormLabelClass(),
    input: getTicketFormInputClass(isDarkMode),
    textarea: getTicketFormTextareaClass(isDarkMode),
    select: getTicketFormSelectClass(isDarkMode),
    buttonContainer: getTicketFormButtonContainerClass(),
    button: getTicketFormButtonClass(isDarkMode),
    buttonSecondary: getTicketFormButtonSecondaryClass(isDarkMode),
  };
};

// Animation variants for reuse
export const messageAnimations = {
  // Typing indicator animation
  typingIndicator: {
    dot1: {
      y: [0, -5, 0],
      transition: {
        y: {
          repeat: Infinity,
          duration: 0.6,
          ease: "easeInOut" as const,
          repeatDelay: 0.2,
        }
      }
    },
    dot2: {
      y: [0, -5, 0],
      transition: {
        y: {
          repeat: Infinity,
          duration: 0.6,
          ease: "easeInOut" as const,
          repeatDelay: 0.2,
          delay: 0.2
        }
      }
    },
    dot3: {
      y: [0, -5, 0],
      transition: {
        y: {
          repeat: Infinity,
          duration: 0.6,
          ease: "easeInOut" as const,
          repeatDelay: 0.2,
          delay: 0.4
        }
      }
    }
  },

  // Pulse animation for buttons
  pulseVariants: {
    inactive: {
      scale: 1,
    },
    active: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse" as const
      }
    }
  },

  // Button hover animations
  buttonHover: {
    hover: {
      scale: 1.1,
      transition: { duration: 0.2 }
    },
    tap: {
      scale: 0.9,
      transition: { duration: 0.2 }
    }
  },

  // For collapsible sections
  collapse: {
    hidden: {
      height: 0,
      opacity: 0,
      transition: {
        height: { duration: 0.3, ease: "easeInOut" as const },
        opacity: { duration: 0.2 }
      }
    },
    visible: {
      height: "auto",
      opacity: 1,
      transition: {
        height: { duration: 0.3, ease: "easeInOut" as const },
        opacity: { duration: 0.2, delay: 0.1 }
      }
    }
  }
};
