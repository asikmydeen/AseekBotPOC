// app/components/chat/EnhancedUIComponents.tsx
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FiSend, FiPaperclip, FiMic, FiX, FiFile, FiUploadCloud, FiRefreshCw, FiXCircle } from 'react-icons/fi';
import TextareaAutosize from 'react-textarea-autosize';

// Enhanced Typing Indicator with improved colors
export const EnhancedTypingIndicator = ({ isDarkMode }: { isDarkMode: boolean }) => {
  return (
    <div className={`p-4 rounded-2xl inline-flex items-center ${isDarkMode ? 'bg-indigo-900/30 shadow-lg shadow-indigo-900/20' : 'bg-white shadow-lg shadow-gray-200/50'
      }`}>
      <div className={`font-semibold text-sm mr-3 ${isDarkMode ? 'text-indigo-200' : 'text-gray-700'}`}>
        AseekBot is thinking
      </div>
      <div className="flex space-x-1.5">
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
          className={`w-2.5 h-2.5 rounded-full ${isDarkMode ? 'bg-indigo-400' : 'bg-indigo-600'}`}
        />
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 0.8, delay: 0.2, ease: "easeInOut" }}
          className={`w-2.5 h-2.5 rounded-full ${isDarkMode ? 'bg-indigo-400' : 'bg-indigo-600'}`}
        />
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 0.8, delay: 0.4, ease: "easeInOut" }}
          className={`w-2.5 h-2.5 rounded-full ${isDarkMode ? 'bg-indigo-400' : 'bg-indigo-600'}`}
        />
      </div>
    </div>
  );
};

// Enhanced Progress Bar with more vibrant colors
export const EnhancedProgressBar = ({ progress, isDarkMode }: { progress: number; isDarkMode: boolean }) => {
  return (
    <div className={`w-full max-w-[250px] h-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'} rounded-full overflow-hidden mt-2 shadow-inner`}>
      <motion.div
        className={`h-full ${isDarkMode ? 'bg-indigo-500' : 'bg-indigo-600'}`}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.5 }}
      />
    </div>
  );
};

// Enhanced Async Status Indicator with better colors
export const EnhancedAsyncStatusIndicator = ({
  status,
  progress,
  isDarkMode,
  onRefresh,
  onCancel
}: {
  status: string,
  progress: number,
  isDarkMode: boolean,
  onRefresh: () => void,
  onCancel: () => void
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col rounded-xl ${isDarkMode ? 'bg-indigo-900/30' : 'bg-gray-100'} p-3 shadow-md mt-2`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className={`text-sm font-medium mr-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
            Status: <span className={`font-bold ${isDarkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>{status}</span>
          </span>
        </div>
        <div className="flex space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRefresh}
            className={`text-xs px-3 py-1.5 rounded-lg flex items-center ${isDarkMode ? 'bg-indigo-800 text-indigo-200 hover:bg-indigo-700' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}
          >
            <FiRefreshCw className="mr-1.5" size={14} />
            Refresh
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onCancel}
            className={`text-xs px-3 py-1.5 rounded-lg flex items-center ${isDarkMode ? 'bg-rose-900 text-rose-200 hover:bg-rose-800' : 'bg-rose-100 text-rose-700 hover:bg-rose-200'}`}
          >
            <FiXCircle className="mr-1.5" size={14} />
            Cancel
          </motion.button>
        </div>
      </div>
      <div className="mt-2">
        <EnhancedProgressBar progress={progress} isDarkMode={isDarkMode} />
      </div>
    </motion.div>
  );
};

