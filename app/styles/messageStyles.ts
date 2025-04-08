// app/styles/messageStyles.ts
// Centralized styles for the Message component

// Animation types
type SpinnerTransition = {
  duration: number;
  repeat: number;
  ease: string;
};

type SpinnerAnimation = {
  rotate: number;
};

type FileItemHoverStyle = {
  scale: number;
  backgroundColor: string;
  boxShadow: string;
};

type FileActionButtonHoverStyle = {
  scale: number;
  color: string;
};

// Component-specific style interfaces
export interface MessageStyles {
  // Container styles
  container: {
    base: string;
    relative: string;
  };
  wrapper: string;
  flexContainer: string;
  avatar: {
    container: string;
    inner: string;
    icon: string;
  };
  content: {
    container: string;
    markdown: string;
    typing: {
      container: string;
      text: string;
      spinner: {
        wrapper: string;
        icon: string;
        animation: SpinnerAnimation;
        transition: SpinnerTransition;
      };
    };
  };
  attachments: {
    container: string;
    header: {
      container: string;
      iconContainer: string;
      icon: string;
      count: string;
    };
    list: string;
    item: string;
    itemHover: FileItemHoverStyle;
    icon: {
      container: string;
      pdf: string;
      word: string;
      text: string;
      csv: string;
      excel: string;
      image: string;
      default: string;
    };
    content: string;
    name: string;
    size: string;
    actions: string;
    actionButton: string;
    actionButtonHover: FileActionButtonHoverStyle;
    showMore: string;
    toggleButton: string;
    toggleButtonHover: any;
  };
  imageDialog: {
    overlay: string;
    container: string;
    title: string;
    content: string;
    buttons: string;
    cancelButton: string;
    confirmButton: string;
  };
  actions: {
    container: string;
    button: string;
    reaction: (isDarkMode: boolean, isActive: boolean | null, isThumbsUp: boolean) => string;
    pin: (isDarkMode: boolean, isPinned: boolean) => string;
    citation: (isDarkMode: boolean, isActive: boolean) => string;
  };
  report: {
    container: string;
    title: string;
    buttons: string;
    toggleButton: string;
    downloadButton: string;
  };
  citations: {
    container: string;
    title: string;
    list: string;
  };
  ticket: {
    container: string;
    title: string;
    status: string;
  };
  timestamp: string;
};

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

/**
 * Get message wrapper class based on sender
 */
export const getMessageWrapperClass = (sender: 'user' | 'bot'): string => {
  return `mb-8 ${sender === 'user' ? 'text-right' : 'text-left'}`;
};

/**
 * Get message flex container class based on sender
 */
export const getMessageFlexContainerClass = (sender: 'user' | 'bot'): string => {
  return `flex items-start gap-3 ${sender === 'user' ? 'flex-row-reverse justify-start' : 'flex-row'}`;
};

/**
 * Get avatar container class based on position
 */
export const getAvatarPositionClass = (isUser: boolean): string => {
  return `flex-shrink-0 ${isUser ? 'ml-2' : 'mr-2'}`;
};

/**
 * Get avatar inner container class based on sender and theme
 */
export const getAvatarInnerClass = (isUser: boolean, isDarkMode: boolean): string => {
  return `w-10 h-10 rounded-full flex items-center justify-center shadow-md ${isUser
    ? isDarkMode ? 'dark-active' : 'bg-gray-200'
    : isDarkMode ? 'dark-info-bg' : 'bg-blue-100'
  }`;
};

/**
 * Get user thumbnail class based on theme
 */
export const getUserThumbnailClass = (isDarkMode: boolean): string => {
  return isDarkMode ? 'dark-text' : 'text-gray-600';
};

/**
 * Get bot icon class based on theme
 */
export const getBotIconClass = (isDarkMode: boolean): string => {
  return isDarkMode ? 'dark-primary' : 'text-blue-600';
};

/**
 * Get typing indicator container class
 */
export const getTypingIndicatorClass = (): string => {
  return 'flex items-center';
};

/**
 * Get typing text class
 */
export const getTypingTextClass = (): string => {
  return 'text-base leading-relaxed';
};

/**
 * Get spinner animation style
 */
export const getSpinnerAnimationStyle = (): SpinnerAnimation => {
  return {
    rotate: 360
  };
};

