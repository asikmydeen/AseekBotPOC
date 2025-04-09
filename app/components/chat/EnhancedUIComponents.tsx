// Enhanced Chat Input Component with animations and better UI
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiSend, FiPaperclip, FiMic } from 'react-icons/fi';
import TextareaAutosize from 'react-textarea-autosize';

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

  // Button pulse animation
  const pulseVariants = {
    inactive: { scale: 1 },
    active: {
      scale: [1, 1.05, 1],
      transition: {
        repeat: Infinity,
        repeatType: "mirror" as const,
        duration: 1.5
      }
    }
  };

  return (
    <div className="relative w-full mt-2 px-1 sm:px-0">
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`relative flex-1 transition-all duration-300 ${isFocused ? 'shadow-lg' : 'shadow-md'}`}
      >
        <form onSubmit={handleSubmit} className="relative">
          <TextareaAutosize
            ref={actualRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={isThinking ? "AseekBot is thinking..." : "Type your message here..."}
            disabled={isThinking}
            className={`w-full p-3 sm:p-4 pr-16 sm:pr-24 rounded-2xl resize-none transition-all duration-300 focus:outline-none text-sm sm:text-base ${
              isDarkMode
                ? 'dark-bg dark-text dark-border focus:ring-2 focus:ring-blue-500 dark-placeholder'
                : 'bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-blue-600 placeholder-gray-500'
            } ${isFocused ? 'border-transparent' : 'border'} ${
              isThinking ? 'opacity-70' : 'opacity-100'
            }`}
            minRows={1}
            maxRows={5}
            style={{
              lineHeight: '60px'
            }}
          />

          <div className="absolute right-2 sm:right-3 bottom-2 sm:bottom-3 flex items-center space-x-1 sm:space-x-2">
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onFileUploadClick}
              className={`p-2 sm:p-3 rounded-full transition-colors ${
                isDarkMode
                  ? 'dark-text-secondary hover:dark-text dark-bg-secondary hover:dark-bg-hover'
                  : 'text-gray-600 hover:text-gray-800 bg-gray-200 hover:bg-gray-300'
              } ${
                showFileDropzone ? (isDarkMode ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-700') : ''
              }`}
              aria-label="Attach files"
              disabled={isThinking}
            >
              <FiPaperclip size={20} />
            </motion.button>

            <motion.button
              type="submit"
              disabled={!inputValue.trim() || isThinking}
              variants={pulseVariants}
              animate={inputValue.trim() && !isThinking ? "active" : "inactive"}
              whileHover={{ scale: inputValue.trim() && !isThinking ? 1.05 : 1 }}
              whileTap={{ scale: inputValue.trim() && !isThinking ? 0.95 : 1 }}
              className={`p-2 sm:p-3 rounded-full transition-all duration-300 ${
                !inputValue.trim() || isThinking
                  ? isDarkMode
                    ? 'dark-bg dark-text-disabled cursor-not-allowed'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : isDarkMode
                    ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-md'
                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-md'
              }`}
              aria-label="Send message"
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
  const [promptTitle, setPromptTitle] = useState<string>('');

  // Get the current prompt from localStorage if available
  useEffect(() => {
    try {
      const storedPrompt = localStorage.getItem('currentPrompt');
      if (storedPrompt) {
        const prompt = JSON.parse(storedPrompt);
        if (prompt && prompt.title) {
          setPromptTitle(prompt.title);
        }
      }
    } catch (error) {
      console.error('Error parsing stored prompt:', error);
    }
  }, []);
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-full mb-4 px-2 sm:px-0"
    >
      {uploadedFiles.length === 0 ? (
        <div
          {...getRootProps()}
          className={`border-3 border-dashed rounded-2xl p-4 sm:p-6 md:p-8 mb-4 text-center cursor-pointer transition-all duration-300
            ${isDarkMode
              ? isDragActive
                ? 'border-blue-400 bg-blue-900/20 shadow-inner shadow-blue-900/20'
                : 'border-gray-600 hover:border-blue-400 shadow-lg'
              : isDragActive
                ? 'border-blue-400 bg-blue-50 shadow-inner shadow-blue-500/10'
                : 'border-gray-300 hover:border-blue-400 shadow-md'
            }`}
        >
          <input {...getInputProps()} />
          <motion.div
            initial={{ scale: 1 }}
            animate={isDragActive ? { scale: [1, 1.05, 1] } : { scale: 1 }}
            transition={{ duration: 0.5, repeat: isDragActive ? Infinity : 0 }}
          >
            <FiUploadCloud className={`mx-auto h-12 w-12 sm:h-16 sm:w-16 mb-2 sm:mb-4 ${isDragActive ? 'text-blue-500' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <p className={`text-base sm:text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              {isDragActive ? 'Drop files here...' : 'Drag and drop files here, or click to select files'}
            </p>
            <p className={`text-xs sm:text-sm mt-1 sm:mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Supported formats: PDF, DOCX, XLSX, CSV, TXT, JPG, PNG
            </p>
          </motion.div>
        </div>
      ) : (
        <motion.div
          className={`rounded-2xl p-3 sm:p-4 md:p-6 mb-4 ${isDarkMode ? 'bg-gray-750 shadow-xl' : 'bg-gray-50 shadow-lg'}`}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-center mb-4">
            <div>
              {promptTitle && (
                <h3 className={`text-sm sm:text-base font-medium mb-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
                  Prompt: {promptTitle}
                </h3>
              )}
              <h3 className={`text-base sm:text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                {uploadedFiles.length} {uploadedFiles.length === 1 ? 'file' : 'files'} selected
              </h3>
            </div>

            {isUploading && (
              <div className="w-full max-w-xs mx-auto h-2 bg-gray-300 rounded-full overflow-hidden mt-2 mb-3">
                <motion.div
                  className={`h-full ${isDarkMode ? 'bg-blue-500' : 'bg-blue-600'}`}
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}
          </div>

          <div className="grid gap-2 sm:gap-3 mb-3 sm:mb-4 max-h-40 sm:max-h-60 overflow-y-auto pr-1 sm:pr-2">
            {uploadedFiles.map((file, index) => (
              <motion.div
                key={`${file.name}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className={`flex items-center justify-between p-2 sm:p-3 rounded-xl ${
                  isDarkMode ? 'bg-gray-700 hover:bg-gray-650' : 'bg-white hover:bg-gray-50'
                } shadow-md transition-all duration-200`}
              >
                <div className="flex items-center">
                  <FiFile className={`mr-2 sm:mr-3 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} size={20} />
                  <div>
                    <p className={`font-medium truncate max-w-[150px] sm:max-w-[200px] md:max-w-xs text-sm sm:text-base ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {file.name}
                    </p>
                    <div className="flex items-center">
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatFileSize(file.size)}
                      </p>
                      {file.status === 'uploading' && (
                        <div className="flex items-center ml-2">
                          <div className="w-3 h-3 rounded-full border-2 border-t-transparent animate-spin mr-1 border-blue-500" />
                          <span className={`text-xs ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`}>
                            {file.progress ? `${Math.round(file.progress)}%` : 'Uploading...'}
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
                  className={`p-2 rounded-full ${
                    isDarkMode ? 'bg-gray-600 hover:bg-red-900 text-gray-300 hover:text-red-200' : 'bg-gray-200 hover:bg-red-100 text-gray-500 hover:text-red-500'
                  } transition-colors`}
                  aria-label="Remove file"
                >
                  <FiX size={16} />
                </motion.button>
              </motion.div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleFileAction('analyze')}
              className={`py-2 sm:py-2.5 px-4 sm:px-6 rounded-xl text-xs sm:text-sm font-medium shadow-md ${
                isDarkMode
                  ? promptTitle ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-blue-600 hover:bg-blue-500 text-white'
                  : promptTitle ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
              } transition-colors`}
              disabled={isUploading}
            >
              {promptTitle ? `Analyze with ${promptTitle}` : 'Analyze Files'}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleFileAction('send')}
              className={`py-2 sm:py-2.5 px-4 sm:px-6 rounded-xl text-xs sm:text-sm font-medium shadow-md ${
                isDarkMode
                  ? 'bg-green-600 hover:bg-green-500 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              } transition-colors`}
              disabled={isUploading}
            >
              Send with Message
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleFileAction('cancel')}
              className={`py-2 sm:py-2.5 px-4 sm:px-6 rounded-xl text-xs sm:text-sm font-medium shadow-md ${
                isDarkMode
                  ? 'bg-gray-600 hover:bg-gray-500 text-gray-200'
                  : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
              } transition-colors`}
              disabled={isUploading}
            >
              Cancel
            </motion.button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

// Enhanced Message Component Animation Variants
const messageAnimations = {
  // Message entry animation
  messageEntry: {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20,
        mass: 0.8
      }
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: 0.2
      }
    }
  },

  // Typing indicator animation
  typingIndicator: {
    dot1: {
      y: [0, -6, 0],
      transition: {
        repeat: Infinity,
        duration: 0.8,
        ease: "easeInOut"
      }
    },
    dot2: {
      y: [0, -6, 0],
      transition: {
        repeat: Infinity,
        duration: 0.8,
        delay: 0.2,
        ease: "easeInOut"
      }
    },
    dot3: {
      y: [0, -6, 0],
      transition: {
        repeat: Infinity,
        duration: 0.8,
        delay: 0.4,
        ease: "easeInOut"
      }
    }
  },

  // Button hover animations
  buttonHover: {
    hover: {
      scale: 1.1,
      transition: { duration: 0.2 }
    },
    tap: {
      scale: 0.9,
      transition: { duration: 0.2 }
    }
  },

  // For collapsible sections
  collapse: {
    hidden: {
      height: 0,
      opacity: 0,
      transition: {
        height: { duration: 0.3, ease: "easeInOut" },
        opacity: { duration: 0.2 }
      }
    },
    visible: {
      height: "auto",
      opacity: 1,
      transition: {
        height: { duration: 0.3, ease: "easeInOut" },
        opacity: { duration: 0.2, delay: 0.1 }
      }
    }
  }
};

// Enhanced Typing Indicator
const EnhancedTypingIndicator = ({ isDarkMode }: { isDarkMode: boolean }) => {
  return (
    <div className={`p-3 sm:p-4 rounded-2xl inline-flex items-center ${
      isDarkMode ? 'bg-gray-800 shadow-lg shadow-gray-900/50' : 'bg-white shadow-lg shadow-gray-200/50'
    }`}>
      <div className="font-semibold text-xs sm:text-sm mr-2 sm:mr-3">AseekBot is thinking</div>
      <div className="flex space-x-1.5">
        <motion.div
          variants={messageAnimations.typingIndicator}
          animate="dot1"
          className={`w-2.5 h-2.5 rounded-full ${isDarkMode ? 'bg-blue-400' : 'bg-blue-600'}`}
        />
        <motion.div
          variants={messageAnimations.typingIndicator}
          animate="dot2"
          className={`w-2.5 h-2.5 rounded-full ${isDarkMode ? 'bg-blue-400' : 'bg-blue-600'}`}
        />
        <motion.div
          variants={messageAnimations.typingIndicator}
          animate="dot3"
          className={`w-2.5 h-2.5 rounded-full ${isDarkMode ? 'bg-blue-400' : 'bg-blue-600'}`}
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
