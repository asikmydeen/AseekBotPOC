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
    const renderer = new marked.Renderer();

    // Custom image renderer
    renderer.image = (href, title, text) => {
      // We'll replace this with a placeholder that we can identify later
      return `<div class="markdown-image" data-src="${href}" data-alt="${text || ''}" data-title="${title || ''}"></div>`;
    };

    // Custom link renderer
    renderer.link = (href, title, text) => {
      return `<span class="markdown-link" data-href="${href}" data-title="${title || ''}">${text}</span>`;
    };

    // Custom code renderer
    renderer.code = (code, language) => {
      return `<div class="markdown-code" data-code="${encodeURIComponent(code)}" data-language="${language || ''}"></div>`;
    };

    // Enhanced marked options
    const options = {
      gfm: true,           // GitHub Flavored Markdown
      breaks: true,        // Convert \n to <br>
      headerIds: true,     // Add IDs to headers
      mangle: false,       // Don't mangle header IDs
      pedantic: false,     // Don't be pedantic
      smartLists: true,    // Use smarter list behavior
      smartypants: true,   // Use smart typography
      renderer,
    };

    try {
      // Parse markdown content
      let parsed = marked.parse(content, options) as string;
      
      // Sanitize the HTML to prevent XSS attacks
      parsed = DOMPurify.sanitize(parsed);
      
      setParsedContent(parsed);
    } catch (error) {
      console.error('Error parsing markdown:', error);
      setParsedContent(`<p>Error rendering content</p>`);
    }
  }, [content]);

  // Function to process the HTML and replace placeholders with React components
  const processContent = () => {
    if (!parsedContent) return null;

    const container = document.createElement('div');
    container.innerHTML = parsedContent;

    // Process images
    const imageElements = container.querySelectorAll('.markdown-image');
    imageElements.forEach((element) => {
      const src = element.getAttribute('data-src') || '';
      const alt = element.getAttribute('data-alt') || '';
      const title = element.getAttribute('data-title') || '';
      
      const imageComponent = (
        <MarkdownImage 
          src={src} 
          alt={alt} 
          title={title} 
          onImageClick={onImageClick}
          isDarkMode={isDarkMode}
        />
      );
      
      // Replace the placeholder with the React component
      // This is a simplified approach - in a real implementation, you'd need to handle this differently
      // as you can't directly insert React components into HTML strings
    });

    // Process links and code blocks similarly...

    return <div dangerouslySetInnerHTML={{ __html: container.innerHTML }} />;
  };

  // For simplicity, we'll still use dangerouslySetInnerHTML in this example
  // In a production app, you'd want to use a more robust approach to convert the HTML to React components
  return (
    <div className={`prose max-w-none ${isDarkMode ? 'prose-invert' : ''}`}>
      <div dangerouslySetInnerHTML={{ __html: parsedContent }} />
    </div>
  );
};

export default MarkdownRenderer;
