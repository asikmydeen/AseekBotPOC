'use client';

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
  dropzoneSubtext: string;
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
  dropzoneContainer: (isDragActive: boolean) => string;
  uploadIcon: (isDragActive: boolean) => string;
  dropzoneText: string;
  dropzoneSubtext: string;
  fileContainer: string;
  fileHeader: string;
  fileTitle: string;
  progressBar: string;
  progressBarFill: string;
  fileGrid: string;
  fileItem: string;
  fileIcon: string;
  fileDetails: string;
  fileName: string;
  fileSize: string;
  fileStatus: string;
  fileRemoveButton: string;
  actionsContainer: string;
  actionButton: (type: 'analyze' | 'send' | 'cancel', isDarkMode: boolean) => string;
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
  emptyState: {
    container: string;
    iconContainer: string;
    icon: string;
    title: string;
    description: string;
    promptBox: string;
  };
  typingContainer: string;
  botIconContainer: string;
  botIcon: string;
  progressBar: {
    container: string;
    fill: string;
  };
  statusIndicator: {
    container: string;
    statusWrapper: string;
    statusLabel: string;
    statusValue: string;
    buttonsContainer: string;
    refreshButton: string;
    cancelButton: string;
  };
}

export interface DocumentAnalysisPromptStyles {
  container: string;
  contentWrapper: string;
  title: string;
  description: string;
  buttonsContainer: string;
  analyzeButton: string;
  closeButton: string;
}

export interface FeedbackFormStyles {
  container: string;
  header: string;
  title: string;
  closeButton: string;
  ratingContainer: string;
  ratingLabel: string;
  starsContainer: string;
  starButton: string;
  starActive: string;
  starInactive: string;
  commentContainer: string;
  commentLabel: string;
  commentTextarea: string;
  buttonsContainer: string;
  cancelButton: string;
  submitButton: string;
  submitButtonDisabled: string;
}

export interface FileActionPromptStyles {
  container: string;
  actionButton: (type: 'preview' | 'analyze' | 'bid' | 'send' | 'cancel', isDarkMode: boolean) => string;
}

export interface FileUploadSectionStyles {
  container: string;
  dropzoneContainer: (isDragActive: boolean) => string;
  dropzoneActive: string;
  uploadIcon: string;
  dropzoneText: string;
  dropzoneSubtext: string;
  fileListContainer: string;
  fileListHeader: string;
  fileListTitle: string;
  progressBar: string;
  progressBarFill: string;
  fileList: string;
  fileItem: string;
  fileIconContainer: string;
  fileIcon: (fileType: string) => string;
  fileDetails: string;
  fileName: string;
  fileSize: string;
  removeButton: string;
  actionsContainer: string;
  actionButton: (type: 'analyze' | 'send' | 'cancel', isDarkMode: boolean) => string;
}

export interface ChatInterfaceStyles {
  container: string;
  errorDialog: {
    overlay: string;
    container: string;
    title: string;
    message: string;
    buttonContainer: string;
    button: string;
  };
  mainContent: string;
  messageContainer: string;
}

export interface HistoryListStyles {
  container: string;
  sectionTitle: string;
  emptyText: string;
  historyItem: {
    container: (isActive: boolean, isDarkMode: boolean) => string;
    content: string;
    icon: {
      pinned: string;
      recent: string;
    };
    title: string;
    date: string;
    optionsButton: string;
    optionsMenu: {
      container: string;
      menuItem: string;
      deleteItem: string;
    };
  };
  dialog: {
    overlay: string;
    container: string;
    title: string;
    content: string;
    input: string;
    buttonContainer: string;
    cancelButton: string;
    actionButton: (isDisabled: boolean, isDarkMode: boolean) => string;
    deleteButton: string;
  };
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
  return 'flex flex-col space-y-4 sm:space-y-6 px-1 sm:px-2 w-full';
};

export const getMessageListItemClass = (): string => {
  return 'message-container w-full max-w-full';
};

// Empty State Component
export const getMessageListEmptyStateContainerClass = (isDarkMode: boolean): string => {
  return `flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 rounded-xl shadow-lg mx-auto my-6 sm:my-8 md:my-12 max-w-md w-full
    ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-700'}`;
};

export const getMessageListEmptyStateIconContainerClass = (isDarkMode: boolean): string => {
  return `p-4 rounded-full mb-4 ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'}`;
};

export const getMessageListEmptyStateIconClass = (isDarkMode: boolean): string => {
  return `text-4xl ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`;
};

export const getMessageListEmptyStateTitleClass = (): string => {
  return 'text-2xl font-bold mb-3';
};

export const getMessageListEmptyStateDescriptionClass = (): string => {
  return 'text-center mb-6';
};

