import React from 'react';
import { getFileActionPromptStyles } from '../../styles/chatStyles';
import { useTheme } from '../../hooks/useTheme';

interface FileActionPromptProps {
  onAction: (action: string) => void;
  showDocumentAnalysisOption?: boolean;
}

const FileActionPrompt: React.FC<FileActionPromptProps> = ({
  onAction,
  showDocumentAnalysisOption = false
}) => {
  const { isDarkMode } = useTheme();
  const styles = getFileActionPromptStyles();

  const handleActionClick = (action: string) => {
    onAction(action);
  };

  return (
    <div className={styles.container}>
      <button
        onClick={() => handleActionClick('preview-document')}
        className={styles.actionButton('preview', isDarkMode)}
      >
        Preview Document
      </button>
      {showDocumentAnalysisOption && (
        <button
          onClick={() => handleActionClick('document-analysis')}
          className={styles.actionButton('analyze', isDarkMode)}
        >
          Perform Document Analysis
        </button>
      )}
      <button
        onClick={() => handleActionClick('bid-analysis')}
        className={styles.actionButton('bid', isDarkMode)}
      >
        Perform Bid Document Analysis
      </button>
      <button
        onClick={() => handleActionClick('send-message')}
        className={styles.actionButton('send', isDarkMode)}
      >
        Send as Message
      </button>
      <button
        onClick={() => handleActionClick('cancel')}
        className={styles.actionButton('cancel', isDarkMode)}
      >
        Cancel Upload
      </button>
    </div>
  );
};

export default FileActionPrompt;
