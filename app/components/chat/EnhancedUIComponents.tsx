// Enhanced Chat Input Component with animations and better UI
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiSend, FiPaperclip, FiMic } from 'react-icons/fi';
import TextareaAutosize from 'react-textarea-autosize';
import { getEnhancedChatInputStyles, getEnhancedTypingIndicatorStyles, getEnhancedFileDropzoneStyles, messageAnimations } from '../../styles/chatStyles';
import { CHAT_UI_TEXT } from '../../constants/chatConstants';

interface EnhancedChatInputProps {
  onSubmit: (message: string) => void;
  isThinking: boolean;
  isDarkMode: boolean;
  onFileUploadClick?: () => void;
  showFileDropzone?: boolean;
  onInputChange?: (text: string) => void;
  initialValue?: string;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  hasUploadedFiles?: boolean;
}

const EnhancedChatInput: React.FC<EnhancedChatInputProps> = ({
  onSubmit,
  isThinking,
  isDarkMode,
  onFileUploadClick,
  showFileDropzone = false,
  onInputChange,
  initialValue = '',
  inputRef,
  hasUploadedFiles
}) => {
  const [inputValue, setInputValue] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const actualRef = inputRef || internalRef;

  // Update input value when initialValue changes
  useEffect(() => {
    setInputValue(initialValue);
  }, [initialValue]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (inputValue.trim() && !isThinking) {
      onSubmit(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Notify parent component of text changes
    if (onInputChange) {
      onInputChange(newValue);
    }
  };

  // Get centralized styles
  const styles = getEnhancedChatInputStyles(isDarkMode);

  return (
    <div className={styles.container}>
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`${styles.innerContainer} ${isFocused ? 'shadow-lg' : 'shadow-md'}`}
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          <TextareaAutosize
            ref={actualRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isThinking ? `${CHAT_UI_TEXT.TYPING_INDICATOR}...` : CHAT_UI_TEXT.TYPING_PLACEHOLDER}
            disabled={isThinking}
            className={`${styles.textarea} ${isFocused ? 'border-transparent' : 'border'} ${isThinking ? 'opacity-70' : 'opacity-100'}`}
            minRows={1}
            maxRows={5}
            style={{
              lineHeight: '60px'
            }}
          />

          <div className={styles.buttonsContainer}>
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onFileUploadClick}
              className={showFileDropzone ? styles.fileButtonActive : styles.fileButton}
              aria-label={CHAT_UI_TEXT.ARIA_ATTACH_FILES}
              disabled={isThinking}
            >
              <FiPaperclip size={20} />
            </motion.button>

            <motion.button
              type="submit"
              disabled={!inputValue.trim() || isThinking}
              variants={messageAnimations.pulseVariants}
              animate={inputValue.trim() && !isThinking ? "active" : "inactive"}
              whileHover={{ scale: inputValue.trim() && !isThinking ? 1.05 : 1 }}
              whileTap={{ scale: inputValue.trim() && !isThinking ? 0.95 : 1 }}
              className={styles.sendButton(!inputValue.trim() || isThinking, isDarkMode)}
              aria-label={CHAT_UI_TEXT.ARIA_SEND_MESSAGE}
            >
              <FiSend size={20} />
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
// Enhanced File Dropzone Component
import { FiUploadCloud, FiX, FiFile } from 'react-icons/fi';

interface EnhancedFileDropzoneProps {
  getRootProps: any;
  getInputProps: any;
  isDragActive: boolean;
  isDarkMode: boolean;
  uploadedFiles: any[];
  removeFile: (index: number) => void;
  isUploading: boolean;
  progress: number;
  handleFileAction: (action: string) => void;
}

const EnhancedFileDropzone: React.FC<EnhancedFileDropzoneProps> = ({
  getRootProps,
  getInputProps,
  isDragActive,
  isDarkMode,
  uploadedFiles,
  removeFile,
  isUploading,
  progress,
  handleFileAction
}) => {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = CHAT_UI_TEXT.FILE_SIZE_UNITS;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get centralized styles
  const styles = getEnhancedFileDropzoneStyles(isDarkMode);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={styles.container}
    >
      {uploadedFiles.length === 0 ? (
        <div
          {...getRootProps()}
          className={styles.dropzoneContainer(isDragActive)}
        >
          <input {...getInputProps()} />
          <motion.div
            initial={{ scale: 1 }}
            animate={isDragActive ? { scale: [1, 1.05, 1] } : { scale: 1 }}
            transition={{ duration: 0.5, repeat: isDragActive ? Infinity : 0 }}
          >
            <FiUploadCloud className={styles.uploadIcon(isDragActive)} />
            <p className={styles.dropzoneText}>
              {isDragActive ? CHAT_UI_TEXT.FILE_UPLOAD_DRAG_ACTIVE : CHAT_UI_TEXT.FILE_UPLOAD_DRAG_INACTIVE}
            </p>
            <p className={styles.dropzoneSubtext}>
              {CHAT_UI_TEXT.FILE_UPLOAD_SUPPORTED_FORMATS}
            </p>
          </motion.div>
        </div>
      ) : (
        <motion.div
          className={styles.fileContainer}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className={styles.fileHeader}>
            <h3 className={styles.fileTitle}>
              {uploadedFiles.length} {uploadedFiles.length === 1 ? 'file' : 'files'} selected
            </h3>

            {isUploading && (
              <div className={styles.progressBar}>
                <motion.div
                  className={styles.progressBarFill}
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}
          </div>

          <div className={styles.fileGrid}>
            {uploadedFiles.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={styles.fileItem}
              >
                <div className="flex items-center">
                  <FiFile className={styles.fileIcon} size={20} />
                  <div className={styles.fileDetails}>
                    <p className={styles.fileName}>
                      {file.name}
                    </p>
                    <div className="flex items-center">
                      <p className={styles.fileSize}>
                        {formatFileSize(file.size)}
                      </p>
                      {file.status === 'uploading' && (
                        <div className="flex items-center ml-2">
                          <div className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin mr-1 border-blue-500" />
                          <span className={styles.fileStatus}>
                            {file.progress ? `${Math.round(file.progress)}%` : CHAT_UI_TEXT.FILE_UPLOADING}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => removeFile(index)}
                  className={styles.fileRemoveButton}
                  aria-label={CHAT_UI_TEXT.ARIA_REMOVE_FILE}
                >
                  <FiX size={16} />
                </motion.button>
              </motion.div>
            ))}
          </div>

          <div className={styles.actionsContainer}>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleFileAction('analyze')}
              className={styles.actionButton('analyze', isDarkMode)}
              disabled={isUploading}
            >
              {CHAT_UI_TEXT.FILE_UPLOAD_ANALYZE_BUTTON}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleFileAction('send')}
              className={styles.actionButton('send', isDarkMode)}
              disabled={isUploading}
            >
              {CHAT_UI_TEXT.FILE_UPLOAD_SEND_BUTTON}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleFileAction('cancel')}
              className={styles.actionButton('cancel', isDarkMode)}
              disabled={isUploading}
            >
              {CHAT_UI_TEXT.FILE_UPLOAD_CANCEL_BUTTON}
            </motion.button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// Animation variants are now imported from chatStyles.ts

// Enhanced Typing Indicator
const EnhancedTypingIndicator = ({ isDarkMode }: { isDarkMode: boolean }) => {
  // Get centralized styles
  const styles = getEnhancedTypingIndicatorStyles(isDarkMode);

  return (
    <div className={styles.container}>
      <div className={styles.text}>{CHAT_UI_TEXT.TYPING_INDICATOR}</div>
      <div className={styles.dotsContainer}>
        <motion.div
          variants={messageAnimations.typingIndicator}
          animate="dot1"
          className={styles.dot}
        />
        <motion.div
          variants={messageAnimations.typingIndicator}
          animate="dot2"
          className={styles.dot}
        />
        <motion.div
          variants={messageAnimations.typingIndicator}
          animate="dot3"
          className={styles.dot}
        />
      </div>
    </div>
  );
};

export {
  EnhancedChatInput,
  EnhancedFileDropzone,
  EnhancedTypingIndicator,
  messageAnimations
};