export const getMessageListEmptyStatePromptBoxClass = (isDarkMode: boolean): string => {
  return `px-4 py-2 rounded-lg ${isDarkMode ? 'bg-blue-800 text-blue-200' : 'bg-blue-200 text-blue-800'}
    font-medium text-sm`;
};

// Typing Container
export const getMessageListTypingContainerClass = (isDarkMode: boolean): string => {
  return `flex items-start space-x-2 sm:space-x-3 w-full max-w-full ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`;
};

export const getMessageListBotIconContainerClass = (isDarkMode: boolean): string => {
  return `w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-blue-900' : 'bg-blue-100'}`;
};

export const getMessageListBotIconClass = (isDarkMode: boolean): string => {
  return `${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`;
};

// Progress Bar
export const getMessageListProgressBarContainerClass = (): string => {
  return 'w-full max-w-[200px] sm:max-w-[250px] h-2 bg-gray-300 dark:bg-gray-700 rounded-full overflow-hidden mt-2 shadow-inner';
};

export const getMessageListProgressBarFillClass = (isDarkMode: boolean): string => {
  return `h-full ${isDarkMode ? 'bg-blue-500' : 'bg-blue-600'}`;
};

// Status Indicator
export const getMessageListStatusIndicatorContainerClass = (isDarkMode: boolean): string => {
  return `flex flex-col rounded-xl ${isDarkMode ? 'bg-gray-750' : 'bg-gray-100'} p-2 sm:p-3 shadow-md mt-2 w-full max-w-full`;
};

export const getMessageListStatusWrapperClass = (): string => {
  return 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2';
};

export const getMessageListStatusLabelClass = (isDarkMode: boolean): string => {
  return `text-sm font-medium mr-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`;
};

export const getMessageListStatusValueClass = (isDarkMode: boolean): string => {
  return `font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`;
};

export const getMessageListStatusButtonsContainerClass = (): string => {
  return 'flex space-x-2 self-end sm:self-auto';
};

export const getMessageListRefreshButtonClass = (isDarkMode: boolean): string => {
  return `text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center ${isDarkMode ? 'bg-blue-800 text-blue-200 hover:bg-blue-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`;
};

export const getMessageListCancelButtonClass = (isDarkMode: boolean): string => {
  return `text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg flex items-center ${isDarkMode ? 'bg-red-900 text-red-200 hover:bg-red-800' : 'bg-red-100 text-red-700 hover:bg-red-200'}`;
};

// Utility functions for DocumentAnalysisPrompt
export const getDocumentAnalysisPromptContainerClass = (isDarkMode: boolean): string => {
  return `mb-4 p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'} shadow-md`;
};

export const getDocumentAnalysisPromptContentWrapperClass = (): string => {
  return 'flex justify-between items-start';
};

export const getDocumentAnalysisPromptTitleClass = (isDarkMode: boolean): string => {
  return `font-medium ${isDarkMode ? 'text-white' : 'text-blue-800'}`;
};

export const getDocumentAnalysisPromptDescriptionClass = (isDarkMode: boolean): string => {
  return `text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`;
};

export const getDocumentAnalysisPromptButtonsContainerClass = (): string => {
  return 'flex flex-wrap gap-2 mt-3';
};

export const getDocumentAnalysisPromptAnalyzeButtonClass = (isDarkMode: boolean): string => {
  return `px-3 py-1.5 rounded-md text-sm font-medium ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`;
};

export const getDocumentAnalysisPromptCloseButtonClass = (isDarkMode: boolean): string => {
  return `p-1 rounded-full ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors duration-200`;
};

// Utility functions for FeedbackForm
export const getFeedbackFormContainerClass = (isDarkMode: boolean): string => {
  return `mb-6 p-6 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`;
};

export const getFeedbackFormHeaderClass = (): string => {
  return 'flex justify-between items-center mb-4';
};

export const getFeedbackFormTitleClass = (): string => {
  return 'text-xl font-semibold';
};

export const getFeedbackFormCloseButtonClass = (isDarkMode: boolean): string => {
  return `p-1 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`;
};

export const getFeedbackFormRatingContainerClass = (): string => {
  return 'mb-4';
};

export const getFeedbackFormRatingLabelClass = (): string => {
  return 'block mb-2 text-sm font-medium';
};

export const getFeedbackFormStarsContainerClass = (): string => {
  return 'flex space-x-2';
};

export const getFeedbackFormStarButtonClass = (): string => {
  return 'p-1 focus:outline-none transition-colors';
};

export const getFeedbackFormStarActiveClass = (isDarkMode: boolean): string => {
  return isDarkMode ? 'text-yellow-400' : 'text-yellow-500';
};

