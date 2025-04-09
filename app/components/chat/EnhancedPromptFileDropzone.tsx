"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUploadCloud, FiX, FiFile, FiFolder, FiRefreshCw } from 'react-icons/fi';
import { apiService } from '../../utils/apiService';
import { UploadedFile } from '../../types/shared';

interface EnhancedPromptFileDropzoneProps {
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

const EnhancedPromptFileDropzone: React.FC<EnhancedPromptFileDropzoneProps> = ({
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
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [requiredVariables, setRequiredVariables] = useState<string[]>([]);
  const [s3Files, setS3Files] = useState<any[]>([]);
  const [isLoadingS3Files, setIsLoadingS3Files] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Get the current prompt from localStorage if available
  useEffect(() => {
    try {
      const storedPrompt = localStorage.getItem('currentPrompt');
      if (storedPrompt) {
        const prompt = JSON.parse(storedPrompt);
        if (prompt && prompt.title) {
          setPromptTitle(prompt.title);

          // Parse variables from prompt content
          if (prompt.content) {
            const variableMatches = prompt.content.match(/\$\{([^}]+)\}/g) || [];
            const extractedVariables = variableMatches.map(match => match.substring(2, match.length - 1));
            const uniqueVariables = [...new Set(extractedVariables)];

            setRequiredVariables(uniqueVariables);

            // Initialize variables state
            const initialVariables: Record<string, string> = {};
            uniqueVariables.forEach(variable => {
              initialVariables[variable] = '';
            });
            setVariables(initialVariables);

            console.log('Extracted variables:', uniqueVariables);
          }
        }
      }
    } catch (error) {
      console.error('Error parsing stored prompt:', error);
    }
  }, []);

  // Fetch S3 files when component mounts
  useEffect(() => {
    fetchS3Files();
  }, []);

  const fetchS3Files = async () => {
    try {
      setIsLoadingS3Files(true);
      setError(null);

      const response = await apiService.getUserFiles();

      let files = [];
      // Handle different response formats
      if (Array.isArray(response)) {
        files = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        files = response.data;
      } else {
        console.warn('Unexpected response format from getUserFiles:', response);
        files = [];
      }

      // Sort files by date (newest first)
      files.sort((a, b) => {
        const dateA = a.uploadDate ? new Date(a.uploadDate).getTime() : 0;
        const dateB = b.uploadDate ? new Date(b.uploadDate).getTime() : 0;
        return dateB - dateA;
      });

      // Process files for display
      const processedFiles = files.map(file => ({
        ...file,
        // Store the original S3 URL in a separate property
        originalS3Url: file.s3Url || file.presignedUrl,
        // Extract just the file path without the query parameters
        s3Url: file.s3Url ? file.s3Url.split('?')[0] : (file.presignedUrl ? file.presignedUrl.split('?')[0] : '')
      }));

      setS3Files(processedFiles);
    } catch (error) {
      console.error('Error fetching S3 files:', error);
      setError('Failed to load your files. Please try again.');
    } finally {
      setIsLoadingS3Files(false);
    }
  };

  const handleFileSelect = (file: any) => {
    // Check if file is already in uploadedFiles
    const isAlreadySelected = uploadedFiles.some(f =>
      f.fileId === file.fileId || f.fileKey === file.fileKey
    );

    if (isAlreadySelected) {
      // Find the index and remove it
      const index = uploadedFiles.findIndex(f =>
        f.fileId === file.fileId || f.fileKey === file.fileKey
      );
      if (index !== -1) {
        removeFile(index);
      }
    } else {
      // Create a new file object to add
      const newFile: UploadedFile = {
        name: file.fileName,
        fileName: file.fileName,
        fileId: file.fileId,
        fileKey: file.fileKey,
        size: file.fileSize,
        type: file.fileType,
        url: file.s3Url,
        s3Url: file.s3Url,
        status: 'success',
        progress: 100
      };

      // Store the file in a custom event to be picked up by the parent
      const event = new CustomEvent('addExternalFile', { detail: newFile });
      window.dispatchEvent(event);
    }
  };

  const handleVariableChange = (variable: string, value: string) => {
    setVariables(prev => {
      const updated = {
        ...prev,
        [variable]: value
      };

      // Store variables in localStorage
      localStorage.setItem('promptVariables', JSON.stringify(updated));

      return updated;
    });
  };

  const formatVariableName = (name: string): string => {
    return name
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .replace(/_/g, ' '); // Replace underscores with spaces
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = () => {
    // Check if all required variables are filled
    const missingVariables = requiredVariables.filter(variable => !variables[variable]);
    if (missingVariables.length > 0) {
      setError(`Please fill in all required variables: ${missingVariables.map(formatVariableName).join(', ')}`);
      return;
    }

    // Store variables in localStorage for the parent component
    localStorage.setItem('promptVariables', JSON.stringify(variables));

    // Call the analyze action
    handleFileAction('analyze');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-full mb-4 px-2 sm:px-0"
    >
      {/* File Dropzone Section */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {promptTitle ? `Files for ${promptTitle}` : 'Upload Files'}
          </h3>
          <div>
            <label
              className={`cursor-pointer px-2 py-1 rounded text-xs ${isDarkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'}`}
            >
              <input {...getInputProps()} className="hidden" />
              Upload Local File
            </label>
          </div>
        </div>

        {uploadedFiles.length === 0 ? (
          <div
            {...getRootProps()}
            className={`border border-dashed rounded p-3 text-center cursor-pointer transition-all
              ${isDarkMode
                ? isDragActive
                  ? 'border-blue-400 bg-blue-900/20'
                  : 'border-gray-600 hover:border-blue-400'
                : isDragActive
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-400'
              }`}
          >
            <FiUploadCloud className={`mx-auto h-8 w-8 mb-1 ${isDragActive ? 'text-blue-500' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {isDragActive ? 'Drop files here...' : 'Drag files here or click to browse'}
            </p>
          </div>
        ) : (
          <div className={`rounded p-2 ${isDarkMode ? 'bg-gray-750' : 'bg-gray-50'}`}>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {uploadedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className={`flex items-center justify-between p-1.5 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-white'} border border-transparent`}
                >
                  <div className="flex items-center overflow-hidden">
                    <FiFile className={`mr-2 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} size={14} />
                    <div className="truncate">
                      <p className={`text-sm truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {file.name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className={`p-1 rounded-full ml-2 flex-shrink-0 ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                    disabled={isUploading}
                  >
                    <FiX size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                  </button>
                </div>
              ))}
            </div>

            {isUploading && (
              <div className="w-full h-1 bg-gray-300 rounded-full overflow-hidden mt-2">
                <motion.div
                  className={`h-full ${isDarkMode ? 'bg-blue-500' : 'bg-blue-600'}`}
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* S3 Files Section */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Select from S3 Files
          </h3>
          <div className="flex space-x-2">
            <label
              className={`cursor-pointer px-2 py-1 rounded text-xs ${isDarkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'}`}
            >
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    const file = e.target.files[0];
                    // Create a FormData object
                    const formData = new FormData();
                    formData.append('file', file);

                    // Upload the file
                    apiService.uploadFile(file)
                      .then(() => {
                        // Refresh the file list
                        fetchS3Files();
                      })
                      .catch(error => {
                        console.error('Error uploading file:', error);
                        setError('Failed to upload file. Please try again.');
                      });
                  }
                }}
                accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.jpg,.jpeg,.png"
              />
              Upload New
            </label>
            <button
              onClick={fetchS3Files}
              className={`px-2 py-1 rounded text-xs ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
              title="Refresh files"
            >
              <FiRefreshCw size={12} className="inline mr-1" />
              Refresh
            </button>
          </div>
        </div>

        {isLoadingS3Files ? (
          <div className={`flex justify-center items-center p-2 rounded ${isDarkMode ? 'bg-gray-750' : 'bg-gray-100'}`}>
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-sm">Loading...</span>
          </div>
        ) : s3Files.length === 0 ? (
          <div className={`p-2 text-center rounded ${isDarkMode ? 'bg-gray-750' : 'bg-gray-100'}`}>
            <p className="text-sm">No files found</p>
          </div>
        ) : (
          <div className={`p-2 rounded max-h-40 overflow-y-auto ${isDarkMode ? 'bg-gray-750' : 'bg-gray-100'}`}>
            <div className="space-y-1">
              {s3Files.slice(0, 10).map((file, index) => {
                const isSelected = uploadedFiles.some(f =>
                  f.fileId === file.fileId || f.fileKey === file.fileKey
                );

                return (
                  <div
                    key={file.fileId || file.fileKey || index}
                    className={`px-2 py-1 rounded cursor-pointer transition-all flex items-center ${
                      isSelected
                        ? isDarkMode
                          ? 'bg-blue-900/40 border border-blue-500'
                          : 'bg-blue-50 border border-blue-500'
                        : isDarkMode
                          ? 'bg-gray-700 hover:bg-gray-650 border-transparent'
                          : 'bg-white hover:bg-gray-50 border-transparent'
                    }`}
                    onClick={() => handleFileSelect(file)}
                  >
                    <FiFile size={14} className="mr-2 flex-shrink-0" />
                    <div className="truncate text-sm">{file.fileName}</div>
                    {isSelected && (
                      <div className="ml-auto bg-blue-500 rounded-full p-0.5">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })}
              {s3Files.length > 10 && (
                <div className="text-center text-xs mt-1 text-gray-500">
                  + {s3Files.length - 10} more files
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Variables Section */}
      {requiredVariables.length > 0 && (
        <div className="mb-4">
          <h3 className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Required Variables
          </h3>

          <div className={`p-2 rounded ${isDarkMode ? 'bg-gray-750' : 'bg-gray-100'}`}>
            <div className="space-y-2">
              {requiredVariables.map((variable) => (
                <div key={variable} className="flex flex-col">
                  <label className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {formatVariableName(variable)}
                  </label>
                  <input
                    type="text"
                    value={variables[variable] || ''}
                    onChange={(e) => handleVariableChange(variable, e.target.value)}
                    className={`w-full p-1.5 text-sm rounded ${
                      isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                    } border`}
                    placeholder={`Enter ${formatVariableName(variable).toLowerCase()}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className={`mt-2 p-1.5 text-xs rounded ${isDarkMode ? 'bg-red-900/20 text-red-300' : 'bg-red-100 text-red-700'}`}>
              {error}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => handleSubmit()}
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
  );
};

export default EnhancedPromptFileDropzone;
