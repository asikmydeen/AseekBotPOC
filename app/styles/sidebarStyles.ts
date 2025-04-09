'use client';

import { CSSProperties } from 'react';

/**
 * Extends the standard CSSProperties type to allow custom CSS variable names
 * that are not part of the default CSSProperties type (like --sidebar-width-open).
 */
interface CustomCSSProperties extends CSSProperties {
  [property: string]: string | number | undefined;
}

// Define animation variants
export const sidebarAnimationVariants = {
  open: (isDarkMode: boolean) => ({
    transform: 'translateX(0%)',
    width: 'var(--sidebar-width-open, 300px)',
    opacity: 1,
    backgroundColor: isDarkMode ? 'var(--dark-bg-color, #121212)' : 'var(--light-bg, #ffffff)'
  }),
  closed: (isDarkMode: boolean) => ({
    width: 'var(--sidebar-width-closed, 60px)',
    transform: 'translateX(0%)',
    opacity: 1,
    backgroundColor: isDarkMode ? 'var(--dark-bg-color, #121212)' : 'var(--light-bg, #ffffff)'
  })
};

// Define transition properties
export const sidebarTransition = {
  type: "spring",
  stiffness: 400,
  damping: 40,
  backgroundColor: { duration: 0 }
};

// Define CSS variables
export const sidebarCSSVariables: CustomCSSProperties = {
  '--sidebar-width-open': 'min(100vw, 300px)',
  '--sidebar-width-closed': '60px',
  '--light-bg': '#ffffff',
  '--dark-bg-color': '#121212'
};

// Define interface for sidebar styles
export interface SidebarStyles {
  container: string;
  header: {
    container: string;
    title: string;
    newChatButton: string;
    toggleButton: string;
  };
  tabs: {
    container: string;
    tab: (isActive: boolean, isDarkMode: boolean) => string;
  };
  content: {
    container: string;
    section: {
      container: string;
      header: string;
      title: string;
      addButton: string;
    };
  };
  files: {
    container: string;
    list: string;
    item: string;
    itemContent: string;
    itemIndex: string;
    iconContainer: string;
    fileInfo: string;
    fileName: string;
    fileSize: string;
    actionsContainer: string;
    actionButton: string;
    emptyText: string;
  };
  settings: {
    container: string;
    section: string;
    sectionTitle: string;
    themeButton: string;
    accountContainer: string;
    accountIcon: string;
    accountInfo: string;
    accountName: string;
    accountEmail: string;
    helpLink: string;
    aboutContainer: string;
    aboutText: string;
  };
  overlay: string;
}

/**
 * Get sidebar container class
 */
export const getSidebarContainerClass = (isDarkMode: boolean): string => {
  return `h-screen ${isDarkMode ? 'dark-bg dark-text' : 'light-bg text-gray-800'} border-r ${isDarkMode ? 'dark-border' : 'border-gray-200'} overflow-hidden fixed left-0 top-0 z-50`;
};

/**
 * Get sidebar header container class
 */
export const getSidebarHeaderClass = (isDarkMode: boolean): string => {
  return `h-16 flex items-center justify-between px-4 border-b ${isDarkMode ? 'dark-border' : 'border-gray-200'}`;
};

/**
 * Get sidebar header title class
 */
export const getSidebarHeaderTitleClass = (): string => {
  return 'text-xl font-bold flex items-center';
};

/**
 * Get new chat button class
 */
export const getNewChatButtonClass = (isDarkMode: boolean): string => {
  return `p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-800 dark-text' : 'hover:bg-gray-100 text-gray-800'}`;
};

/**
 * Get sidebar toggle button class
 */
export const getSidebarToggleButtonClass = (isDarkMode: boolean): string => {
  return `p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'}`;
};

/**
 * Get sidebar tabs container class
 */
export const getSidebarTabsContainerClass = (isDarkMode: boolean): string => {
  return `grid grid-cols-4 ${isDarkMode ? 'dark-card-bg' : 'bg-gray-100'} p-1`;
};

/**
 * Get sidebar tab button class
 */
export const getSidebarTabClass = (isActive: boolean, isDarkMode: boolean): string => {
  return `p-2 rounded-md flex justify-center ${isActive ? (isDarkMode ? 'dark-active' : 'bg-white') : ''}`;
};

/**
 * Get sidebar content container class
 */
export const getSidebarContentContainerClass = (): string => {
  return 'h-[calc(100vh-112px)] overflow-y-auto p-2 sm:p-3 md:p-4';
};

/**
 * Get section container class
 */
export const getSectionContainerClass = (): string => {
  return '';
};

/**
 * Get section header class
 */
export const getSectionHeaderClass = (): string => {
  return 'flex items-center mb-3';
};

/**
 * Get section title class
 */
export const getSectionTitleClass = (): string => {
  return 'font-semibold text-lg';
};

/**
 * Get add button class
 */
export const getAddButtonClass = (isDarkMode: boolean): string => {
  return `p-1.5 rounded-md ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-700'}`;
};

/**
 * Get files list container class
 */
export const getFilesListContainerClass = (): string => {
  return 'space-y-2';
};

/**
 * Get file item class
 */
export const getFileItemClass = (isDarkMode: boolean): string => {
  return `p-2 md:p-3 rounded-lg transition-all duration-200 ${isDarkMode ? 'dark-card-bg hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`;
};

/**
 * Get file item content class
 */