export const getFeedbackFormStarInactiveClass = (isDarkMode: boolean): string => {
  return isDarkMode ? 'text-gray-600' : 'text-gray-300';
};

export const getFeedbackFormCommentContainerClass = (): string => {
  return 'mb-6';
};

export const getFeedbackFormCommentLabelClass = (): string => {
  return 'block mb-2 text-sm font-medium';
};

export const getFeedbackFormCommentTextareaClass = (isDarkMode: boolean): string => {
  return `w-full p-3 rounded-md ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} border focus:ring-blue-500 focus:border-blue-500 min-h-[100px]`;
};

export const getFeedbackFormButtonsContainerClass = (): string => {
  return 'flex justify-end space-x-3';
};

export const getFeedbackFormCancelButtonClass = (isDarkMode: boolean): string => {
  return `px-4 py-2 rounded-md ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`;
};

export const getFeedbackFormSubmitButtonClass = (_isDarkMode: boolean, isDisabled: boolean): string => {
  return `px-4 py-2 rounded-md ${isDisabled ? 'bg-gray-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`;
};

// Utility functions for FileActionPrompt
export const getFileActionPromptContainerClass = (): string => {
  return 'flex flex-wrap gap-3 mb-4';
};

export const getFileActionPromptButtonClass = (type: 'preview' | 'analyze' | 'bid' | 'send' | 'cancel', isDarkMode: boolean): string => {
  let colorClasses = '';

  switch (type) {
    case 'preview':
      colorClasses = isDarkMode
        ? 'bg-amber-900 hover:bg-amber-800 text-amber-100 dark:border-amber-700'
        : 'bg-amber-100 hover:bg-amber-200 text-amber-800 border-transparent';
      break;
    case 'analyze':
      colorClasses = isDarkMode
        ? 'bg-blue-900 hover:bg-blue-800 text-blue-100 dark:border-blue-700'
        : 'bg-blue-100 hover:bg-blue-200 text-blue-800 border-transparent';
      break;
    case 'bid':
      colorClasses = isDarkMode
        ? 'bg-purple-900 hover:bg-purple-800 text-purple-100 dark:border-purple-700'
        : 'bg-purple-100 hover:bg-purple-200 text-purple-800 border-transparent';
      break;
    case 'send':
      colorClasses = isDarkMode
        ? 'bg-green-900 hover:bg-green-800 text-green-100 dark:border-green-700'
        : 'bg-green-100 hover:bg-green-200 text-green-800 border-transparent';
      break;
    case 'cancel':
      colorClasses = isDarkMode
        ? 'bg-red-900 hover:bg-red-800 text-red-100 dark:border-red-700'
        : 'bg-red-100 hover:bg-red-200 text-red-800 border-transparent';
      break;
  }

  return `px-5 py-2.5 ${colorClasses} rounded-full text-sm font-medium transition-all duration-200 whitespace-nowrap shadow-sm hover:shadow-md border-2`;
};

// Utility functions for FileUploadSection
export const getFileUploadSectionContainerClass = (): string => {
  return 'w-full';
};

export const getFileUploadSectionDropzoneContainerClass = (isDarkMode: boolean, isDragActive: boolean): string => {
  return `border-2 border-dashed rounded-lg p-6 mb-4 text-center cursor-pointer transition-colors ${isDarkMode
    ? isDragActive
      ? 'border-blue-400 bg-blue-900/20'
      : 'border-gray-600 hover:border-gray-500'
    : isDragActive
      ? 'border-blue-400 bg-blue-50'
      : 'border-gray-300 hover:border-gray-400'
    }`;
};

export const getFileUploadSectionUploadIconClass = (): string => {
  return 'mx-auto h-12 w-12 mb-2';
};

export const getFileUploadSectionDropzoneTextClass = (isDarkMode: boolean): string => {
  return `text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`;
};

export const getFileUploadSectionDropzoneSubtextClass = (isDarkMode: boolean): string => {
  return `text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`;
};

export const getFileUploadSectionFileListContainerClass = (isDarkMode: boolean): string => {
  return `rounded-lg p-4 mb-4 ${isDarkMode ? 'bg-gray-750' : 'bg-gray-100'}`;
};

export const getFileUploadSectionFileListHeaderClass = (): string => {
  return 'mb-3';
};

export const getFileUploadSectionFileListTitleClass = (isDarkMode: boolean): string => {
  return `text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`;
};

export const getFileUploadSectionProgressBarClass = (): string => {
  return 'w-full h-1 bg-gray-300 rounded-full mt-2';
};

export const getFileUploadSectionProgressBarFillClass = (): string => {
  return 'h-1 bg-blue-500 rounded-full';
};

