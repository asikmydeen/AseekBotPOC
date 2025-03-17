import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { Avatar, Box, Flex, Text, useColorModeValue, Icon, Button } from '@chakra-ui/react';
import { FaRobot, FaUser, FaCopy, FaCheck } from 'react-icons/fa';
import { useClipboard } from '@chakra-ui/react';

interface MessageProps {
  content: string;
  role: 'user' | 'assistant' | 'system';
  showAvatar?: boolean;
}

const Message: React.FC<MessageProps> = ({ content, role, showAvatar = true }) => {
  const bgColor = useColorModeValue(
    role === 'assistant' ? 'gray.100' : 'blue.50',
    role === 'assistant' ? 'gray.700' : 'blue.900'
  );
  const textColor = useColorModeValue('gray.800', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  const { hasCopied, onCopy } = useClipboard(content);
  const [showCopyButton, setShowCopyButton] = useState(false);
  const messageRef = useRef<HTMLDivElement>(null);

  // Process content for media links
  const processedContent = processContent(content);

  useEffect(() => {
    if (hasCopied) {
      const timer = setTimeout(() => {
        setShowCopyButton(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [hasCopied]);

  return (
    <Flex 
      p={4} 
      bg={bgColor} 
      borderRadius="md" 
      mb={4} 
      alignItems="flex-start"
      borderWidth="1px"
      borderColor={borderColor}
      position="relative"
      onMouseEnter={() => setShowCopyButton(true)}
      onMouseLeave={() => !hasCopied && setShowCopyButton(false)}
      ref={messageRef}
    >
      {showAvatar && (
        <Avatar 
          icon={role === 'assistant' ? <FaRobot /> : <FaUser />} 
          bg={role === 'assistant' ? 'teal.500' : 'blue.500'} 
          color="white"
          mr={4}
          size="sm"
        />
      )}
      <Box flex="1" color={textColor}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
          }}
        >
          {processedContent}
        </ReactMarkdown>
      </Box>
      {(showCopyButton || hasCopied) && role === 'assistant' && (
        <Button
          position="absolute"
          top={2}
          right={2}
          size="sm"
          onClick={onCopy}
          leftIcon={hasCopied ? <FaCheck /> : <FaCopy />}
        >
          {hasCopied ? 'Copied' : 'Copy'}
        </Button>
      )}
    </Flex>
  );
};

// Regular expressions for detecting media links
const markdownImageRegex = /!\[(.*?)\]\((https?:\/\/.*?\.(?:png|jpg|jpeg|gif|webp)(?:\?.*?)?)\)/g;
const plainImageUrlRegex = /(https?:\/\/\S+\.(?:png|jpg|jpeg|gif|webp)(?:\?\S*)?)/g;

/**
 * Detects and processes media links in the text
 * @param text The input text to process
 * @returns Object containing the modified text
 */
const detectMediaLinks = (text: string) => {
  // Start with the original text
  let modifiedText = text;
  
  // Process markdown image links
  // Example: ![alt text](https://example.com/image.png)
  for (const match of text.matchAll(markdownImageRegex)) {
    const [fullMatch, altText, imageUrl] = match;
    // For now, we're keeping markdown image links as they are
    // but we could enhance them with additional styling or functionality
    console.log(`Found markdown image: ${altText} at ${imageUrl}`);
  }
  
  // Process plain image URLs
  // Example: https://example.com/image.png
  for (const match of text.matchAll(plainImageUrlRegex)) {
    const [fullMatch] = match;
    // Convert plain image URLs to markdown format for better display
    // Skip URLs that are already part of markdown image syntax
    if (!text.includes(`](${fullMatch})`)) {
      const markdownReplacement = `![Image](${fullMatch})`;
      modifiedText = modifiedText.replace(fullMatch, markdownReplacement);
      console.log(`Converted plain URL to markdown: ${fullMatch}`);
    }
  }
  
  return { modifiedText };
};

const processContent = (content: string) => {
  // Process media links
  const { modifiedText } = detectMediaLinks(content);
  return modifiedText;
};

export default Message;