export const getFileItemContentClass = (): string => {
  return 'flex flex-col';
};

/**
 * Get file item index class
 */
export const getFileItemIndexClass = (): string => {
  return 'mr-2 font-semibold text-sm';
};

/**
 * Get file icon container class
 */
export const getFileIconContainerClass = (isDarkMode: boolean): string => {
  return `mr-3 text-xl ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`;
};

/**
 * Get file info class
 */
export const getFileInfoClass = (): string => {
  return 'flex-1 truncate';
};

/**
 * Get file name class
 */
export const getFileNameClass = (): string => {
  return 'text-xs font-medium truncate';
};

/**
 * Get file size class
 */
export const getFileSizeClass = (): string => {
  return 'text-xs text-gray-500';
};

/**
 * Get file actions container class
 */
export const getFileActionsContainerClass = (): string => {
  return 'flex space-x-2 mt-2 ml-8';
};

/**
 * Get file action button class
 */
export const getFileActionButtonClass = (isDarkMode: boolean): string => {
  return `p-1.5 rounded-md ${isDarkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-300 text-gray-700'}`;
};

/**
 * Get empty files text class
 */
export const getEmptyFilesTextClass = (isDarkMode: boolean): string => {
  return `text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`;
};

/**
 * Get settings section class
 */
export const getSettingsSectionClass = (isDarkMode: boolean): string => {
  return `p-2 md:p-3 rounded-lg ${isDarkMode ? 'dark-card-bg' : 'bg-gray-100'}`;
};

/**
 * Get settings section title class
 */
export const getSettingsSectionTitleClass = (): string => {
  return 'text-sm font-medium mb-2';
};

/**
 * Get theme button class
 */
export const getThemeButtonClass = (isDarkMode: boolean): string => {
  return `px-3 py-2 rounded-md flex items-center ${isDarkMode ? 'dark-active hover:bg-gray-600' : 'bg-white hover:bg-gray-200 border border-gray-300'}`;
};

/**
 * Get account container class
 */
export const getAccountContainerClass = (): string => {
  return 'flex items-center';
};

/**
 * Get account icon class
 */
export const getAccountIconClass = (isDarkMode: boolean): string => {
  return `p-2 rounded-full ${isDarkMode ? 'dark-active' : 'bg-white border border-gray-300'} mr-3`;
};

/**
 * Get account info class
 */
export const getAccountInfoClass = (): string => {
  return '';
};

/**
 * Get account name class
 */
export const getAccountNameClass = (): string => {
  return 'text-sm font-medium';
};

/**
 * Get account email class
 */
export const getAccountEmailClass = (): string => {
  return 'text-xs text-gray-500';
};

/**
 * Get help link class
 */
export const getHelpLinkClass = (isDarkMode: boolean): string => {
  return `flex items-center p-2 rounded-md ${isDarkMode ? 'dark-active hover:bg-gray-600' : 'bg-white hover:bg-gray-200 border border-gray-300'}`;
};

/**
 * Get about container class
 */
export const getAboutContainerClass = (): string => {
  return 'text-xs text-gray-500';
};

/**
 * Get about text class
 */
export const getAboutTextClass = (): string => {
  return 'mb-1';
};

/**
 * Get sidebar overlay class
 */
export const getSidebarOverlayClass = (): string => {
  return 'fixed inset-0 bg-black bg-opacity-50 z-40';
};

/**
 * Get all sidebar styles
 */
export const getSidebarStyles = (isDarkMode: boolean): SidebarStyles => {
  return {
    container: getSidebarContainerClass(isDarkMode),
    header: {
      container: getSidebarHeaderClass(isDarkMode),
      title: getSidebarHeaderTitleClass(),
      newChatButton: getNewChatButtonClass(isDarkMode),
      toggleButton: getSidebarToggleButtonClass(isDarkMode),
    },
    tabs: {
      container: getSidebarTabsContainerClass(isDarkMode),
      tab: getSidebarTabClass,
    },
    content: {
      container: getSidebarContentContainerClass(),
      section: {
        container: getSectionContainerClass(),
        header: getSectionHeaderClass(),
        title: getSectionTitleClass(),
        addButton: getAddButtonClass(isDarkMode),
      },
    },
    files: {
      container: '',
      list: getFilesListContainerClass(),
      item: getFileItemClass(isDarkMode),
      itemContent: getFileItemContentClass(),
      itemIndex: getFileItemIndexClass(),
      iconContainer: getFileIconContainerClass(isDarkMode),
      fileInfo: getFileInfoClass(),
      fileName: getFileNameClass(),
      fileSize: getFileSizeClass(),
      actionsContainer: getFileActionsContainerClass(),
      actionButton: getFileActionButtonClass(isDarkMode),
      emptyText: getEmptyFilesTextClass(isDarkMode),
    },
    settings: {
      container: '',
      section: getSettingsSectionClass(isDarkMode),
      sectionTitle: getSettingsSectionTitleClass(),
      themeButton: getThemeButtonClass(isDarkMode),
      accountContainer: getAccountContainerClass(),
      accountIcon: getAccountIconClass(isDarkMode),
      accountInfo: getAccountInfoClass(),
      accountName: getAccountNameClass(),
      accountEmail: getAccountEmailClass(),
      helpLink: getHelpLinkClass(isDarkMode),
      aboutContainer: getAboutContainerClass(),
      aboutText: getAboutTextClass(),
    },
    overlay: getSidebarOverlayClass(),
  };
};
