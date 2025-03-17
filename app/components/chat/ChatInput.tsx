"use client";
import { useState, KeyboardEvent, ChangeEvent, FormEvent } from 'react';
import { MdSend } from 'react-icons/md';
import { FaPaperclip } from 'react-icons/fa';

interface ChatInputProps {
  inputHandler: (message: string) => void;
  isThinking: boolean;
  isDarkMode: boolean;
  onFileUploadToggle?: () => void;
  showFileUpload?: boolean;
}

export default function ChatInput({
  inputHandler,
  isThinking,
  isDarkMode,
  onFileUploadToggle,
  showFileUpload = false
}: ChatInputProps) {
  const [inputText, setInputText] = useState<string>('');

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
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          className={`w-full p-4 pr-24 rounded-lg resize-none focus:outline-none focus:ring-2 ${isDarkMode
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
            onClick={onFileUploadToggle}
            className={`p-2 rounded-full transition-colors ${isDarkMode
              ? 'text-gray-400 hover:text-gray-200 bg-gray-700 hover:bg-gray-600'
              : 'text-gray-500 hover:text-gray-700 bg-gray-200 hover:bg-gray-300'
              } ${showFileUpload ? (isDarkMode ? 'bg-gray-600 text-blue-300' : 'bg-gray-300 text-blue-500') : ''}`}
            aria-label="Attach files"
          >
            <FaPaperclip size={18} />
          </button>
          <button
            type="submit"
            disabled={!inputText.trim() || isThinking}
            className={`p-2 rounded-full transition-colors ${!inputText.trim() || isThinking
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