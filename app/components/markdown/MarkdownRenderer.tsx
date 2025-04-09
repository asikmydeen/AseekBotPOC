'use client';

import React, { useEffect, useState } from 'react';
import { marked, Renderer } from 'marked';
import DOMPurify from 'dompurify';

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
    const renderer = new Renderer();

    // Override renderer methods with proper types from marked
    renderer.image = function({ href, title, text }: marked.Tokens.Image) {
      return `<div class="markdown-image" data-src="${href}" data-alt="${text || ''}" data-title="${title || ''}"></div>`;
    };

    renderer.link = function({ href, title, text }: marked.Tokens.Link) {
      return `<span class="markdown-link" data-href="${href}" data-title="${title || ''}">${text}</span>`;
    };

    renderer.code = function({ text, lang }: marked.Tokens.Code) {
      return `<div class="markdown-code" data-code="${encodeURIComponent(text)}" data-language="${lang || ''}"></div>`;
    };

    try {
      // Set marked options
      const options: marked.MarkedOptions = {
        renderer,
        gfm: true,
        breaks: true,
        pedantic: false,
        smartLists: true,
        smartypants: true
      };

      // Parse markdown content
      marked.setOptions(options);
      const parsed = marked.parse(content);
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
