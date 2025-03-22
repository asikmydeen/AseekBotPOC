import React from 'react';

interface FileActionPromptProps {
  onAction: (action: string) => void;
  showDocumentAnalysisOption?: boolean;
}

const FileActionPrompt: React.FC<FileActionPromptProps> = ({
  onAction,
  showDocumentAnalysisOption = false
}) => {
  const handleActionClick = (action: string) => {
    onAction(action);
  };

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <button
        onClick={() => handleActionClick('preview-document')}
        className="px-5 py-2.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900 dark:hover:bg-amber-800
                  text-amber-800 dark:text-amber-100 rounded-full text-sm font-medium
                  transition-all duration-200 whitespace-nowrap shadow-sm hover:shadow-md
                  border-2 border-transparent"
      >
        Preview Document
      </button>
      {showDocumentAnalysisOption && (
        <button
          onClick={() => handleActionClick('document-analysis')}
          className="px-5 py-2.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900 dark:hover:bg-blue-800
                    text-blue-800 dark:text-blue-100 rounded-full text-sm font-medium
                    transition-all duration-200 whitespace-nowrap shadow-sm hover:shadow-md
                    border-2 border-transparent"
        >
          Perform Document Analysis
        </button>
      )}
      <button
        onClick={() => handleActionClick('bid-analysis')}
        className="px-5 py-2.5 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900 dark:hover:bg-purple-800
                  text-purple-800 dark:text-purple-100 rounded-full text-sm font-medium
                  transition-all duration-200 whitespace-nowrap shadow-sm hover:shadow-md
                  border-2 border-transparent"
      >
        Perform Bid Document Analysis
      </button>
      <button
        onClick={() => handleActionClick('send-message')}
        className="px-5 py-2.5 bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800
                  text-green-800 dark:text-green-100 rounded-full text-sm font-medium
                  transition-all duration-200 whitespace-nowrap shadow-sm hover:shadow-md
                  border-2 border-transparent"
      >
        Send as Message
      </button>
      <button
        onClick={() => handleActionClick('cancel')}
        className="px-5 py-2.5 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800
                  text-red-800 dark:text-red-100 rounded-full text-sm font-medium
                  transition-all duration-200 whitespace-nowrap shadow-sm hover:shadow-md
                  border-2 border-transparent"
      >
        Cancel Upload
      </button>
    </div>
  );
};

export default FileActionPrompt;
