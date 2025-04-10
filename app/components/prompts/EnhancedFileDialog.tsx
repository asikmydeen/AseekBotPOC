"use client";
import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { FiX, FiFolder, FiFile, FiCheck, FiUpload, FiSearch, FiPlus } from 'react-icons/fi';
import { apiService } from '../../utils/apiService';
import { useTheme } from '../../hooks/useTheme';
import { UploadedFile } from '../../types/shared';
import { motion } from 'framer-motion';

interface EnhancedFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (files: UploadedFile[], variables: Record<string, string>) => void;
  promptId: string;
  promptTitle: string;
  requiredFileCount?: number;
  requiredVariables?: string[];
}

const EnhancedFileDialog: React.FC<EnhancedFileDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  promptId,
  promptTitle,
  requiredFileCount = 0,
  requiredVariables = []
}) => {
  const { isDarkMode } = useTheme();
  const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([]);
  const [s3Files, setS3Files] = useState<UploadedFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<UploadedFile[]>([]);
  const [isLoadingS3Files, setIsLoadingS3Files] = useState(false);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const fileListRef = useRef<HTMLDivElement>(null);

  // Initialize variables state based on requiredVariables
  useEffect(() => {
    const initialVariables: Record<string, string> = {};
    requiredVariables.forEach(variable => {
      initialVariables[variable] = '';
    });
    setVariables(initialVariables);
  }, [requiredVariables]);

  // File input ref for upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch S3 files when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchS3Files();
    }
  }, [isOpen]);

  // Filter files based on search term
  useEffect(() => {
    if (s3Files.length > 0) {
      if (searchTerm.trim() === '') {
        setFilteredFiles(s3Files);
      } else {
        const filtered = s3Files.filter(file =>
          file.fileName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredFiles(filtered);
      }
    }
  }, [s3Files, searchTerm]);

  // Auto-map files to variables based on file types and names
  useEffect(() => {
    if (selectedFiles.length > 0 && requiredVariables.length > 0) {
      const newVariables = { ...variables };
      let variablesUpdated = false;

      // Try to match files to variables based on patterns
      selectedFiles.forEach(file => {
        const fileName = file.fileName?.toLowerCase() || '';

        // Match SOW documents
        if ((fileName.includes('sow') || fileName.includes('scope') || fileName.includes('work')) &&
            requiredVariables.includes('sow_doc') && !newVariables['sow_doc']) {
          newVariables['sow_doc'] = file.name;
          variablesUpdated = true;
        }

        // Match bid documents
        else if (fileName.includes('bid') || fileName.includes('proposal') || fileName.includes('quote')) {
          // Find an empty bid_doc variable
          for (let i = 1; i <= 3; i++) {
            const varName = `bid_doc_${i}`;
            if (requiredVariables.includes(varName) && !newVariables[varName]) {
              newVariables[varName] = file.name;
              variablesUpdated = true;
              break;
            }
          }
        }
      });

      if (variablesUpdated) {
        setVariables(newVariables);
      }
    }
  }, [selectedFiles, requiredVariables]);

  const fetchS3Files = async () => {
    try {
      setIsLoadingS3Files(true);
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
      files.sort((a: any, b: any) => {
        const dateA = a.uploadDate ? new Date(a.uploadDate).getTime() : 0;
        const dateB = b.uploadDate ? new Date(b.uploadDate).getTime() : 0;
        return dateB - dateA;
      });

      // Create object URLs for each file instead of using signed S3 URLs
      const processedFiles = files.map((file: any) => ({
        ...file,
        // Store the original S3 URL in a separate property
        originalS3Url: file.s3Url || file.presignedUrl,
        // Extract just the file path without the query parameters
        s3Url: file.s3Url ? file.s3Url.split('?')[0] : (file.presignedUrl ? file.presignedUrl.split('?')[0] : '')
      }));

      setS3Files(processedFiles);
      setFilteredFiles(processedFiles);
    } catch (error) {
      console.error('Error fetching S3 files:', error);
      setError('Failed to load your files. Please try again.');
    } finally {
      setIsLoadingS3Files(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);
        formData.append('userId', 'test-user'); // Use the appropriate user ID

        // Show progress for current file
        const progress = Math.round(((i) / files.length) * 100);
        setUploadProgress(progress);

        // Upload the file
        await apiService.uploadFile(formData as unknown as File);
      }

      // Set progress to 100% when done
      setUploadProgress(100);

      // Refresh the file list
      await fetchS3Files();
    } catch (error) {
      console.error('Error uploading files:', error);
      setError('Failed to upload files. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Trigger file input click
  const triggerFileUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelect = (file: UploadedFile) => {
    // Check if file is already selected
    const isAlreadySelected = selectedFiles.some(f =>
      f.fileId === file.fileId || f.fileKey === file.fileKey
    );

    if (isAlreadySelected) {
      // Remove file if already selected
      setSelectedFiles(prev => prev.filter(f =>
        f.fileId !== file.fileId && f.fileKey !== file.fileKey
      ));
    } else {
      // Add file to selected files
      const newFile: UploadedFile = {
        name: file.fileName || 'Unnamed file',
        fileName: file.fileName,
        fileId: file.fileId,
        fileKey: file.fileKey,
        size: file.fileSize || 0,
        type: file.fileType || 'application/octet-stream',
        // Use the clean URL without query parameters
        url: file.s3Url || '',
        s3Url: file.s3Url || '',
        // Store the original URL for reference if needed
        originalS3Url: file.originalS3Url
      };

      setSelectedFiles(prev => [...prev, newFile]);
    }
  };

  const handleVariableChange = (variable: string, value: string) => {
    setVariables(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const handleVariableFileSelect = (variable: string, fileIndex: number) => {
    if (fileIndex >= 0 && fileIndex < selectedFiles.length) {
      handleVariableChange(variable, selectedFiles[fileIndex].name);
    }
  };

  const handleSubmit = () => {
    // Validate required files
    if (requiredFileCount > 0 && selectedFiles.length < requiredFileCount) {
      setError(`Please select at least ${requiredFileCount} file(s).`);
      return;
    }

    // Validate required variables
    const missingVariables = requiredVariables.filter(variable => !variables[variable]);
    if (missingVariables.length > 0) {
      setError(`Please fill in all required variables: ${missingVariables.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      onSubmit(selectedFiles, variables);
    } catch (error) {
      console.error('Error submitting files:', error);
      setError('Failed to submit files. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10000] p-4 overflow-hidden">
      <motion.div
        ref={dialogRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">{promptTitle}</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'
            }`}
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* Left side - File selection */}
          <div className="md:w-1/2 p-5 flex flex-col h-full overflow-hidden border-r border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                Select Files ({selectedFiles.length}/{requiredFileCount > 0 ? requiredFileCount : 'unlimited'})
              </h3>
              <div className="flex space-x-2">
                {/* Upload new file button */}
                <button
                  onClick={triggerFileUpload}
                  className={`p-2 rounded-full transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700 text-green-400' : 'hover:bg-gray-200 text-green-600'
                  }`}
                  title="Upload new file"
                >
                  <FiPlus size={18} />
                </button>

                {/* Refresh files button */}
                <button
                  onClick={fetchS3Files}
                  className={`p-2 rounded-full transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700 text-blue-400' : 'hover:bg-gray-200 text-blue-600'
                  }`}
                  title="Refresh file list"
                >
                  <FiUpload size={18} />
                </button>
              </div>

              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                multiple
              />
            </div>

            {/* Upload progress indicator */}
            {isUploading && (
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Uploading files...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className={`w-full h-2 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div
                    className="h-full rounded-full bg-green-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {/* Search bar */}
            <div className={`flex items-center mb-4 p-2 rounded-lg ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <FiSearch className="mr-2 text-gray-500" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full bg-transparent border-none focus:outline-none ${
                  isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>

            {/* File list */}
            <div
              ref={fileListRef}
              className="flex-1 overflow-y-auto pr-2 custom-scrollbar"
            >
              {isLoadingS3Files ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <FiFolder size={48} className="mb-4 opacity-50" />
                  <p className="text-gray-500">No files found</p>
                  <p className="text-sm text-gray-400 mt-1">Upload files or try a different search</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {filteredFiles.map((file, index) => {
                    const isSelected = selectedFiles.some(f =>
                      f.fileId === file.fileId || f.fileKey === file.fileKey
                    );

                    return (
                      <motion.div
                        key={file.fileId || file.fileKey || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.03 }}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? isDarkMode
                              ? 'bg-blue-900/40 border border-blue-500'
                              : 'bg-blue-50 border border-blue-500'
                            : isDarkMode
                              ? 'bg-gray-750 hover:bg-gray-700 border border-gray-700'
                              : 'bg-white hover:bg-gray-50 border border-gray-200'
                        }`}
                        onClick={() => handleFileSelect(file)}
                      >
                        <div className="flex items-center">
                          <div className={`mr-3 p-2 rounded-lg ${
                            isSelected
                              ? 'bg-blue-500 text-white'
                              : isDarkMode
                                ? 'bg-gray-700 text-gray-300'
                                : 'bg-gray-100 text-gray-500'
                          }`}>
                            {isSelected ? <FiCheck size={18} /> : <FiFile size={18} />}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="truncate font-medium">{file.fileName}</div>
                            <div className="text-xs opacity-70 flex items-center mt-1">
                              <span className="mr-2">{formatFileSize(file.fileSize || 0)}</span>
                              <span className="text-gray-400">•</span>
                              <span className="ml-2">{formatDate(file.uploadDate || '')}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right side - Variables */}
          <div className="md:w-1/2 p-5 flex flex-col h-full overflow-hidden">
            <h3 className="text-lg font-medium mb-4">Required Information</h3>

            {error && (
              <div className={`p-3 mb-4 rounded-md ${
                isDarkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-800'
              }`}>
                {error}
              </div>
            )}

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {requiredVariables.length > 0 ? (
                <div className="space-y-4">
                  {requiredVariables.map((variable) => (
                    <div key={variable} className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className={`px-4 py-2 ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                      }`}>
                        <label className="block font-medium">
                          {formatVariableName(variable)}
                        </label>
                      </div>
                      <div className="p-4">
                        <input
                          type="text"
                          value={variables[variable] || ''}
                          onChange={(e) => handleVariableChange(variable, e.target.value)}
                          className={`w-full p-2 rounded-md mb-2 ${
                            isDarkMode
                              ? 'bg-gray-800 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'
                          } border`}
                          placeholder={`Enter ${formatVariableName(variable).toLowerCase()}`}
                        />

                        {/* File selector for variables */}
                        {selectedFiles.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-500 mb-2">Or select from your files:</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedFiles.map((file, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleVariableFileSelect(variable, idx)}
                                  className={`text-xs px-2 py-1 rounded-md truncate max-w-[150px] ${
                                    variables[variable] === file.name
                                      ? isDarkMode
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-blue-500 text-white'
                                      : isDarkMode
                                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                  }`}
                                >
                                  {file.fileName}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-center">
                  <p className="text-gray-500">No variables required</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end items-center p-5 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-md mr-3 ${
              isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
            }`}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={`px-4 py-2 rounded-md ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-500 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : 'Submit'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Helper function to format variable names
const formatVariableName = (variable: string): string => {
  return variable
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase());
};

// Helper function to format date
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Unknown date';

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (e) {
    return 'Invalid date';
  }
};

export default EnhancedFileDialog;