/**
 * Get spinner transition
 */
export const getSpinnerTransition = (): SpinnerTransition => {
  return {
    duration: 1,
    repeat: Infinity,
    ease: "linear"
  };
};

/**
 * Get all message styles
 */
export const getMessageStyles = (isDarkMode: boolean, sender: 'user' | 'bot'): MessageStyles => {
  return {
    container: {
      base: `p-5 rounded-2xl max-w-[85%] md:max-w-2xl overflow-hidden break-words`,
      relative: `relative p-5 rounded-2xl max-w-[85%] md:max-w-2xl overflow-hidden break-words`,
    },
    wrapper: getMessageWrapperClass(sender),
    flexContainer: getMessageFlexContainerClass(sender),
    avatar: {
      container: getAvatarPositionClass(sender === 'user'),
      inner: getAvatarInnerClass(sender === 'user', isDarkMode),
      icon: sender === 'user' ? getUserThumbnailClass(isDarkMode) : getBotIconClass(isDarkMode)
    },
    content: {
      container: getMessageContainerClass(sender, isDarkMode),
      markdown: getMarkdownContentClass(isDarkMode),
      typing: {
        container: getTypingIndicatorClass(),
        text: getTypingTextClass(),
        spinner: {
          wrapper: getSpinnerWrapperClass(),
          icon: getSpinnerIconClass(),
          animation: getSpinnerAnimationStyle(),
          transition: getSpinnerTransition()
        }
      }
    },
    attachments: {
      container: getAttachmentsContainerClass(isDarkMode),
      header: {
        container: `flex items-center justify-between mb-2`,
        iconContainer: `flex items-center`,
        icon: `mr-2 ${isDarkMode ? 'dark-primary' : 'text-blue-600'}`,
        count: `text-sm font-medium ${isDarkMode ? 'dark-text' : 'text-gray-700'}`
      },
      list: getFileListContainerClass(),
      item: getFileItemClass(isDarkMode),
      itemHover: getFileItemHoverStyle(isDarkMode),
      icon: {
        container: `mr-3 text-lg`,
        pdf: `text-red-500`,
        word: `text-blue-500`,
        text: `text-yellow-500`,
        csv: `text-green-500`,
        excel: `text-green-600`,
        image: `text-purple-500`,
        default: `text-gray-500`
      },
      content: getFileContentContainerClass(),
      name: getFileNameClass(),
      size: getFileSizeClass(isDarkMode),
      actions: getFileActionsContainerClass(),
      actionButton: getFileButtonClass(isDarkMode),
      actionButtonHover: getFileActionButtonHoverStyle(isDarkMode),
      showMore: getShowMoreFilesClass(isDarkMode),
      toggleButton: `text-center p-2 rounded-lg text-sm ${isDarkMode ? 'dark-active dark-text hover:dark-hover' : 'bg-white text-gray-500 hover:bg-gray-100'} cursor-pointer transition-colors shadow-sm`,
      toggleButtonHover: { backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 1)' : 'rgba(243, 244, 246, 1)' }
    },
    imageDialog: {
      overlay: getImageConfirmationOverlayClass(),
      container: getImageConfirmationDialogClass(isDarkMode),
      title: getDialogTitleClass(isDarkMode),
      content: getDialogContentClass(isDarkMode),
      buttons: getDialogButtonContainerClass(),
      cancelButton: getCancelButtonClass(isDarkMode),
      confirmButton: getConfirmButtonClass(isDarkMode)
    },
    actions: {
      container: getActionButtonsContainerClass(),
      button: `p-2 rounded-full transition-colors`,
      reaction: getReactionButtonClass,
      pin: getPinButtonClass,
      citation: getCitationButtonClass
    },
    report: {
      container: getReportContainerClass(isDarkMode),
      title: getReportTitleClass(isDarkMode),
      buttons: getReportButtonContainerClass(),
      toggleButton: getReportToggleButtonClass(isDarkMode),
      downloadButton: getReportDownloadButtonClass(isDarkMode)
    },
    citations: {
      container: getCitationPanelClass(isDarkMode),
      title: getCitationTitleClass(isDarkMode),
      list: getCitationListClass(isDarkMode)
    },
    ticket: {
      container: getTicketInfoClass(isDarkMode),
      title: getTicketTitleClass(isDarkMode),
      status: getTicketStatusClass(isDarkMode)
    },
    timestamp: getTimestampClass(isDarkMode)
  };
};

