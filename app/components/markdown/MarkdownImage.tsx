'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaExternalLinkAlt } from 'react-icons/fa';

interface MarkdownImageProps {
  src: string;
  alt: string;
  title?: string;
  onImageClick: (imageUrl: string) => void;
  isDarkMode: boolean;
}

const MarkdownImage: React.FC<MarkdownImageProps> = ({ 
  src, 
  alt, 
  title, 
  onImageClick,
  isDarkMode
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const containerStyles = `
    relative inline-block overflow-hidden rounded-md my-2 cursor-pointer
    ${isDarkMode ? 'shadow-md shadow-gray-800' : 'shadow-md shadow-gray-300'}
  `;

  const imageStyles = `
    max-w-full h-auto rounded-md transition-transform duration-300
    ${isHovered ? 'scale-[1.02]' : 'scale-100'}
  `;

  const overlayStyles = `
    absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center
    text-white font-medium opacity-0 transition-opacity duration-300
    ${isHovered ? 'opacity-100' : 'opacity-0'}
  `;

  const iconStyles = 'mr-2';

  return (
    <div 
      className={containerStyles}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onImageClick(src)}
      title={title || alt}
    >
      <img 
        src={src} 
        alt={alt || 'Image'} 
        className={imageStyles}
        data-full-url={src}
      />
      <div className={overlayStyles}>
        <FaExternalLinkAlt className={iconStyles} />
        Click to view
      </div>
    </div>
  );
};

export default MarkdownImage;