export const getFileUploadSectionFileListClass = (): string => {
  return 'space-y-2 mb-3 max-h-40 overflow-y-auto';
};

export const getFileUploadSectionFileItemClass = (isDarkMode: boolean): string => {
  return `flex items-center justify-between p-2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-white'}`;
};

export const getFileUploadSectionFileIconContainerClass = (): string => {
  return 'flex items-center';
};

export const getFileUploadSectionFileIconClass = (fileType: string): string => {
  if (!fileType) return 'text-gray-500';
  if (fileType.includes('pdf')) return 'text-red-500';
  if (fileType.includes('doc')) return 'text-blue-500';
  if (fileType.includes('xlsx') || fileType.includes('csv')) return 'text-green-500';
  if (fileType.includes('image') || fileType.includes('jpg') || fileType.includes('png')) return 'text-purple-500';
  return 'text-gray-500';
};

export const getFileUploadSectionFileDetailsClass = (): string => {
  return 'flex flex-col';
};

export const getFileUploadSectionFileNameClass = (isDarkMode: boolean): string => {
  return `text-sm font-medium truncate max-w-xs ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`;
};

export const getFileUploadSectionFileSizeClass = (isDarkMode: boolean): string => {
  return `text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`;
};

export const getFileUploadSectionRemoveButtonClass = (isDarkMode: boolean): string => {
  return `p-1 rounded-full ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`;
};

export const getFileUploadSectionActionsContainerClass = (): string => {
  return 'flex space-x-2';
};

export const getFileUploadSectionActionButtonClass = (type: 'analyze' | 'send' | 'cancel', isDarkMode: boolean): string => {
  let colorClasses = '';

  switch (type) {
    case 'analyze':
      colorClasses = isDarkMode
        ? 'bg-blue-600 hover:bg-blue-700 text-white'
        : 'bg-blue-500 hover:bg-blue-600 text-white';
      break;
    case 'send':
      colorClasses = isDarkMode
        ? 'bg-green-600 hover:bg-green-700 text-white'
        : 'bg-green-500 hover:bg-green-600 text-white';
      break;
    case 'cancel':
      colorClasses = isDarkMode
        ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
        : 'bg-gray-200 hover:bg-gray-300 text-gray-700';
      break;
  }

  return `flex-1 py-2 px-4 rounded-md text-sm font-medium ${colorClasses}`;
};

// Utility functions for ChatInterface
export const getChatInterfaceContainerClass = (isDarkMode: boolean): string => {
  return `flex-1 flex h-full ${isDarkMode ? 'dark-bg dark-text' : 'bg-gray-50 text-gray-900'} font-sans shadow-lg`;
};

export const getChatInterfaceErrorDialogOverlayClass = (): string => {
  return 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
};

export const getChatInterfaceErrorDialogContainerClass = (isDarkMode: boolean): string => {
  return `p-6 rounded-lg shadow-xl max-w-md ${isDarkMode ? 'dark-card-bg dark-text' : 'bg-white text-gray-900'}`;
};

export const getChatInterfaceErrorDialogTitleClass = (): string => {
  return 'text-xl font-bold mb-4';
};

export const getChatInterfaceErrorDialogMessageClass = (): string => {
  return 'mb-6';
};

export const getChatInterfaceErrorDialogButtonContainerClass = (): string => {
  return 'flex justify-end';
};

export const getChatInterfaceErrorDialogButtonClass = (isDarkMode: boolean): string => {
  return `px-4 py-2 rounded-md ${isDarkMode ? 'dark-primary-bg hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`;
};

export const getChatInterfaceMainContentClass = (isArtifactPanelOpen: boolean): string => {
  return `flex-1 flex flex-col w-full transition-all duration-300 ${isArtifactPanelOpen ? 'mr-[40%]' : 'mr-0'}`;
};

export const getChatInterfaceMessageContainerClass = (isDarkMode: boolean): string => {
  return `flex-1 overflow-y-auto overscroll-contain p-6 ${isDarkMode ? 'dark-card-bg' : 'bg-gray-50'} rounded-lg shadow-inner mx-2 my-2`;
};

// Utility functions for HistoryList
export const getHistoryListContainerClass = (): string => {
  return 'h-full pb-4';
};

export const getHistoryListSectionTitleClass = (isDarkMode: boolean): string => {
  return `font-semibold text-sm mb-2 px-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`;
};

export const getHistoryListEmptyTextClass = (isDarkMode: boolean): string => {
  return `text-sm px-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`;
};

