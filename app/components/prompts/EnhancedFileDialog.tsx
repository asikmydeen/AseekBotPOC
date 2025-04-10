"use client";
import React, { useState, useEffect, useRef, useCallback, ChangeEvent } from 'react';
import { FiX, FiFile, FiCheck, FiUpload, FiSearch, FiPlus } from 'react-icons/fi';
import { apiService } from '../../utils/apiService';
import { useTheme } from '../../hooks/useTheme';
import { UploadedFile } from '../../types/shared';
import { motion } from 'framer-motion';

interface VariableType {
  type: 'text' | 'file' | 'number' | 'date' | 'select';
  options?: string[];
}

interface EnhancedFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (files: UploadedFile[], variables: Record<string, string>) => void;
  promptId: string;
  promptTitle: string;
  requiredFileCount?: number;
  requiredVariables?: string[];
  variableTypes?: Record<string, VariableType>;
}

const EnhancedFileDialog: React.FC<EnhancedFileDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  promptId: _promptId, // Not currently used but kept for future use
  promptTitle,
  requiredFileCount = 0,
  requiredVariables = [],
  variableTypes = {}
}) => {
  const { isDarkMode } = useTheme();
  const [selectedFiles, setSelectedFiles] = useState<UploadedFile[]>([]);
  const [s3Files, setS3Files] = useState<UploadedFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<UploadedFile[]>([]);
  const [isLoadingS3Files, setIsLoadingS3Files] = useState(false);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [uiState, setUiState] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);

  // Detect variable types based on naming patterns
  const detectVariableTypes = useCallback(() => {
    const detectedTypes: Record<string, VariableType> = {};

    requiredVariables.forEach(variable => {
      // Start with default type
      let type: VariableType = { type: 'text' };

      // Detect file-type variables
      if (
        variable.includes('_doc') ||
        variable.includes('_file') ||
        variable.includes('document') ||
        variable.includes('attachment')
      ) {
        type = { type: 'file' };
      }
      // Detect number-type variables
      else if (
        variable.includes('_count') ||
        variable.includes('_number') ||
        variable.includes('_amount') ||
        variable.includes('_qty') ||
        variable.includes('_quantity')
      ) {
        type = { type: 'number' };
      }
      // Detect date-type variables
      else if (
        variable.includes('_date') ||
        variable.includes('_time') ||
        variable.includes('_day')
      ) {
        type = { type: 'date' };
      }

      // Override with provided types if available
      if (variableTypes[variable]) {
        type = variableTypes[variable];
      }

      detectedTypes[variable] = type;
    });

    return detectedTypes;
  }, [requiredVariables, variableTypes]);

  // Store detected variable types
  const [detectedVariableTypes, setDetectedVariableTypes] = useState<Record<string, VariableType>>({});

  // Initialize variables state based on requiredVariables
  useEffect(() => {
    if (isOpen) {
      console.log('Dialog opened, initializing variables:', requiredVariables);
      const initialVariables: Record<string, string> = {};
      requiredVariables.forEach(variable => {
        initialVariables[variable] = '';
      });
      setVariables(initialVariables);

      // Detect variable types
      const types = detectVariableTypes();
      setDetectedVariableTypes(types);
      console.log('Detected variable types:', types);

      // Validate form when dialog opens
      setTimeout(() => validateForm(initialVariables), 0);
    }
  }, [isOpen, requiredVariables, detectVariableTypes]);

  // File input ref for upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Fetch S3 files when dialog opens or when any dropdown is opened
  useEffect(() => {
    if (isOpen) {
      fetchS3Files();
    }
  }, [isOpen]);

  // Update filtered files when search terms change in dropdowns
  useEffect(() => {
    // Check if any dropdown search terms have changed
    const searchTerms = Object.keys(uiState).filter(key => key.endsWith('_search'));
    if (searchTerms.length > 0) {
      // We don't need to fetch files again, just use the existing s3Files
      console.log('Dropdown search terms updated');
    }
  }, [uiState]);

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

  // We're disabling auto-mapping to prevent the issue with the same file being filled for multiple fields
  useEffect(() => {
    // Just validate the form whenever files or variables change
    validateForm();
  }, [selectedFiles, requiredVariables, variables]);

  const fetchS3Files = async () => {
    try {
      setIsLoadingS3Files(true);
      const response = await apiService.getUserFiles();
      console.log('API response from getUserFiles:', response);

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

      // Filter out files without fileName
      const validFiles = files.filter((file: any) => file && file.fileName);
      if (validFiles.length < files.length) {
        console.warn(`Filtered out ${files.length - validFiles.length} files without fileName property`);
      }

      // Sort files by date (newest first)
      validFiles.sort((a: any, b: any) => {
        const dateA = a.uploadDate ? new Date(a.uploadDate).getTime() : 0;
        const dateB = b.uploadDate ? new Date(b.uploadDate).getTime() : 0;
        return dateB - dateA;
      });

      // Create object URLs for each file instead of using signed S3 URLs
      const processedFiles = validFiles.map((file: any) => ({
        ...file,
        // Store the original S3 URL in a separate property
        originalS3Url: file.s3Url || file.presignedUrl,
        // Extract just the file path without the query parameters
        s3Url: file.s3Url ? file.s3Url.split('?')[0] : (file.presignedUrl ? file.presignedUrl.split('?')[0] : '')
      }));

      console.log('Processed files for dropdown:', processedFiles);
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

        // Upload the file with a session ID
        const sessionId = `session-${Date.now()}`;
        const uploadResult = await apiService.uploadFile(file, sessionId);
        console.log(`File ${file.name} uploaded:`, uploadResult);
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
      setSelectedFiles(prev => {
        const newFiles = prev.filter(f =>
          f.fileId !== file.fileId && f.fileKey !== file.fileKey
        );

        // Clear any variables that were using this file
        const fileNameToRemove = file.fileName || file.name;
        setVariables(prev => {
          const newVariables = { ...prev };
          // Find and clear any variables that reference this file
          Object.keys(newVariables).forEach(key => {
            if (newVariables[key] === fileNameToRemove) {
              newVariables[key] = '';
              console.log(`Cleared variable ${key} that was using removed file ${fileNameToRemove}`);
            }
          });
          return newVariables;
        });

        // Validate form after removing file
        setTimeout(() => validateForm(), 0);
        return newFiles;
      });
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

      setSelectedFiles(prev => {
        const newFiles = [...prev, newFile];
        // Validate form after adding file
        setTimeout(() => validateForm(), 0);
        return newFiles;
      });
    }
  };

  const handleVariableChange = (variable: string, value: string) => {
    setVariables(prev => {
      const newVariables = {
        ...prev,
        [variable]: value
      };

      // Validate form after variable change
      validateForm(newVariables);

      return newVariables;
    });
  };

  // Validate the form and update isFormValid state
  const validateForm = (currentVariables: Record<string, string> = variables) => {
    // Check if all required variables are filled
    const missingVariables = requiredVariables.filter(variable => !currentVariables[variable]);

    // Check if we have enough files
    const hasEnoughFiles = requiredFileCount === 0 || selectedFiles.length >= requiredFileCount;

    // Form is valid if we have all required variables and enough files
    const valid = missingVariables.length === 0 && hasEnoughFiles;

    setIsFormValid(valid);
    return valid;
  };

  const handleVariableFileSelect = (variable: string, fileIndex: number | null) => {
    if (fileIndex === null) {
      // Clear the variable if null is passed
      handleVariableChange(variable, '');
    } else if (fileIndex >= 0 && fileIndex < selectedFiles.length) {
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

  // Reset state when dialog is closed
  useEffect(() => {
    if (!isOpen) {
      // Clear state when dialog is closed
      setSelectedFiles([]);
      setError(null);
      setSearchTerm('');
    }
  }, [isOpen]);

  // Handle click outside to close dialog or dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close dialog if clicking outside the dialog
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose();
        return;
      }

      // Close dropdowns if clicking outside their containers
      const openDropdowns = Object.keys(uiState).filter(key =>
        key.endsWith('_dropdown_open') && uiState[key] === true
      );

      if (openDropdowns.length > 0) {
        // Check if click was inside any dropdown container
        const dropdownContainers = document.querySelectorAll('.file-dropdown-container');
        let clickedInsideDropdown = false;

        dropdownContainers.forEach(container => {
          if (container.contains(event.target as Node)) {
            clickedInsideDropdown = true;
          }
        });

        // If click was outside all dropdowns, close them
        if (!clickedInsideDropdown) {
          const newState = { ...uiState };
          openDropdowns.forEach(key => {
            newState[key] = false;
          });
          setUiState(newState);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, uiState]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10000] p-4 overflow-hidden">
      <motion.div
        ref={dialogRef}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col ${
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
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 flex flex-col h-full overflow-hidden">
            {/* Upload controls */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                Required Information
                {requiredFileCount > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                    (Files: {selectedFiles.length}/{requiredFileCount})
                  </span>
                )}
              </h3>
              <div className="flex space-x-2">
                {/* Upload new file button */}
                <button
                  onClick={triggerFileUpload}
                  className={`flex items-center px-3 py-1.5 rounded-md text-sm transition-colors ${
                    isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                  title="Upload new file"
                >
                  <FiPlus size={14} className="mr-1" />
                  Upload
                </button>

                {/* Refresh files button */}
                <button
                  onClick={fetchS3Files}
                  className={`p-1.5 rounded-md transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700 text-blue-400' : 'hover:bg-gray-200 text-blue-600'
                  }`}
                  title="Refresh file list"
                >
                  <FiUpload size={16} />
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



            {error && (
              <div className={`p-3 mb-4 rounded-md ${
                isDarkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-800'
              }`}>
                {error}
              </div>
            )}

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: 'calc(60vh - 250px)', scrollbarWidth: 'thin' }}>
              {requiredVariables.length > 0 ? (
                <div className="space-y-4">
                  {requiredVariables.map((variable) => (
                    <div key={variable} className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className={`px-4 py-2 ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                      } ${!variables[variable] ? 'border-l-4 border-red-500' : ''}`}>
                        <label className="block font-medium">
                          {formatVariableName(variable)}
                          {!variables[variable] && <span className="text-red-500 ml-1">*</span>}
                          {detectedVariableTypes[variable]?.type !== 'text' && (
                            <span className="text-xs ml-2 opacity-70">
                              ({detectedVariableTypes[variable]?.type})
                            </span>
                          )}
                        </label>
                      </div>
                      <div className="p-4">
                        {/* Render different input types based on variable type */}
                        {detectedVariableTypes[variable]?.type === 'file' ? (
                          <div className="relative mb-4"> {/* Reduced margin */}
                            {/* Custom file selector dropdown */}
                            <div className="relative file-dropdown-container">
                              <div
                                className={`flex items-center justify-between p-2 border rounded-md cursor-pointer ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}
                                onClick={() => {
                                  // Close all other dropdowns first
                                  const newState = { ...uiState };
                                  Object.keys(newState).forEach(key => {
                                    if (key.endsWith('_dropdown_open')) {
                                      newState[key] = false;
                                    }
                                  });
                                  // Toggle this dropdown
                                  newState[`${variable}_dropdown_open`] = !uiState[`${variable}_dropdown_open`];
                                  setUiState(newState);
                                }}
                              >
                                <div className="flex items-center flex-1 min-w-0">
                                  <FiFile className="mr-2 flex-shrink-0" size={16} />
                                  <span className="truncate">
                                    {variables[variable] ? variables[variable] : 'Select a file...'}
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  {variables[variable] && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevent dropdown toggle
                                        handleVariableFileSelect(variable, null);
                                      }}
                                      className={`mr-2 p-1 rounded-full ${isDarkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
                                      title="Clear selection"
                                    >
                                      <FiX size={14} />
                                    </button>
                                  )}
                                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                  </svg>
                                </div>
                              </div>

                              {/* Dropdown content - modal version */}
                              {uiState[`${variable}_dropdown_open`] && (
                                <>
                                  {/* Backdrop */}
                                  <div
                                    className={`fixed inset-0 z-40 ${isDarkMode ? 'bg-black bg-opacity-50' : 'bg-gray-600 bg-opacity-25'}`}
                                    onClick={() => {
                                      setUiState(prev => ({
                                        ...prev,
                                        [`${variable}_dropdown_open`]: false
                                      }));
                                    }}
                                  />

                                  {/* Modal content */}
                                  <div
                                    className={`fixed z-50 w-[calc(100%-4rem)] md:w-[400px] rounded-md shadow-lg ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border overflow-hidden`}
                                    style={{
                                      maxHeight: '80vh',
                                      left: '50%',
                                      top: '50%',
                                      transform: 'translate(-50%, -50%)'
                                    }}
                                    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                                  >
                                  {/* Header */}
                                  <div className="flex justify-between items-center p-3 border-b border-gray-200 dark:border-gray-700">
                                    <h3 className="font-medium">Select a file</h3>
                                    <button
                                      onClick={() => {
                                        setUiState(prev => ({
                                          ...prev,
                                          [`${variable}_dropdown_open`]: false
                                        }));
                                      }}
                                      className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                                    >
                                      <FiX size={18} />
                                    </button>
                                  </div>

                                  {/* Search and upload section */}
                                  <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                                    {/* Search input */}
                                    <div className={`flex items-center mb-2 p-1.5 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                      <FiSearch className="mr-2 text-gray-500" size={14} />
                                      <input
                                        type="text"
                                        placeholder="Search files..."
                                        value={uiState[`${variable}_search`] || ''}
                                        onChange={(e) => {
                                          setUiState(prev => ({
                                            ...prev,
                                            [`${variable}_search`]: e.target.value
                                          }));
                                        }}
                                        onClick={(e) => e.stopPropagation()} // Prevent dropdown toggle
                                        className={`w-full bg-transparent border-none focus:outline-none text-sm ${isDarkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'}`}
                                        autoFocus
                                      />
                                    </div>

                                    {/* Upload button */}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation(); // Prevent dropdown toggle
                                        triggerFileUpload();
                                      }}
                                      className={`flex items-center justify-center p-1.5 rounded-md w-full text-sm ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                                    >
                                      <FiUpload className="mr-1" size={14} />
                                      Upload New File
                                    </button>
                                  </div>

                                  {/* File list */}
                                  <div className="max-h-60 overflow-y-auto">
                                    {isLoadingS3Files ? (
                                      <div className="flex items-center justify-center p-4">
                                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                                      </div>
                                    ) : filteredFiles.length === 0 ? (
                                      <div className="p-4 text-center text-gray-500">
                                        <p>No files found</p>
                                        <p className="text-sm mt-1">Upload a file using the button above</p>
                                      </div>
                                    ) : (
                                      <div className="p-2">
                                        {filteredFiles
                                          .filter(file => {
                                            const searchTerm = uiState[`${variable}_search`] || '';
                                            if (!searchTerm) return true;
                                            return file.fileName?.toLowerCase().includes(searchTerm.toLowerCase());
                                          })
                                          .map((file, idx) => {
                                            const isSelected = variables[variable] === file.fileName;
                                            return (
                                              <div
                                                key={idx}
                                                onClick={(e) => {
                                                  e.stopPropagation(); // Prevent dropdown toggle
                                                  // Add file to selected files if not already there
                                                  if (!selectedFiles.some(f => f.fileId === file.fileId || f.fileKey === file.fileKey)) {
                                                    handleFileSelect(file);
                                                  }
                                                  // Set the variable value
                                                  handleVariableChange(variable, file.fileName || 'Unnamed file');
                                                  // Close dropdown
                                                  setUiState(prev => ({
                                                    ...prev,
                                                    [`${variable}_dropdown_open`]: false
                                                  }));
                                                }}
                                                className={`flex items-center p-2 mb-1 rounded-md cursor-pointer ${isSelected
                                                  ? isDarkMode
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-blue-100 text-blue-800'
                                                  : isDarkMode
                                                    ? 'bg-gray-700 hover:bg-gray-600'
                                                    : 'bg-white hover:bg-gray-100 border border-gray-200'}`}
                                              >
                                                <div className={`p-2 rounded-md mr-2 ${isSelected
                                                  ? isDarkMode ? 'bg-blue-500' : 'bg-blue-200'
                                                  : isDarkMode ? 'bg-gray-600' : 'bg-gray-100'}`}>
                                                  <FiFile size={16} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <div className="font-medium truncate">{file.fileName}</div>
                                                  <div className="text-xs opacity-70">
                                                    {formatFileSize(file.fileSize || 0)}
                                                  </div>
                                                </div>
                                                {isSelected && (
                                                  <div className="ml-2 text-xs px-2 py-1 rounded-full bg-blue-500 text-white">
                                                    Selected
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })
                                        }
                                      </div>
                                    )}
                                  </div>
                                </div>
                                </>

                              )}
                            </div>

                            {/* Upload progress indicator */}
                            {isUploading && (
                              <div className="mt-2">
                                <div className="flex justify-between text-xs mb-1">
                                  <span>Uploading...</span>
                                  <span>{uploadProgress}%</span>
                                </div>
                                <div className={`w-full h-1.5 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                  <div
                                    className="h-full rounded-full bg-green-500 transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : detectedVariableTypes[variable]?.type === 'number' ? (
                          <input
                            type="number"
                            value={variables[variable] || ''}
                            onChange={(e) => handleVariableChange(variable, e.target.value)}
                            className={`w-full p-2 rounded-md ${isDarkMode
                              ? 'bg-gray-800 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'} border`}
                            placeholder={`Enter ${formatVariableName(variable).toLowerCase()}`}
                          />
                        ) : detectedVariableTypes[variable]?.type === 'date' ? (
                          <input
                            type="date"
                            value={variables[variable] || ''}
                            onChange={(e) => handleVariableChange(variable, e.target.value)}
                            className={`w-full p-2 rounded-md ${isDarkMode
                              ? 'bg-gray-800 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'} border`}
                          />
                        ) : detectedVariableTypes[variable]?.type === 'select' && detectedVariableTypes[variable]?.options ? (
                          <select
                            value={variables[variable] || ''}
                            onChange={(e) => handleVariableChange(variable, e.target.value)}
                            className={`w-full p-2 rounded-md ${isDarkMode
                              ? 'bg-gray-800 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'} border`}
                          >
                            <option value="">Select an option</option>
                            {detectedVariableTypes[variable]?.options?.map((option, idx) => (
                              <option key={idx} value={option}>{option}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={variables[variable] || ''}
                            onChange={(e) => handleVariableChange(variable, e.target.value)}
                            className={`w-full p-2 rounded-md ${isDarkMode
                              ? 'bg-gray-800 border-gray-600 text-white'
                              : 'bg-white border-gray-300 text-gray-900'} border`}
                            placeholder={`Enter ${formatVariableName(variable).toLowerCase()}`}
                          />
                        )}

                        {/* For non-file variables, show a simple file reference option */}
                        {detectedVariableTypes[variable]?.type !== 'file' && selectedFiles.length > 0 && (
                          <div className="mt-2">
                            <button
                              onClick={() => setUiState(prev => ({ ...prev, [`${variable}_file_ref_open`]: !prev[`${variable}_file_ref_open`] }))}
                              className={`flex items-center text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 ${uiState[`${variable}_file_ref_open`] ? 'mb-2' : ''}`}
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={uiState[`${variable}_file_ref_open`] ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
                              </svg>
                              Reference a file instead
                            </button>

                            {uiState[`${variable}_file_ref_open`] && (
                              <div className="mt-1 pl-2 border-l-2 border-gray-300 dark:border-gray-700">
                                <div className="flex flex-col space-y-1">
                                  {selectedFiles.map((file, idx) => (
                                    <button
                                      key={idx}
                                      onClick={() => handleVariableFileSelect(variable, idx)}
                                      className={`flex items-center text-left p-1 rounded-md text-xs ${
                                        variables[variable] === file.name
                                          ? isDarkMode
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-blue-500 text-white'
                                          : isDarkMode
                                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                      }`}
                                    >
                                      <FiFile className="mr-1 flex-shrink-0" size={12} />
                                      <span className="truncate">{file.fileName}</span>
                                    </button>
                                  ))}
                                  {variables[variable] && (
                                    <button
                                      onClick={() => handleVariableFileSelect(variable, null)}
                                      className={`text-xs px-2 py-1 rounded-md mt-1 ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                                    >
                                      Clear selection
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
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

            {/* File browser (collapsed by default) */}
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium mb-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                Browse All Files
              </summary>
              <div className="mt-2">
                {/* Search bar */}
                <div className={`flex items-center mb-3 p-2 rounded-lg ${
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
                  className="overflow-y-auto pr-2 custom-scrollbar"
                  style={{ maxHeight: '200px', scrollbarWidth: 'thin' }}
                >
                  {isLoadingS3Files ? (
                    <div className="flex items-center justify-center h-20">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
                    </div>
                  ) : filteredFiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-20 text-center">
                      <p className="text-gray-500 text-sm">No files found</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-1">
                      {filteredFiles.map((file, index) => {
                        const isSelected = selectedFiles.some(f =>
                          f.fileId === file.fileId || f.fileKey === file.fileKey
                        );

                        return (
                          <div
                            key={file.fileId || file.fileKey || index}
                            className={`p-2 rounded-md cursor-pointer transition-all ${
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
                              <div className={`mr-2 p-1.5 rounded-md ${
                                isSelected
                                  ? 'bg-blue-500 text-white'
                                  : isDarkMode
                                    ? 'bg-gray-700 text-gray-300'
                                    : 'bg-gray-100 text-gray-500'
                              }`}>
                                {isSelected ? <FiCheck size={14} /> : <FiFile size={14} />}
                              </div>
                              <div className="flex-1 overflow-hidden">
                                <div className="truncate text-sm">{file.fileName}</div>
                                <div className="text-xs opacity-70 flex items-center">
                                  <span>{formatFileSize(file.fileSize || 0)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </details>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-5 border-t border-gray-200 dark:border-gray-700">
          {/* Required fields message */}
          {!isFormValid && (
            <div className="text-sm text-red-500">
              <span>* Please fill in all required fields</span>
            </div>
          )}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-md ${
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
            } ${(isSubmitting || !isFormValid) ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={isSubmitting || !isFormValid}
            title={!isFormValid ? 'Please fill in all required fields' : ''}
          >
            {isSubmitting ? 'Processing...' : 'Submit'}
          </button>
          </div>
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



export default EnhancedFileDialog;