/**
 * Get spinner wrapper class
 */
export const getSpinnerWrapperClass = (): string => {
  return 'ml-2';
};

/**
 * Get spinner icon class
 */
export const getSpinnerIconClass = (): string => {
  return 'text-sm opacity-70';
};

/**
 * Get image confirmation overlay class
 */
export const getImageConfirmationOverlayClass = (): string => {
  return 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-75';
};

/**
 * Get dialog title class based on theme
 */
export const getDialogTitleClass = (isDarkMode: boolean): string => {
  return `text-xl font-bold mb-3 ${isDarkMode ? 'dark-text' : 'text-gray-900'}`;
};

/**
 * Get dialog content class based on theme
 */
export const getDialogContentClass = (isDarkMode: boolean): string => {
  return `mb-4 ${isDarkMode ? 'dark-text' : 'text-gray-700'}`;
};

/**
 * Get dialog button container class
 */
export const getDialogButtonContainerClass = (): string => {
  return 'flex justify-end gap-3';
};

/**
 * Get cancel button class based on theme
 */
export const getCancelButtonClass = (isDarkMode: boolean): string => {
  return `px-4 py-2 rounded-lg ${isDarkMode ? 'dark-active dark-text hover:dark-hover' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'} transition-colors shadow-md`;
};

/**
 * Get confirm button class based on theme
 */
export const getConfirmButtonClass = (isDarkMode: boolean): string => {
  return `px-4 py-2 rounded-lg ${isDarkMode ? 'dark-primary-bg text-white hover:bg-blue-700' : 'bg-blue-500 text-white hover:bg-blue-600'} transition-colors shadow-md`;
};

/**
 * Get multimedia button class based on theme
 */
export const getMultimediaButtonClass = (isDarkMode: boolean): string => {
  return `mt-3 px-4 py-2 rounded-lg flex items-center ${isDarkMode
    ? 'dark-primary-bg hover:bg-blue-700 text-blue-100'
    : 'bg-blue-100 hover:bg-blue-200 text-blue-800'} transition-colors shadow-md`;
};

/**
 * Get action buttons container class
 */
export const getActionButtonsContainerClass = (): string => {
  return 'flex items-center gap-2 mt-4 justify-end';
};

/**
 * Get reaction button class based on theme and active state
 */
export const getReactionButtonClass = (isDarkMode: boolean, isActive: boolean | null, isThumbsUp: boolean): string => {
  if (isActive !== null) {
    return `p-2 rounded-full transition-colors ${isActive === isThumbsUp
      ? isDarkMode
        ? 'dark-success-bg text-white'
        : 'bg-green-100 text-green-600'
      : isDarkMode
        ? 'dark-error-bg text-white'
        : 'bg-red-100 text-red-600'
    }`;
  }
  return `p-2 rounded-full transition-colors ${isDarkMode
    ? 'dark-bg dark-text hover:dark-hover hover:dark-text'
    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
  }`;
};

/**
 * Get pin button class based on theme and pinned state
 */
export const getPinButtonClass = (isDarkMode: boolean, isPinned: boolean): string => {
  return `p-2 rounded-full transition-colors ${isPinned
    ? isDarkMode
      ? 'dark-primary-bg text-white'
      : 'bg-blue-100 text-blue-600'
    : isDarkMode
      ? 'dark-bg dark-text hover:dark-hover hover:dark-text'
      : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
  }`;
};

/**
 * Get file list container class
 */
export const getFileListContainerClass = (): string => {
  return 'space-y-2';
};

/**
 * Get file item animation style for hover
 */
export const getFileItemHoverStyle = (isDarkMode: boolean): FileItemHoverStyle => {
  return {
    scale: 1.02,
    backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 1)' : 'rgba(255, 255, 255, 1)',
    boxShadow: isDarkMode
      ? '0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 2px 4px -2px rgba(0, 0, 0, 0.1)'
      : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05)'
  };
};

/**
 * Get file content container class
 */
export const getFileContentContainerClass = (): string => {
  return 'ml-2 flex-grow min-w-0';
};

/**
 * Get file name class
 */
export const getFileNameClass = (): string => {
  return 'text-sm font-medium truncate';
};

