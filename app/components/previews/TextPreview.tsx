import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

interface TextPreviewProps {
  fileUrl: string;
}

const PreviewContainer = styled.div`
  width: 100%;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  margin: 10px 0;
  background-color: #f9f9f9;
`;

const TextContent = styled.pre`
  padding: 16px;
  margin: 0;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 400px;
  overflow-y: auto;
  font-family: monospace;
  font-size: 14px;
  line-height: 1.5;
`;

const LoadingMessage = styled.div`
  padding: 16px;
  text-align: center;
  color: #666;
`;

const ErrorMessage = styled.div`
  padding: 16px;
  text-align: center;
  color: #d32f2f;
`;

const TextPreview: React.FC<TextPreviewProps> = ({ fileUrl }) => {
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTextContent = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(fileUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch text file: ${response.status} ${response.statusText}`);
        }
        
        const text = await response.text();
        setTextContent(text);
      } catch (err) {
        console.error('Error fetching text file:', err);
        setError(err instanceof Error ? err.message : 'Failed to load text file');
      } finally {
        setIsLoading(false);
      }
    };

    if (fileUrl) {
      fetchTextContent();
    }
  }, [fileUrl]);

  return (
    <PreviewContainer>
      {isLoading && (
        <LoadingMessage>Loading text content...</LoadingMessage>
      )}
      
      {error && (
        <ErrorMessage>Error: {error}</ErrorMessage>
      )}
      
      {!isLoading && !error && textContent && (
        <TextContent>{textContent}</TextContent>
      )}
    </PreviewContainer>
  );
};

export default TextPreview;