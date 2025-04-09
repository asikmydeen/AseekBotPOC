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

interface MarkedImage {
  href: string;
  title: string | null;
  text: string;
}

interface MarkedLink {
  href: string;
  title: string | null;
  tokens: marked.Token[];
  text: string;
}

interface MarkedCode {
  text: string;
  lang: string | undefined;
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
    renderer.image = (params: MarkedImage) => {
      return `<div class="markdown-image" data-src="${params.href}" data-alt="${params.text || ''}" data-title="${params.title || ''}"></div>`;
    };

    renderer.link = (params: MarkedLink) => {
      return `<span class="markdown-link" data-href="${params.href}" data-title="${params.title || ''}">${params.text}</span>`;
    };

    renderer.code = (params: MarkedCode) => {
      return `<div class="markdown-code" data-code="${encodeURIComponent(params.text)}" data-language="${params.lang || ''}"></div>`;
    };

    try {
      // Set marked options
      const options: marked.MarkedOptions = {
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