/**
 * Get file size class based on theme
 */
export const getFileSizeClass = (isDarkMode: boolean): string => {
  return `text-xs ${isDarkMode ? 'dark-text' : 'text-gray-500'}`;
};

/**
 * Get file actions container class
 */
export const getFileActionsContainerClass = (): string => {
  return 'flex items-center';
};

/**
 * Get file action button hover style
 */
export const getFileActionButtonHoverStyle = (isDarkMode: boolean): FileActionButtonHoverStyle => {
  return { scale: 1.1, color: isDarkMode ? '#3B82F6' : '#2563EB' };
};

/**
 * Get file action icon class based on theme
 */
export const getFileActionIconClass = (isDarkMode: boolean): string => {
  return isDarkMode ? 'dark-text' : 'text-gray-500';
};

/**
 * Get show more files button class based on theme
 */
export const getShowMoreFilesClass = (isDarkMode: boolean): string => {
  return `text-xs px-3 py-1 rounded-lg ${isDarkMode ? 'dark-active dark-primary hover:dark-hover' : 'bg-gray-200 text-blue-600 hover:bg-gray-300'} transition-colors`;
};

/**
 * Get paperclip icon class based on theme
 */
export const getPaperclipIconClass = (isDarkMode: boolean): string => {
  return `mr-2 ${isDarkMode ? 'dark-primary' : 'text-blue-600'}`;
};

/**
 * Get attachment count class based on theme
 */
export const getAttachmentCountClass = (isDarkMode: boolean): string => {
  return `text-sm font-medium ${isDarkMode ? 'dark-text' : 'text-gray-700'}`;
};

/**
 * Get more files indicator class based on theme
 */
export const getMoreFilesIndicatorClass = (isDarkMode: boolean): string => {
  return `text-center p-2 rounded-lg text-sm ${isDarkMode ? 'dark-active dark-text hover:dark-hover' : 'bg-white text-gray-500 hover:bg-gray-100'} cursor-pointer transition-colors shadow-sm`;
};

/**
 * Get report title class based on theme
 */
export const getReportTitleClass = (isDarkMode: boolean): string => {
  return `text-xl font-bold flex items-center ${isDarkMode ? 'dark-primary' : 'text-blue-600'}`;
};

/**
 * Get report button container class
 */
export const getReportButtonContainerClass = (): string => {
  return 'flex gap-2';
};

/**
 * Get report toggle button class based on theme
 */
export const getReportToggleButtonClass = (isDarkMode: boolean): string => {
  return `p-2 rounded-full ${isDarkMode ? 'dark-active dark-text hover:dark-hover' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`;
};

/**
 * Get report download button class based on theme
 */
export const getReportDownloadButtonClass = (isDarkMode: boolean): string => {
  return `p-2 rounded-full ${isDarkMode ? 'dark-active dark-text hover:dark-hover' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`;
};

/**
 * Get citation button class based on theme and active state
 */
export const getCitationButtonClass = (isDarkMode: boolean, isActive: boolean): string => {
  return `p-2 rounded-full ${isDarkMode
    ? `bg-gray-700 ${isActive ? 'text-blue-400' : 'text-gray-300'} hover:bg-gray-600`
    : `bg-gray-200 ${isActive ? 'text-blue-600' : 'text-gray-600'} hover:bg-gray-300`
  }`;
};

/**
 * Get citation title class based on theme
 */
export const getCitationTitleClass = (isDarkMode: boolean): string => {
  return `text-sm font-bold mb-2 ${isDarkMode ? 'dark-primary' : 'text-blue-600'}`;
};

/**
 * Get citation list class based on theme
 */
export const getCitationListClass = (isDarkMode: boolean): string => {
  return `list-disc pl-5 text-sm ${isDarkMode ? 'dark-text' : 'text-gray-600'} space-y-1`;
};

/**
 * Get ticket title class based on theme
 */
export const getTicketTitleClass = (isDarkMode: boolean): string => {
  return `text-sm font-medium ${isDarkMode ? 'dark-success' : 'text-green-600'}`;
};

/**
 * Get ticket status class based on theme
 */
export const getTicketStatusClass = (isDarkMode: boolean): string => {
  return `text-xs ${isDarkMode ? 'dark-text' : 'text-gray-500'}`;
};
