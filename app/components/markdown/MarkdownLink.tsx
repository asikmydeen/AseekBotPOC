'use client';

import React from 'react';
import { FaExternalLinkAlt } from 'react-icons/fa';

interface MarkdownLinkProps {
  href: string;
  children: React.ReactNode;
  title?: string;
  isDarkMode: boolean;
}

const MarkdownLink: React.FC<MarkdownLinkProps> = ({ 
  href, 
  children, 
  title,
  isDarkMode
}) => {
  const linkStyles = `
    inline-flex items-center gap-1 
    ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}
    transition-colors duration-200
  `;

  const iconStyles = 'text-xs opacity-70';

  return (
    <a 
      href={href} 
      title={title || ''} 
      target="_blank" 
      rel="noopener noreferrer"
      className={linkStyles}
    >
      {children}
      <FaExternalLinkAlt className={iconStyles} />
    </a>
  );
};

export default MarkdownLink;