// History Item
export const getHistoryItemContainerClass = (isActive: boolean, isDarkMode: boolean): string => {
  return `p-3 rounded-lg cursor-pointer transition-all duration-200 relative mb-2 ${isActive
    ? isDarkMode
      ? 'bg-gray-700 border-l-4 border-blue-500'
      : 'bg-gray-200 border-l-4 border-blue-500'
    : isDarkMode
      ? 'bg-gray-800 hover:bg-gray-700'
      : 'bg-gray-100 hover:bg-gray-200'
    }`;
};

export const getHistoryItemContentClass = (): string => {
  return 'flex items-center';
};

export const getHistoryItemPinnedIconClass = (isDarkMode: boolean): string => {
  return isDarkMode ? 'text-yellow-400' : 'text-yellow-500';
};

export const getHistoryItemRecentIconClass = (isDarkMode: boolean): string => {
  return isDarkMode ? 'text-gray-400' : 'text-gray-500';
};

export const getHistoryItemTitleClass = (): string => {
  return 'text-sm font-medium truncate';
};

export const getHistoryItemDateClass = (): string => {
  return 'text-xs text-gray-500';
};

export const getHistoryItemOptionsButtonClass = (isDarkMode: boolean): string => {
  return `p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-300'}`;
};

export const getHistoryItemOptionsMenuContainerClass = (isDarkMode: boolean): string => {
  return `absolute right-0 top-full mt-1 z-10 w-48 rounded-md shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} ring-1 ring-black ring-opacity-5`;
};

export const getHistoryItemOptionsMenuItemClass = (isDarkMode: boolean): string => {
  return `w-full text-left block px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`;
};

export const getHistoryItemOptionsMenuDeleteItemClass = (isDarkMode: boolean): string => {
  return `w-full text-left block px-4 py-2 text-sm ${isDarkMode ? 'text-red-400 hover:bg-gray-700' : 'text-red-600 hover:bg-gray-100'}`;
};

// Dialog
export const getHistoryDialogOverlayClass = (): string => {
  return 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
};

export const getHistoryDialogContainerClass = (isDarkMode: boolean): string => {
  return `w-full max-w-md p-6 rounded-lg shadow-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`;
};

export const getHistoryDialogTitleClass = (isDarkMode: boolean): string => {
  return `text-lg font-medium mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`;
};

export const getHistoryDialogContentClass = (isDarkMode: boolean): string => {
  return `mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`;
};

export const getHistoryDialogInputClass = (isDarkMode: boolean): string => {
  return `w-full p-2 mb-4 border rounded-md ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'}`;
};

export const getHistoryDialogButtonContainerClass = (): string => {
  return 'flex justify-end space-x-3';
};

export const getHistoryDialogCancelButtonClass = (isDarkMode: boolean): string => {
  return `px-4 py-2 rounded-md ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`;
};

export const getHistoryDialogActionButtonClass = (isDisabled: boolean, isDarkMode: boolean): string => {
  return `px-4 py-2 rounded-md ${isDisabled
    ? 'bg-gray-500 cursor-not-allowed'
    : isDarkMode
      ? 'bg-blue-600 hover:bg-blue-700'
      : 'bg-blue-500 hover:bg-blue-600'
    } text-white`;
};

