import React from 'react';
import styled from 'styled-components';

interface FileActionPromptProps {
  onAction: (action: string) => void;
}

const Container = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0;
`;

const ActionChip = styled.button`
  background-color: #f0f0f0;
  border: 1px solid #e0e0e0;
  border-radius: 16px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #e0e0e0;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  }
`;

const FileActionPrompt: React.FC<FileActionPromptProps> = ({ onAction }) => {
  const handleActionClick = (action: string) => {
    onAction(action);
  };

  return (
    <Container>
      <ActionChip onClick={() => handleActionClick('document-analysis')}>
        Perform Document Analysis
      </ActionChip>
      <ActionChip onClick={() => handleActionClick('bid-analysis')}>
        Perform Bid Document Analysis
      </ActionChip>
      <ActionChip onClick={() => handleActionClick('send-message')}>
        Send as Message
      </ActionChip>
      <ActionChip onClick={() => handleActionClick('cancel')}>
        Cancel Upload
      </ActionChip>
    </Container>
  );
};

export default FileActionPrompt;
