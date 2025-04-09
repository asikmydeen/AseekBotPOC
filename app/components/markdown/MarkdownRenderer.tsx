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

    // Create a new renderer
    const renderer = new marked.Renderer();

    // Override renderer methods
    renderer.image = (href: string, title: string | null, text: string) => {
      return `<div class="markdown-image" data-src="${href}" data-alt="${text || ''}" data-title="${title || ''}"></div>`;
    };

    renderer.link = (href: string, title: string | null, text: string) => {
      return `<span class="markdown-link" data-href="${href}" data-title="${title || ''}">${text}</span>`;
    };

    renderer.code = (code: string, language?: string) => {
      return `<div class="markdown-code" data-code="${encodeURIComponent(code)}" data-language="${language || ''}"></div>`;
    };

    try {
      // Set marked options
      marked.setOptions({
        renderer: renderer,
        gfm: true,           // GitHub Flavored Markdown
        breaks: true,        // Convert \n to <br>
        mangle: false,       // Don't mangle header IDs
        pedantic: false,     // Don't be pedantic
        smartLists: true,    // Use smarter list behavior
        smartypants: true    // Use smart typography
      });

      // Parse markdown content
      const parsed = marked.parse(content);

      // Sanitize the HTML to prevent XSS attacks
      setParsedContent(DOMPurify.sanitize(parsed));
    } catch (error) {
      console.error('Error parsing markdown:', error);
      setParsedContent(`<p>Error rendering content</p>`);
    }
  }, [content]);

  return (
    <div className={`prose max-w-none ${isDarkMode ? 'prose-invert' : ''}`}>
      <div dangerouslySetInnerHTML={{ __html: parsedContent }} />
    </div>
  );
};

export default MarkdownRenderer;
