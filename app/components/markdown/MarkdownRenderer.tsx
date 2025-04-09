'use client';

import React, { useEffect, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import MarkdownImage from './MarkdownImage';
import MarkdownLink from './MarkdownLink';
import MarkdownCode from './MarkdownCode';

interface MarkdownRendererProps {
  content: string;
  isDarkMode: boolean;
  onImageClick: (imageUrl: string) => void;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  isDarkMode,
  onImageClick
}) => {
  const [parsedContent, setParsedContent] = useState<string>('');

  useEffect(() => {
    if (!content) {
      setParsedContent('');
      return;
    }

    // Configure custom renderer
    const renderer = {
      image(href: string, title: string | null, text: string) {
        return `<div class="markdown-image" data-src="${href}" data-alt="${text || ''}" data-title="${title || ''}"></div>`;
      },

      link(href: string, title: string | null, text: string) {
        return `<span class="markdown-link" data-href="${href}" data-title="${title || ''}">${text}</span>`;
      },

      code(code: string, language: string | undefined) {
        return `<div class="markdown-code" data-code="${encodeURIComponent(code)}" data-language="${language || ''}"></div>`;
      }
    };

    try {
      // Parse markdown content with custom renderer
      const parsed = marked(content, {
        renderer: renderer as marked.Renderer,
        gfm: true,           // GitHub Flavored Markdown
        breaks: true,        // Convert \n to <br>
        headerIds: true,     // Add IDs to headers
        mangle: false,       // Don't mangle header IDs
        pedantic: false,     // Don't be pedantic
        smartLists: true,    // Use smarter list behavior
        smartypants: true,   // Use smart typography
      });

      // Sanitize the HTML to prevent XSS attacks
      setParsedContent(DOMPurify.sanitize(parsed));
    } catch (error) {
      console.error('Error parsing markdown:', error);
      setParsedContent(`<p>Error rendering content</p>`);
    }
  }, [content]);

  // For now, we'll use dangerouslySetInnerHTML since that's what the current implementation uses
  // In a future improvement, we could parse the HTML and convert it to React components
  return (
    <div className={`prose max-w-none ${isDarkMode ? 'prose-invert' : ''}`}>
      <div dangerouslySetInnerHTML={{ __html: parsedContent }} />
    </div>
  );
};

export default MarkdownRenderer;
