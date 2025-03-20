"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiFile, FiUploadCloud } from 'react-icons/fi';
import { UploadedFile } from '../../types/shared';

interface FileUploadSectionProps {
  uploadedFiles: UploadedFile[];
  getRootProps: any;
  getInputProps: any;
  isUploading: boolean;
  isDragActive: boolean;
  progress: number;
  removeFile: (index: number) => void;
  cancelUpload: () => void;
  analyzeFiles: () => void;
  sendFiles: () => void;
  isDarkMode: boolean;
  showPrompt: boolean;
  promptMessage: string;
}

const FileUploadSection: React.FC<FileUploadSectionProps> = ({
  uploadedFiles,
  getRootProps,
  getInputProps,
  isUploading,
  isDragActive,
  progress,
  removeFile,
  cancelUpload,
  analyzeFiles,
  sendFiles,
  isDarkMode,
  showPrompt,
  promptMessage
}) => {
  // Format file size to human-readable format
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        {uploadedFiles.length === 0 ? (
          // File Dropzone UI
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-6 mb-4 text-center cursor-pointer transition-colors ${isDarkMode
                ? isDragActive
                  ? 'border-blue-400 bg-blue-900/20'
                  : 'border-gray-600 hover:border-gray-500'
                : isDragActive
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
          >
            <input {...getInputProps()} />
            <FiUploadCloud className="mx-auto h-12 w-12 mb-2" />
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {isDragActive ? 'Drop the files here...' : 'Drag and drop files here, or click to select files'}
            </p>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Supported formats: PDF, DOCX, XLSX, CSV, TXT, JPG, PNG
            </p>
          </div>
        ) : (
          // File Action Prompt UI
          <div className={`rounded-lg p-4 mb-4 ${isDarkMode ? 'bg-gray-750' : 'bg-gray-100'}`}>
            <div className="flex flex-col">
              <div className="mb-3">
                <h3 className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  {uploadedFiles.length} {uploadedFiles.length === 1 ? 'file' : 'files'} ready
                </h3>

                {/* Progress bar for uploading */}
                {isUploading && (
                  <div className="w-full h-1 bg-gray-300 rounded-full mt-2">
                    <div
                      className="h-1 bg-blue-500 rounded-full"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                )}
              </div>

              {/* File list */}
              <div className="space-y-2 mb-3 max-h-40 overflow-y-auto">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-white'
                      }`}
                  >
                    <div className="flex items-center">
                      <FiFile className="mr-2" />
                      <div>
                        <p className={`text-sm font-medium truncate max-w-xs ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                          {file.name}
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className={`p-1 rounded-full ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                      aria-label="Remove file"
                    >
                      <FiX className={isDarkMode ? 'text-gray-300' : 'text-gray-500'} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={analyzeFiles}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  disabled={isUploading}
                >
                  {showPrompt ? 'Analyze Document' : 'Analyze the File/s'}
                </button>
                <button
                  onClick={cancelUpload}
                  className={`py-2 px-4 rounded-md text-sm font-medium ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                    }`}
                  disabled={isUploading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default FileUploadSection;
