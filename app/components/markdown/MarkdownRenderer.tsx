'use client';

import React, { useEffect, useState } from 'react';
import { marked } from 'marked';
import type { Renderer, TokenizerThis } from 'marked';
import DOMPurify from 'dompurify';

interface MarkdownRendererProps {
  content: string;
  isDarkMode: boolean;
  onImageClick: (imageUrl: string) => void;
}

// Define interfaces based on marked's internal types
interface ImageToken {
  href: string;
  title: string | null;
  text: string;
}

interface LinkToken {
  href: string;
  title: string | null;
  tokens: Array<{ text: string }>;
}

interface CodeToken {
  text: string;
  lang?: string;
  escaped?: boolean;
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
    renderer.image = function({ href, title, text }: { href: string; title: string | null; text: string }): string {
      return `<div class="markdown-image" data-src="${href}" data-alt="${text || ''}" data-title="${title || ''}"></div>`;
    };

    renderer.link = function({ href, title, tokens }: { href: string; title?: string | null; tokens: Array<{ text: string }> }): string {
      // Extract the text from tokens if available. Fallback to empty string if not.
      const text = tokens && tokens.length > 0 ? tokens[0].text : '';
      return `<span class="markdown-link" data-href="${href}" data-title="${title || ''}">${text}</span>`;
    };

    renderer.code = function({ text, lang, escaped }: { text: string; lang?: string; escaped?: boolean }): string {
      return `<div class="markdown-code" data-code="${encodeURIComponent(text)}" data-language="${lang || ''}"></div>`;
    };

    try {
      // Set marked options
      const options = {
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

      // Handle both string and Promise<string> cases
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
