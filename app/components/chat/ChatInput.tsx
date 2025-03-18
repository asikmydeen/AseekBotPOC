"use client";
import { useState, KeyboardEvent, ChangeEvent, FormEvent, forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import { MdSend } from 'react-icons/md';
import { FaPaperclip } from 'react-icons/fa';

interface ChatInputProps {
  onSubmit: (message: string) => void;
  isThinking: boolean;
  isDarkMode: boolean;
  onFileUploadClick?: () => void;
  showFileDropzone?: boolean;
  onInputChange?: (text: string) => void;
  initialValue?: string;
  inputRef?: React.RefObject<HTMLTextAreaElement>;
  hasUploadedFiles?: boolean;
  clearFiles?: () => void;
}

const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(({
  onSubmit,
  isThinking,
  isDarkMode,
  onFileUploadClick,
  showFileDropzone = false,
  onInputChange,
  initialValue = '',
  hasUploadedFiles,
  clearFiles
}, ref) => {
  const [inputText, setInputText] = useState<string>(initialValue);
  const internalRef = useRef<HTMLTextAreaElement>(null);

  // Update input text when initialValue changes
  useEffect(() => {
    setInputText(initialValue);
  }, [initialValue]);

  // Forward the textarea ref
  useImperativeHandle<HTMLTextAreaElement | null, any>(ref, () => ({
    value: inputText,
    focus: () => internalRef.current?.focus(),
    current: { value: inputText }
  }));

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (inputText.trim() && !isThinking) {
      onSubmit(inputText);
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
    const newValue = e.target.value;
    setInputText(newValue);

    // Notify parent component of text changes
    if (onInputChange) {
      onInputChange(newValue);
    }
  };

  return (
    <div className="flex flex-col">
      <form onSubmit={handleSubmit} className="relative">
        <textarea
          ref={internalRef}
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
            onClick={onFileUploadClick}
            className={`p-2 rounded-full transition-colors ${isDarkMode
              ? 'text-gray-400 hover:text-gray-200 bg-gray-700 hover:bg-gray-600'
              : 'text-gray-500 hover:text-gray-700 bg-gray-200 hover:bg-gray-300'
              } ${showFileDropzone ? (isDarkMode ? 'bg-gray-600 text-blue-300' : 'bg-gray-300 text-blue-500') : ''}`}
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
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;