// Animation variants for messages
export const messageAnimations = {
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

// Enhanced File Dropzone with better colors
export const EnhancedFileDropzone: React.FC<{
  getRootProps: any;
  getInputProps: any;
  isDragActive: boolean;
  isDarkMode: boolean;
  uploadedFiles: any[];
  removeFile: (index: number) => void;
  isUploading: boolean;
  progress: number;
  handleFileAction: (action: string) => void;
}> = ({
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
        className="w-full mb-4"
      >
        {uploadedFiles.length === 0 ? (
          <div
            {...getRootProps()}
            className={`border-3 border-dashed rounded-2xl p-8 mb-4 text-center cursor-pointer transition-all duration-300
            ${isDarkMode
                ? isDragActive
                  ? 'border-indigo-400 bg-indigo-900/20 shadow-inner shadow-indigo-900/20'
                  : 'border-gray-600 hover:border-indigo-400 shadow-lg'
                : isDragActive
                  ? 'border-indigo-400 bg-indigo-50 shadow-inner shadow-indigo-500/10'
                  : 'border-gray-300 hover:border-indigo-400 shadow-md'
              }`}
          >
            <input {...getInputProps()} />
            <motion.div
              initial={{ scale: 1 }}
              animate={isDragActive ? { scale: [1, 1.05, 1] } : { scale: 1 }}
              transition={{ duration: 0.5, repeat: isDragActive ? Infinity : 0 }}
            >
              <FiUploadCloud className={`mx-auto h-16 w-16 mb-4 ${isDragActive ? 'text-indigo-500' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
              <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                {isDragActive ? 'Drop files here...' : 'Drag and drop files here, or click to select files'}
              </p>
              <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Supported formats: PDF, DOCX, XLSX, CSV, TXT, JPG, PNG
              </p>
            </motion.div>
          </div>
        ) : (
          <motion.div
            className={`rounded-2xl p-6 mb-4 ${isDarkMode ? 'bg-indigo-900/20 shadow-xl' : 'bg-gray-50 shadow-lg'}`}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                {uploadedFiles.length} {uploadedFiles.length === 1 ? 'file' : 'files'} selected
              </h3>

              {isUploading && (
                <div className="w-full max-w-xs mx-auto h-2 bg-gray-300 rounded-full overflow-hidden mt-2 mb-3">
                  <motion.div
                    className={`h-full ${isDarkMode ? 'bg-indigo-500' : 'bg-indigo-600'}`}
                    initial={{ width: '0%' }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </div>

            <div className="grid gap-3 mb-4 max-h-60 overflow-y-auto pr-2">
              {uploadedFiles.map((file, index) => (
                <motion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className={`flex items-center justify-between p-3 rounded-xl ${isDarkMode ? 'bg-indigo-900/40 hover:bg-indigo-900/60' : 'bg-white hover:bg-gray-50'
                    } shadow-md transition-all duration-200`}
                >
                  <div className="flex items-center">
                    <FiFile className={`mr-3 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-500'}`} size={24} />
                    <div>
                      <p className={`font-medium truncate max-w-xs ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {file.name}
                      </p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => removeFile(index)}
                    className={`p-2 rounded-full ${isDarkMode ? 'bg-indigo-800/50 hover:bg-rose-900 text-gray-300 hover:text-rose-200' : 'bg-gray-200 hover:bg-rose-100 text-gray-500 hover:text-rose-500'
                      } transition-colors`}
                    aria-label="Remove file"
                  >
                    <FiX size={16} />
                  </motion.button>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleFileAction('analyze')}
                className={`py-2.5 px-6 rounded-xl text-sm font-medium shadow-md ${isDarkMode
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                  } transition-colors`}
                disabled={isUploading}
              >
                Analyze Files
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleFileAction('send')}
                className={`py-2.5 px-6 rounded-xl text-sm font-medium shadow-md ${isDarkMode
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  } transition-colors`}
                disabled={isUploading}
              >
                Send with Message
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleFileAction('cancel')}
                className={`py-2.5 px-6 rounded-xl text-sm font-medium shadow-md ${isDarkMode
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

// Enhanced Chat Input Component with better colors and autofocus
export const EnhancedChatInput: React.FC<{
  onSubmit: (message: string) => void;
  isThinking: boolean;
  isDarkMode: boolean;
  onFileUploadClick?: () => void;
  showFileDropzone?: boolean;
  onInputChange?: (text: string) => void;
  initialValue?: string;
  inputRef?: React.RefObject<HTMLTextAreaElement | null>;
  hasUploadedFiles?: boolean;
}> = ({
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

    // Auto-focus the input field on mount
    useEffect(() => {
      if (actualRef.current && !isThinking) {
        actualRef.current.focus();
      }
    }, [actualRef, isThinking]);

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
      <div className="relative w-full mt-2">
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
              className={`w-full p-4 pr-24 rounded-2xl resize-none transition-all duration-300 focus:outline-none ${isDarkMode
                  ? 'bg-indigo-900/30 text-white border-indigo-800 focus:ring-2 focus:ring-indigo-500 placeholder-indigo-300'
                  : 'bg-white text-gray-900 border-gray-300 focus:ring-2 focus:ring-indigo-600 placeholder-gray-500'
                } ${isFocused ? 'border-transparent' : 'border'} ${isThinking ? 'opacity-70' : 'opacity-100'
                }`}
              minRows={1}
              maxRows={5}
            />

            <div className="absolute right-3 bottom-3 flex items-center space-x-2">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onFileUploadClick}
                className={`p-3 rounded-full transition-colors ${isDarkMode
                    ? 'text-indigo-300 hover:text-white bg-indigo-800/70 hover:bg-indigo-700'
                    : 'text-indigo-600 hover:text-indigo-800 bg-indigo-100 hover:bg-indigo-200'
                  } ${showFileDropzone ? (isDarkMode ? 'bg-indigo-700 text-white' : 'bg-indigo-200 text-indigo-700') : ''
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
                className={`p-3 rounded-full transition-all duration-300 ${!inputValue.trim() || isThinking
                    ? isDarkMode
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-900/20'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-200/50'
                  }`}
                aria-label="Send message"
              >
                {isThinking ? (
                  <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin border-white" />
                ) : (
                  <FiSend size={20} />
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  };