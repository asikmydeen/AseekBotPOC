'use client';

import React from 'react';
import { MdHistory, MdAttachment, MdLightbulb, MdSettings } from 'react-icons/md';

interface SidebarTabsProps {
  activeTab: string;
  styles: any;
  onTabChange: (tab: string) => void;
  isDarkMode: boolean;
}

const SidebarTabs: React.FC<SidebarTabsProps> = ({
  activeTab,
  styles,
  onTabChange,
  isDarkMode
}) => {
  return (
    <div className={styles.tabs.container}>
      <button
        onClick={() => onTabChange('history')}
        className={styles.tabs.tab(activeTab === 'history', isDarkMode)}
        aria-label="Chat History"
        title="Chat History"
      >
        <MdHistory size={20} />
      </button>
      <button
        onClick={() => onTabChange('files')}
        className={styles.tabs.tab(activeTab === 'files', isDarkMode)}
        aria-label="Uploaded Files"
        title="Uploaded Files"
      >
        <MdAttachment size={20} />
      </button>
      <button
        onClick={() => onTabChange('prompts')}
        className={styles.tabs.tab(activeTab === 'prompts', isDarkMode)}
        aria-label="Saved Prompts"
        title="Saved Prompts"
      >
        <MdLightbulb size={20} />
      </button>
      <button
        onClick={() => onTabChange('settings')}
        className={styles.tabs.tab(activeTab === 'settings', isDarkMode)}
        aria-label="Settings"
        title="Settings"
      >
        <MdSettings size={20} />
      </button>
    </div>
  );
};

export default SidebarTabs;
