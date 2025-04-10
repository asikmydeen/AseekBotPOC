"use client";
import React, { useState, useEffect } from 'react';
import { FiX, FiFolder } from 'react-icons/fi';
import { apiService } from '../../utils/apiService';
import { useTheme } from '../../hooks/useTheme';
import { UploadedFile } from '../../types/shared';

interface SimpleFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (files: UploadedFile[], variables: Record<string, string>) => void;
  promptId: string;
  promptTitle: string;
  requiredFileCount?: number;
  requiredVariables?: string[];
}

const SimpleFileDialog: React.FC<SimpleFileDialogProps> = ({
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
  const [s3Files, setS3Files] = useState<any[]>([]);
  const [isLoadingS3Files, setIsLoadingS3Files] = useState(false);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize variables state based on requiredVariables
  useEffect(() => {
    const initialVariables: Record<string, string> = {};
    requiredVariables.forEach(variable => {
      initialVariables[variable] = '';
    });
    setVariables(initialVariables);
  }, [requiredVariables]);

  // Fetch S3 files when dialog opens
  useEffect(() => {
    console.log('SimpleFileDialog isOpen changed:', isOpen);
    if (isOpen) {
      console.log('Fetching S3 files...');
      fetchS3Files();
    }
  }, [isOpen]);

  const fetchS3Files = async () => {
    try {
      setIsLoadingS3Files(true);
      const response = await apiService.getUserFiles();
      
      // Check if response has the expected structure
      if (response && response.data && Array.isArray(response.data)) {
        setS3Files(response.data);
      } else if (response && Array.isArray(response)) {
        setS3Files(response);
      } else {
        console.warn('Unexpected response format from getUserFiles:', response);
        setS3Files([]);
        setError('Failed to load your files. Unexpected response format.');
      }
    } catch (error) {
      console.error('Error fetching S3 files:', error);
      setS3Files([]);
      setError('Failed to load your files. Please try again.');
    } finally {
      setIsLoadingS3Files(false);
    }
  };

  const handleFileSelect = (file: any) => {
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
        name: file.fileName,
        fileName: file.fileName,
        fileId: file.fileId,
        fileKey: file.fileKey,
        size: file.fileSize,
        type: file.fileType,
        url: file.presignedUrl || file.s3Url,
        s3Url: file.s3Url
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

  const handleSubmit = () => {
    console.log('Submitting files and variables');
    console.log('Selected files:', selectedFiles);
    console.log('Variables:', variables);
    
    // Validate required files
    if (requiredFileCount > 0 && selectedFiles.length < requiredFileCount) {
      const errorMsg = `Please select at least ${requiredFileCount} file(s).`;
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    // Validate required variables
    const missingVariables = requiredVariables.filter(variable => !variables[variable]);
    if (missingVariables.length > 0) {
      const errorMsg = `Please fill in all required variables: ${missingVariables.join(', ')}`;
      console.error(errorMsg);
      setError(errorMsg);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      onSubmit(selectedFiles, variables);
      console.log('Submit callback executed successfully');
    } catch (error) {
      console.error('Error submitting files:', error);
      setError('Failed to submit files. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
      <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-2xl w-full ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{promptTitle}</h2>
          <button 
            onClick={onClose} 
            className={`p-2 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
          >
            <FiX size={20} />
          </button>
        </div>
        
        {error && (
          <div className={`p-3 mb-4 rounded-md ${
            isDarkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-800'
          }`}>
            {error}
          </div>
        )}
        
        {/* File Selection Section */}
        {requiredFileCount > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">
              Select Files ({selectedFiles.length}/{requiredFileCount > 0 ? requiredFileCount : 'unlimited'})
            </h3>
            
            <div className={`p-4 rounded-lg mb-4 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              {isLoadingS3Files ? (
                <div className="text-center py-4">Loading your files...</div>
              ) : s3Files.length === 0 ? (
                <div className="text-center py-4">No files found. Please upload files first.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {s3Files.map((file, index) => {
                    const isSelected = selectedFiles.some(f => 
                      f.fileId === file.fileId || f.fileKey === file.fileKey
                    );
                    
                    return (
                      <div 
                        key={index} 
                        className={`p-3 rounded-md cursor-pointer transition-colors ${
                          isSelected 
                            ? isDarkMode 
                              ? 'bg-blue-900/50 border border-blue-500' 
                              : 'bg-blue-100 border border-blue-500'
                            : isDarkMode 
                              ? 'bg-gray-750 hover:bg-gray-700 border border-gray-700' 
                              : 'bg-white hover:bg-gray-50 border border-gray-200'
                        }`}
                        onClick={() => handleFileSelect(file)}
                      >
                        <div className="flex items-center">
                          <FiFolder size={20} className="mr-2" />
                          <div className="overflow-hidden">
                            <div className="truncate font-medium">{file.fileName}</div>
                            <div className="text-xs opacity-70">
                              {file.fileSize ? formatFileSize(file.fileSize) : ''}
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
        )}

        {/* Variables Section */}
        {requiredVariables.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Required Information</h3>
            
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              {requiredVariables.map((variable) => (
                <div key={variable} className="mb-3 last:mb-0">
                  <label className="block mb-1 font-medium">
                    {formatVariableName(variable)}
                  </label>
                  <input
                    type="text"
                    value={variables[variable] || ''}
                    onChange={(e) => handleVariableChange(variable, e.target.value)}
                    className={`w-full p-2 rounded-md ${
                      isDarkMode 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    } border`}
                    placeholder={`Enter ${formatVariableName(variable).toLowerCase()}`}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
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
            } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Processing...' : 'Submit'}
          </button>
        </div>
      </div>
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

export default SimpleFileDialog;
