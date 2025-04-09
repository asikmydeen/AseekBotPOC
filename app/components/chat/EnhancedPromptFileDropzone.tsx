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
      // Add the file to uploadedFiles
      // This is handled by the parent component through addExternalFile
      const newFile: UploadedFile = {
        name: file.fileName,
        fileName: file.fileName,
        fileId: file.fileId,
        fileKey: file.fileKey,
        size: file.fileSize,
        type: file.fileType,
        url: file.s3Url,
        s3Url: file.s3Url
      };
      
      // Store the file in localStorage to be picked up by the parent
      const currentFiles = JSON.parse(localStorage.getItem('selectedS3Files') || '[]');
      currentFiles.push(newFile);
      localStorage.setItem('selectedS3Files', JSON.stringify(currentFiles));
      
      // Reload the page to trigger the parent to pick up the file
      window.location.reload();
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
                      <p className={`text-sm font-medium truncate max-w-[200px] ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {file.name}
                      </p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className={`p-1.5 rounded-full ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors`}
                    disabled={isUploading}
                  >
                    <FiX size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
      
      {/* S3 Files Section */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className={`text-base sm:text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            Select from S3 Files
          </h3>
          <button
            onClick={fetchS3Files}
            className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
            title="Refresh files"
          >
            <FiRefreshCw size={18} />
          </button>
        </div>
        
        {isLoadingS3Files ? (
          <div className={`flex justify-center items-center p-4 rounded-lg ${isDarkMode ? 'bg-gray-750' : 'bg-gray-100'}`}>
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2">Loading files...</span>
          </div>
        ) : s3Files.length === 0 ? (
          <div className={`p-4 text-center rounded-lg ${isDarkMode ? 'bg-gray-750' : 'bg-gray-100'}`}>
            <p>No files found. Upload files first.</p>
          </div>
        ) : (
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-lg max-h-60 overflow-y-auto ${isDarkMode ? 'bg-gray-750' : 'bg-gray-100'}`}>
            {s3Files.map((file, index) => {
              const isSelected = uploadedFiles.some(f => 
                f.fileId === file.fileId || f.fileKey === file.fileKey
              );
              
              return (
                <div
                  key={file.fileId || file.fileKey || index}
                  className={`p-3 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? isDarkMode
                        ? 'bg-blue-900/40 border border-blue-500'
                        : 'bg-blue-50 border border-blue-500'
                      : isDarkMode
                        ? 'bg-gray-700 hover:bg-gray-650 border border-gray-600'
                        : 'bg-white hover:bg-gray-50 border border-gray-200'
                  }`}
                  onClick={() => handleFileSelect(file)}
                >
                  <div className="flex items-center">
                    <FiFolder size={20} className="mr-2" />
                    <div className="overflow-hidden">
                      <div className="truncate font-medium">{file.fileName}</div>
                      <div className="text-xs opacity-70">
                        {formatFileSize(file.fileSize)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Variables Section */}
      {requiredVariables.length > 0 && (
        <div className="mb-4">
          <h3 className={`text-base sm:text-lg font-semibold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>
            Required Information
          </h3>
          
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-750' : 'bg-gray-100'}`}>
            {requiredVariables.map((variable) => (
              <div key={variable} className="mb-3 last:mb-0">
                <label className={`block mb-1 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  {formatVariableName(variable)}
                </label>
                <input
                  type="text"
                  value={variables[variable] || ''}
                  onChange={(e) => handleVariableChange(variable, e.target.value)}
                  className={`w-full p-2 rounded-md ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } border`}
                  placeholder={`Enter ${formatVariableName(variable).toLowerCase()}`}
                />
              </div>
            ))}
          </div>
          
          {error && (
            <div className={`mt-2 p-2 rounded-md ${isDarkMode ? 'bg-red-900/20 text-red-300' : 'bg-red-100 text-red-700'}`}>
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
