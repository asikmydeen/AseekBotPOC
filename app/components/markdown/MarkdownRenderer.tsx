'use client';

import React, { useEffect, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

interface MarkdownRendererProps {
  content: string;
  isDarkMode: boolean;
  onImageClick: (imageUrl: string) => void;
}

// Use the correct types from marked
interface MarkedImage {
  href: string;
  title: string | null | undefined;
  text: string;
}

interface MarkedLink {
  href: string;
  title: string | null | undefined;
  text: string;
}

interface MarkedCode {
  text: string;
  lang?: string;
  escaped: boolean;
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
    renderer.image = function(href: string, title: string | null | undefined, text: string) {
      return `<div class="markdown-image" data-src="${href}" data-alt="${text || ''}" data-title="${title || ''}"></div>`;
    };

    renderer.link = function(href: string, title: string | null | undefined, text: string) {
      return `<span class="markdown-link" data-href="${href}" data-title="${title || ''}">${text}</span>`;
    };

    renderer.code = function(text: string, lang?: string, escaped?: boolean) {
      return `<div class="markdown-code" data-code="${encodeURIComponent(text)}" data-language="${lang || ''}"></div>`;
    };

    try {
      // Set marked options
      const options = {
        renderer: renderer,
        gfm: true,           // GitHub Flavored Markdown
        breaks: true,        // Convert \n to <br>
        pedantic: false,     // Don't be pedantic
        smartLists: true,    // Use smarter list behavior
        smartypants: true    // Use smart typography
      };

      // Parse markdown content
      const parsed = marked.parse(content, options);

      // Handle the case where parsed might be a Promise
      if (parsed instanceof Promise) {
        parsed.then(result => {
          setParsedContent(DOMPurify.sanitize(result));
        });
      } else {
        setParsedContent(DOMPurify.sanitize(parsed));
      }
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
