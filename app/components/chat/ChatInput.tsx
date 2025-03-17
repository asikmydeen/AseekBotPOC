"use client";
import { useState, KeyboardEvent, ChangeEvent, FormEvent } from 'react';
import { MdSend } from 'react-icons/md';
import { FaPaperclip } from 'react-icons/fa';
import FileDropzone from './FileDropzone';
import { useDropzone } from 'react-dropzone';

interface UploadedFile {
  name: string;
  size: number;
  type: string;
}

interface ChatInputProps {
  inputHandler: (message: string) => void;
  isThinking: boolean;
  isDarkMode: boolean;
}

export default function ChatInput({ inputHandler, isThinking, isDarkMode }: ChatInputProps) {
  const [inputText, setInputText] = useState<string>('');
  const [isFileDropzoneVisible, setIsFileDropzoneVisible] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading] = useState<boolean>(false);

  const onDrop = (acceptedFiles: File[]) => {
    // Convert the accepted files to the UploadedFile format
    const newFiles = acceptedFiles.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type
    }));

    setUploadedFiles([...uploadedFiles, ...newFiles]);
    // Here you would typically handle the actual file upload to your server
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    }
  });

  const handleRemoveFile = (fileName: string) => {
    setUploadedFiles(uploadedFiles.filter(file => file.name !== fileName));
  };

  const toggleFileDropzone = () => {
    setIsFileDropzoneVisible(!isFileDropzoneVisible);
  };

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (inputText.trim() && !isThinking) {
      inputHandler(inputText);
      setInputText('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
  };

  return (
    <div className="flex flex-col">
      {isFileDropzoneVisible && (
        <FileDropzone
          getRootProps={getRootProps}
          getInputProps={getInputProps}
          isDragActive={isDragActive}
          isUploading={isUploading}
          isDarkMode={isDarkMode}
          uploadedFiles={uploadedFiles}
          onRemoveFile={handleRemoveFile}
          fileSizeLimit={10}
          initiallyExpanded={true}
        />
      )}
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          className={`w-full p-4 pr-24 rounded-lg resize-none focus:outline-none focus:ring-2 ${
            isDarkMode
              ? 'bg-gray-800 text-white border-gray-700 focus:ring-blue-500'
              : 'bg-white text-gray-900 border-gray-300 focus:ring-blue-600'
          } border transition-colors`}
          placeholder="Type your message here..."
          rows={1}
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isThinking}
          style={{ minHeight: '60px', maxHeight: '120px' }}
        />
        <div className="absolute right-3 bottom-3 flex items-center space-x-2">
          <button
            type="button"
            onClick={toggleFileDropzone}
            className={`p-2 rounded-full transition-colors ${
              isDarkMode
                ? 'text-gray-400 hover:text-gray-200 bg-gray-700 hover:bg-gray-600'
                : 'text-gray-500 hover:text-gray-700 bg-gray-200 hover:bg-gray-300'
            } ${isFileDropzoneVisible ? (isDarkMode ? 'bg-gray-600 text-blue-300' : 'bg-gray-300 text-blue-500') : ''}`}
            aria-label="Attach files"
          >
            <FaPaperclip size={18} />
          </button>
          <button
            type="submit"
            disabled={!inputText.trim() || isThinking}
            className={`p-2 rounded-full transition-colors ${
              !inputText.trim() || isThinking
                ? isDarkMode
                  ? 'text-gray-500 bg-gray-700'
                  : 'text-gray-400 bg-gray-200'
                : isDarkMode
                ? 'text-white bg-blue-600 hover:bg-blue-700'
                : 'text-white bg-blue-500 hover:bg-blue-600'
            }`}
            aria-label="Send message"
          >
            {isThinking ? (
              <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin border-white" />
            ) : (
              <MdSend size={20} />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
