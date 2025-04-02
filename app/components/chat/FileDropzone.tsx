import React, { useState, useEffect } from 'react';
import { ClipLoader } from 'react-spinners';
import { DropzoneRootProps, DropzoneInputProps } from 'react-dropzone';
import { FaChevronDown, FaChevronUp, FaPaperclip } from 'react-icons/fa';
import {
  FaFilePdf,
  FaFileWord,
  FaFileAlt,
  FaFileCsv,
  FaFileImage,
  FaFileExcel,
  FaFile,
  FaTimes
} from 'react-icons/fa';

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  status?: 'pending' | 'uploading' | 'success' | 'error';
  progress?: number;
  url?: string;
  error?: string;
}

interface FileDropzoneProps {
  getRootProps: () => DropzoneRootProps;
  getInputProps: () => DropzoneInputProps;
  isDragActive: boolean;
  isUploading: boolean;
  isDarkMode: boolean;
  uploadProgress?: number;
  fileSizeLimit?: number | string;
  uploadedFiles?: UploadedFile[];
  onRemoveFile?: (fileName: string) => void;
  initiallyExpanded?: boolean;
  onToggle?: (isExpanded: boolean) => void;
}

const FileDropzone: React.FC<FileDropzoneProps> = ({
  getRootProps,
  getInputProps,
  isDragActive,
  isUploading,
  isDarkMode,
  uploadProgress = 0,
  fileSizeLimit,
  uploadedFiles = [],
  onRemoveFile,
  initiallyExpanded = false,
  onToggle
}) => {
  const [isExpanded, setIsExpanded] = useState(initiallyExpanded);

  // Update expanded state when initiallyExpanded prop changes
  useEffect(() => {
    setIsExpanded(initiallyExpanded);
  }, [initiallyExpanded]);

  // Update expanded state when files are uploaded
  useEffect(() => {
    if (uploadedFiles.length > 0) {
      setIsExpanded(true);
    }
  }, [uploadedFiles.length]);

  // Log uploaded files for debugging
  useEffect(() => {
    console.log("FileDropzone received files:", uploadedFiles);
  }, [uploadedFiles]);

  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpandedState = !isExpanded;
    setIsExpanded(newExpandedState);

    // Call the onToggle callback if provided
    if (onToggle) {
      onToggle(newExpandedState);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (!fileType) return <FaFile className="text-gray-500" size={16} />;
    if (fileType.includes('pdf')) return <FaFilePdf className="text-red-500" size={16} />;
    if (fileType.includes('word') || fileType.includes('docx')) return <FaFileWord className="text-blue-500" size={16} />;
    if (fileType.includes('text') || fileType.includes('txt')) return <FaFileAlt className="text-yellow-500" size={16} />;
    if (fileType.includes('csv')) return <FaFileCsv className="text-green-500" size={16} />;
    if (fileType.includes('excel') || fileType.includes('xlsx') || fileType.includes('xls')) return <FaFileExcel className="text-green-600" size={16} />;
    if (fileType.includes('image')) return <FaFileImage className="text-purple-500" size={16} />;
    return <FaFile className="text-gray-500" size={16} />;
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get the status indicator for a file
  const getFileStatusIndicator = (file: UploadedFile) => {
    if (!file.status || file.status === 'pending') {
      return null;
    }

    if (file.status === 'uploading' && typeof file.progress === 'number') {
      return (
        <div className="ml-2 text-xs">
          <div className="w-16 h-1.5 bg-gray-300 rounded-full overflow-hidden">
            <div
              className={`h-full ${isDarkMode ? 'bg-blue-500' : 'bg-blue-600'}`}
              style={{ width: `${file.progress}%` }}
            />
          </div>
          <span className="text-xs ml-1">{file.progress}%</span>
        </div>
      );
    }

    if (file.status === 'success') {
      return (
        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'}`}>
          ✓ Uploaded
        </span>
      );
    }

    if (file.status === 'error') {
      return (
        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-800'}`}>
          ✗ Error
        </span>
      );
    }

    return null;
  };

  return (
    <div className="mb-2">
      {/* Collapsible toggle button */}
      <button
        type="button"
        onClick={toggleExpanded}
        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors w-full
          ${isDarkMode
            ? 'text-gray-300 hover:bg-gray-700'
            : 'text-gray-700 hover:bg-gray-100'
          }`}
      >
        <FaPaperclip size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
        <span className="flex-1 text-left">
          {uploadedFiles.length > 0
            ? `${uploadedFiles.length} file${uploadedFiles.length !== 1 ? 's' : ''} attached`
            : 'Attach files'}
        </span>
        {isExpanded
          ? <FaChevronUp size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
          : <FaChevronDown size={14} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
        }
      </button>

      {/* Collapsible content */}
      {isExpanded && (
        <div
          {...getRootProps()}
          className={`
            mt-2 p-3 border border-dashed rounded-lg text-center cursor-pointer transition-all
            ${isDarkMode
              ? 'bg-gray-800/50 border-gray-600 hover:border-blue-500'
              : 'bg-gray-50/50 border-gray-300 hover:border-blue-500'
            }
            ${isDragActive
              ? (isDarkMode ? 'border-blue-400 bg-gray-700/50' : 'border-blue-400 bg-blue-50/50')
              : ''
            }
          `}
        >
          <input {...getInputProps()} />

          {fileSizeLimit && (
            <div className={`inline-block px-2 py-1 mb-2 rounded-full text-xs font-medium ${isDarkMode ? 'bg-blue-900/70 text-blue-200' : 'bg-blue-100 text-blue-800'
              }`}>
              Max file size: {fileSizeLimit}MB
            </div>
          )}

          {uploadedFiles.length > 0 && !isUploading && (
            <div className={`mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <h4 className="text-xs font-medium mb-1 text-left">Uploaded Files:</h4>
              <ul className="space-y-1">
                {uploadedFiles.map((file, index) => {
                  // Ensure file has all required properties with defaults
                  const safeFile = {
                    name: file.name || 'Unnamed File',
                    size: typeof file.size === 'number' ? file.size : 0,
                    type: file.type || 'application/octet-stream',
                    status: file.status || 'success',
                    progress: typeof file.progress === 'number' ? file.progress : 100
                  };

                  return (
                    <li
                      key={`${safeFile.name}-${index}`}
                      className={`flex items-center justify-between p-1.5 rounded ${isDarkMode ? 'bg-gray-700/70' : 'bg-gray-100'
                        }`}
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        {getFileIcon(safeFile.type)}
                        <span className="ml-2 text-sm truncate max-w-[200px]">{safeFile.name}</span>
                        <span className={`ml-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          ({formatFileSize(safeFile.size)})
                        </span>
                        {getFileStatusIndicator(file)}
                      </div>
                      {onRemoveFile && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveFile(file.name);
                          }}
                          className={`p-1 rounded-full ${isDarkMode
                            ? 'text-gray-400 hover:text-red-400 hover:bg-gray-600'
                            : 'text-gray-500 hover:text-red-500 hover:bg-gray-200'
                            }`}
                        >
                          <FaTimes size={14} />
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {isUploading ? (
            <div className="py-4 flex flex-col items-center">
              <ClipLoader
                color={isDarkMode ? "#3B82F6" : "#2563EB"}
                size={36}
              />
              <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Uploading file...
              </p>
              <progress
                value={uploadProgress}
                max="100"
                className={`w-64 h-2 mt-3 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`}
              />
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {uploadProgress}%
              </p>
            </div>
          ) : isDragActive ? (
            <p className={`py-3 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>
              Drop the files here...
            </p>
          ) : (
            <div className="py-3">
              <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                Drag and drop files here, or click to select files
              </p>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Supported formats: PDF, DOCX, TXT, CSV, JPG, PNG, XLS, XLSX
              </p>

              <div className="flex flex-wrap justify-center gap-2 mt-2">
                <div className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <FaFilePdf className="text-red-500 mr-1" size={16} /> PDF
                </div>
                <div className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <FaFileWord className="text-blue-500 mr-1" size={16} /> DOCX
                </div>
                <div className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <FaFileAlt className="text-yellow-500 mr-1" size={16} /> TXT
                </div>
                <div className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <FaFileCsv className="text-green-500 mr-1" size={16} /> CSV
                </div>
                <div className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <FaFileImage className="text-purple-500 mr-1" size={16} /> JPG/PNG
                </div>
                <div className={`flex items-center ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  <FaFileExcel className="text-green-600 mr-1" size={16} /> XLS/XLSX
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FileDropzone;