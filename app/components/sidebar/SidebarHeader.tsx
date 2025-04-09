'use client';

import React from 'react';
import { MdAdd, MdChevronLeft, MdChevronRight } from 'react-icons/md';

interface SidebarHeaderProps {
  isOpen: boolean;
  styles: any;
  onNewChat: () => void;
  onToggle: () => void;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  isOpen,
  styles,
  onNewChat,
  onToggle
}) => {
  return (
    <div className={styles.header.container}>
      {isOpen && (
        <div className="flex items-center justify-between w-full">
          <h2 className={styles.header.title}>
            <span className="mr-2">AseekBot</span>
          </h2>
          <button
            onClick={onNewChat}
            className={styles.header.newChatButton}
            aria-label="New Chat"
            title="New Chat"
          >
            <MdAdd size={24} />
          </button>
        </div>
      )}
      <button
        onClick={onToggle}
        className={styles.header.toggleButton}
        aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        {isOpen ? <MdChevronLeft size={24} /> : <MdChevronRight size={24} />}
      </button>
    </div>
  );
};

export default SidebarHeader;
