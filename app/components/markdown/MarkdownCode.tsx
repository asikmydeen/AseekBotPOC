'use client';

import React from 'react';

interface MarkdownCodeProps {
  code: string;
  language?: string;
  isDarkMode: boolean;
}

const MarkdownCode: React.FC<MarkdownCodeProps> = ({ 
  code, 
  language,
  isDarkMode
}) => {
  const preStyles = `
    overflow-x-auto rounded-md p-4 my-4
    ${isDarkMode 
      ? 'bg-gray-800 text-gray-100' 
      : 'bg-gray-100 text-gray-800'}
  `;

  const codeStyles = `
    font-mono text-sm
    ${language ? `language-${language}` : ''}
  `;

  return (
    <pre className={preStyles}>
      <code className={codeStyles}>{code}</code>
    </pre>
  );
};

export default MarkdownCode;
