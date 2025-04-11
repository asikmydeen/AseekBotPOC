"use client";
import { useState, KeyboardEvent, ChangeEvent, FormEvent, forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import { MdSend } from 'react-icons/md';
import { FaPaperclip } from 'react-icons/fa';
import { getChatInputStyles } from '../../styles/chatStyles';

interface ChatInputProps {
  onSubmit: (message: string) => void;
  isThinking: boolean;
  isDarkMode: boolean;
  onFileUploadClick?: () => void;
  showFileDropzone?: boolean;
  onInputChange?: (text: string) => void;
  initialValue?: string;
  inputRef?: React.RefObject<HTMLTextAreaElement | null> | React.MutableRefObject<HTMLTextAreaElement | null>;
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

  // Get centralized styles
  const styles = getChatInputStyles(isDarkMode);

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <textarea
          ref={internalRef}
          className={styles.textarea}
          placeholder="Type your message here..."
          rows={1}
          value={inputText}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={isThinking}
          style={{ minHeight: '60px', maxHeight: '120px' }}
        />
        <div className={styles.buttonsContainer}>
          <button
            type="button"
            onClick={onFileUploadClick}
            className={showFileDropzone ? styles.fileButtonActive : styles.fileButton}
            aria-label="Attach files"
          >
            <FaPaperclip size={18} />
          </button>
          <button
            type="submit"
            disabled={!inputText.trim() || isThinking}
            className={!inputText.trim() || isThinking ? styles.sendButtonDisabled : styles.sendButton}
            aria-label="Send message"
          >
            <MdSend size={20} />
          </button>
        </div>
      </form>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;