export const getHistoryDialogDeleteButtonClass = (isDarkMode: boolean): string => {
  return `px-4 py-2 rounded-md ${isDarkMode ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`;
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

// Utility functions for EnhancedFileDropzone
export const getEnhancedFileDropzoneContainerClass = (): string => {
  return 'w-full max-w-full mb-4 px-2 sm:px-0';
};

export const getEnhancedFileDropzoneDropzoneContainerClass = (isDarkMode: boolean, isDragActive: boolean): string => {
  return `border-3 border-dashed rounded-2xl p-4 sm:p-6 md:p-8 mb-4 text-center cursor-pointer transition-all duration-300
    ${isDarkMode
      ? isDragActive
        ? 'border-blue-400 bg-blue-900/20 shadow-inner shadow-blue-900/20'
        : 'border-gray-600 hover:border-blue-400 shadow-lg'
      : isDragActive
        ? 'border-blue-400 bg-blue-50 shadow-inner shadow-blue-500/10'
        : 'border-gray-300 hover:border-blue-400 shadow-md'
    }`;
};

export const getEnhancedFileDropzoneUploadIconClass = (isDarkMode: boolean, isDragActive: boolean): string => {
  return `mx-auto h-12 w-12 sm:h-16 sm:w-16 mb-2 sm:mb-4 ${isDragActive ? 'text-blue-500' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`;
};

export const getEnhancedFileDropzoneDropzoneTextClass = (isDarkMode: boolean): string => {
  return `text-base sm:text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`;
};

export const getEnhancedFileDropzoneDropzoneSubtextClass = (isDarkMode: boolean): string => {
  return `text-xs sm:text-sm mt-1 sm:mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`;
};

export const getEnhancedFileDropzoneFileContainerClass = (isDarkMode: boolean): string => {
  return `rounded-2xl p-3 sm:p-4 md:p-6 mb-4 ${isDarkMode ? 'bg-gray-750 shadow-xl' : 'bg-gray-50 shadow-lg'}`;
};

export const getEnhancedFileDropzoneFileHeaderClass = (): string => {
  return 'flex justify-between items-center mb-4';
};

export const getEnhancedFileDropzoneFileTitleClass = (isDarkMode: boolean): string => {
  return `text-base sm:text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`;
};

export const getEnhancedFileDropzoneProgressBarClass = (): string => {
  return 'w-full max-w-xs mx-auto h-2 bg-gray-300 rounded-full overflow-hidden mt-2 mb-3';
};

export const getEnhancedFileDropzoneProgressBarFillClass = (isDarkMode: boolean): string => {
  return `h-full ${isDarkMode ? 'bg-blue-500' : 'bg-blue-600'}`;
};

export const getEnhancedFileDropzoneFileGridClass = (): string => {
  return 'grid gap-2 sm:gap-3 mb-3 sm:mb-4 max-h-40 sm:max-h-60 overflow-y-auto pr-1 sm:pr-2';
};

export const getEnhancedFileDropzoneFileItemClass = (isDarkMode: boolean): string => {
  return `flex items-center justify-between p-2 sm:p-3 rounded-xl ${isDarkMode ? 'bg-gray-700 hover:bg-gray-650' : 'bg-white hover:bg-gray-50'} shadow-md transition-all duration-200`;
};

export const getEnhancedFileDropzoneFileIconClass = (isDarkMode: boolean): string => {
  return `mr-2 sm:mr-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`;
};

export const getEnhancedFileDropzoneFileDetailsClass = (): string => {
  return '';
};

export const getEnhancedFileDropzoneFileNameClass = (isDarkMode: boolean): string => {
  return `font-medium truncate max-w-[150px] sm:max-w-[200px] md:max-w-xs text-sm sm:text-base ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`;
};

export const getEnhancedFileDropzoneFileSizeClass = (isDarkMode: boolean): string => {
  return `text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`;
};

export const getEnhancedFileDropzoneFileStatusClass = (isDarkMode: boolean): string => {
  return `text-xs ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`;
};

export const getEnhancedFileDropzoneFileRemoveButtonClass = (isDarkMode: boolean): string => {
  return `p-2 rounded-full ${isDarkMode ? 'bg-gray-600 hover:bg-red-900 text-gray-300 hover:text-red-200' : 'bg-gray-200 hover:bg-red-100 text-gray-500 hover:text-red-500'} transition-colors`;
};

export const getEnhancedFileDropzoneActionsContainerClass = (): string => {
  return 'flex flex-wrap gap-2 sm:gap-3 justify-center';
};

export const getEnhancedFileDropzoneActionButtonClass = (type: 'analyze' | 'send' | 'cancel', isDarkMode: boolean): string => {
  let colorClasses = '';

  switch (type) {
    case 'analyze':
      colorClasses = isDarkMode
        ? 'bg-blue-600 hover:bg-blue-500 text-white'
        : 'bg-blue-500 hover:bg-blue-600 text-white';
      break;
    case 'send':
      colorClasses = isDarkMode
        ? 'bg-green-600 hover:bg-green-500 text-white'
        : 'bg-green-500 hover:bg-green-600 text-white';
      break;
    case 'cancel':
      colorClasses = isDarkMode
        ? 'bg-gray-600 hover:bg-gray-500 text-gray-200'
        : 'bg-gray-300 hover:bg-gray-400 text-gray-700';
      break;
  }

  return `py-2 sm:py-2.5 px-4 sm:px-6 rounded-xl text-xs sm:text-sm font-medium shadow-md ${colorClasses} transition-colors`;
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
    dropzoneSubtext: `text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`,
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

export const getEnhancedFileDropzoneStyles = (isDarkMode: boolean): EnhancedFileDropzoneStyles => {
  return {
    container: getEnhancedFileDropzoneContainerClass(),
    dropzoneContainer: (isDragActive: boolean) => getEnhancedFileDropzoneDropzoneContainerClass(isDarkMode, isDragActive),
    uploadIcon: (isDragActive: boolean) => getEnhancedFileDropzoneUploadIconClass(isDarkMode, isDragActive),
    dropzoneText: getEnhancedFileDropzoneDropzoneTextClass(isDarkMode),
    dropzoneSubtext: getEnhancedFileDropzoneDropzoneSubtextClass(isDarkMode),
    fileContainer: getEnhancedFileDropzoneFileContainerClass(isDarkMode),
    fileHeader: getEnhancedFileDropzoneFileHeaderClass(),
    fileTitle: getEnhancedFileDropzoneFileTitleClass(isDarkMode),
    progressBar: getEnhancedFileDropzoneProgressBarClass(),
    progressBarFill: getEnhancedFileDropzoneProgressBarFillClass(isDarkMode),
    fileGrid: getEnhancedFileDropzoneFileGridClass(),
    fileItem: getEnhancedFileDropzoneFileItemClass(isDarkMode),
    fileIcon: getEnhancedFileDropzoneFileIconClass(isDarkMode),
    fileDetails: getEnhancedFileDropzoneFileDetailsClass(),
    fileName: getEnhancedFileDropzoneFileNameClass(isDarkMode),
    fileSize: getEnhancedFileDropzoneFileSizeClass(isDarkMode),
    fileStatus: getEnhancedFileDropzoneFileStatusClass(isDarkMode),
    fileRemoveButton: getEnhancedFileDropzoneFileRemoveButtonClass(isDarkMode),
    actionsContainer: getEnhancedFileDropzoneActionsContainerClass(),
    actionButton: getEnhancedFileDropzoneActionButtonClass,
  };
};

export const getMessageListStyles = (isDarkMode: boolean): MessageListStyles => {
  return {
    container: getMessageListContainerClass(),
    messageItem: getMessageListItemClass(),
    emptyState: {
      container: getMessageListEmptyStateContainerClass(isDarkMode),
      iconContainer: getMessageListEmptyStateIconContainerClass(isDarkMode),
      icon: getMessageListEmptyStateIconClass(isDarkMode),
      title: getMessageListEmptyStateTitleClass(),
      description: getMessageListEmptyStateDescriptionClass(),
      promptBox: getMessageListEmptyStatePromptBoxClass(isDarkMode),
    },
    typingContainer: getMessageListTypingContainerClass(isDarkMode),
    botIconContainer: getMessageListBotIconContainerClass(isDarkMode),
    botIcon: getMessageListBotIconClass(isDarkMode),
    progressBar: {
      container: getMessageListProgressBarContainerClass(),
      fill: getMessageListProgressBarFillClass(isDarkMode),
    },
    statusIndicator: {
      container: getMessageListStatusIndicatorContainerClass(isDarkMode),
      statusWrapper: getMessageListStatusWrapperClass(),
      statusLabel: getMessageListStatusLabelClass(isDarkMode),
      statusValue: getMessageListStatusValueClass(isDarkMode),
      buttonsContainer: getMessageListStatusButtonsContainerClass(),
      refreshButton: getMessageListRefreshButtonClass(isDarkMode),
      cancelButton: getMessageListCancelButtonClass(isDarkMode),
    },
  };
};

export const getDocumentAnalysisPromptStyles = (isDarkMode: boolean): DocumentAnalysisPromptStyles => {
  return {
    container: getDocumentAnalysisPromptContainerClass(isDarkMode),
    contentWrapper: getDocumentAnalysisPromptContentWrapperClass(),
    title: getDocumentAnalysisPromptTitleClass(isDarkMode),
    description: getDocumentAnalysisPromptDescriptionClass(isDarkMode),
    buttonsContainer: getDocumentAnalysisPromptButtonsContainerClass(),
    analyzeButton: getDocumentAnalysisPromptAnalyzeButtonClass(isDarkMode),
    closeButton: getDocumentAnalysisPromptCloseButtonClass(isDarkMode),
  };
};

export const getFeedbackFormStyles = (isDarkMode: boolean): FeedbackFormStyles => {
  return {
    container: getFeedbackFormContainerClass(isDarkMode),
    header: getFeedbackFormHeaderClass(),
    title: getFeedbackFormTitleClass(),
    closeButton: getFeedbackFormCloseButtonClass(isDarkMode),
    ratingContainer: getFeedbackFormRatingContainerClass(),
    ratingLabel: getFeedbackFormRatingLabelClass(),
    starsContainer: getFeedbackFormStarsContainerClass(),
    starButton: getFeedbackFormStarButtonClass(),
    starActive: getFeedbackFormStarActiveClass(isDarkMode),
    starInactive: getFeedbackFormStarInactiveClass(isDarkMode),
    commentContainer: getFeedbackFormCommentContainerClass(),
    commentLabel: getFeedbackFormCommentLabelClass(),
    commentTextarea: getFeedbackFormCommentTextareaClass(isDarkMode),
    buttonsContainer: getFeedbackFormButtonsContainerClass(),
    cancelButton: getFeedbackFormCancelButtonClass(isDarkMode),
    submitButton: getFeedbackFormSubmitButtonClass(isDarkMode, false),
    submitButtonDisabled: getFeedbackFormSubmitButtonClass(isDarkMode, true),
  };
};

export const getFileActionPromptStyles = (): FileActionPromptStyles => {
  return {
    container: getFileActionPromptContainerClass(),
    actionButton: getFileActionPromptButtonClass,
  };
};

export const getFileUploadSectionStyles = (isDarkMode: boolean): FileUploadSectionStyles => {
  return {
    container: getFileUploadSectionContainerClass(),
    dropzoneContainer: (isDragActive: boolean) => getFileUploadSectionDropzoneContainerClass(isDarkMode, isDragActive),
    dropzoneActive: getFileUploadSectionDropzoneContainerClass(isDarkMode, true),
    uploadIcon: getFileUploadSectionUploadIconClass(),
    dropzoneText: getFileUploadSectionDropzoneTextClass(isDarkMode),
    dropzoneSubtext: getFileUploadSectionDropzoneSubtextClass(isDarkMode),
    fileListContainer: getFileUploadSectionFileListContainerClass(isDarkMode),
    fileListHeader: getFileUploadSectionFileListHeaderClass(),
    fileListTitle: getFileUploadSectionFileListTitleClass(isDarkMode),
    progressBar: getFileUploadSectionProgressBarClass(),
    progressBarFill: getFileUploadSectionProgressBarFillClass(),
    fileList: getFileUploadSectionFileListClass(),
    fileItem: getFileUploadSectionFileItemClass(isDarkMode),
    fileIconContainer: getFileUploadSectionFileIconContainerClass(),
    fileIcon: getFileUploadSectionFileIconClass,
    fileDetails: getFileUploadSectionFileDetailsClass(),
    fileName: getFileUploadSectionFileNameClass(isDarkMode),
    fileSize: getFileUploadSectionFileSizeClass(isDarkMode),
    removeButton: getFileUploadSectionRemoveButtonClass(isDarkMode),
    actionsContainer: getFileUploadSectionActionsContainerClass(),
    actionButton: getFileUploadSectionActionButtonClass,
  };
};

export const getChatInterfaceStyles = (isDarkMode: boolean, isArtifactPanelOpen: boolean): ChatInterfaceStyles => {
  return {
    container: getChatInterfaceContainerClass(isDarkMode),
    errorDialog: {
      overlay: getChatInterfaceErrorDialogOverlayClass(),
      container: getChatInterfaceErrorDialogContainerClass(isDarkMode),
      title: getChatInterfaceErrorDialogTitleClass(),
      message: getChatInterfaceErrorDialogMessageClass(),
      buttonContainer: getChatInterfaceErrorDialogButtonContainerClass(),
      button: getChatInterfaceErrorDialogButtonClass(isDarkMode),
    },
    mainContent: getChatInterfaceMainContentClass(isArtifactPanelOpen),
    messageContainer: getChatInterfaceMessageContainerClass(isDarkMode),
  };
};

export const getHistoryListStyles = (isDarkMode: boolean): HistoryListStyles => {
  return {
    container: getHistoryListContainerClass(),
    sectionTitle: getHistoryListSectionTitleClass(isDarkMode),
    emptyText: getHistoryListEmptyTextClass(isDarkMode),
    historyItem: {
      container: getHistoryItemContainerClass,
      content: getHistoryItemContentClass(),
      icon: {
        pinned: getHistoryItemPinnedIconClass(isDarkMode),
        recent: getHistoryItemRecentIconClass(isDarkMode),
      },
      title: getHistoryItemTitleClass(),
      date: getHistoryItemDateClass(),
      optionsButton: getHistoryItemOptionsButtonClass(isDarkMode),
      optionsMenu: {
        container: getHistoryItemOptionsMenuContainerClass(isDarkMode),
        menuItem: getHistoryItemOptionsMenuItemClass(isDarkMode),
        deleteItem: getHistoryItemOptionsMenuDeleteItemClass(isDarkMode),
      },
    },
    dialog: {
      overlay: getHistoryDialogOverlayClass(),
      container: getHistoryDialogContainerClass(isDarkMode),
      title: getHistoryDialogTitleClass(isDarkMode),
      content: getHistoryDialogContentClass(isDarkMode),
      input: getHistoryDialogInputClass(isDarkMode),
      buttonContainer: getHistoryDialogButtonContainerClass(),
      cancelButton: getHistoryDialogCancelButtonClass(isDarkMode),
      actionButton: getHistoryDialogActionButtonClass,
      deleteButton: getHistoryDialogDeleteButtonClass(isDarkMode),
    },
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
