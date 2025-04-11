"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiFile, FiUploadCloud } from 'react-icons/fi';
import { UploadedFile } from '../../types/shared';
import { getFileUploadSectionStyles } from '../../styles/chatStyles';
import { CHAT_UI_TEXT } from '../../constants/chatConstants';

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
    if (bytes === undefined || bytes === null || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = CHAT_UI_TEXT.FILE_SIZE_UNITS;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon based on file type
  const getFileIcon = (fileType: string) => {
    if (!fileType) return <FiFile size={20} />;
    if (fileType.includes('pdf')) return <FiFile size={20} className="text-red-500" />;
    if (fileType.includes('doc')) return <FiFile size={20} className="text-blue-500" />;
    if (fileType.includes('xlsx') || fileType.includes('csv')) return <FiFile size={20} className="text-green-500" />;
    if (fileType.includes('image') || fileType.includes('jpg') || fileType.includes('png')) return <FiFile size={20} className="text-purple-500" />;
    return <FiFile size={20} />;
  };

  // Get centralized styles
  const styles = getFileUploadSectionStyles(isDarkMode);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
        className={styles.container}
      >
        {uploadedFiles.length === 0 ? (
          // File Dropzone UI
          <div
            {...getRootProps()}
            className={styles.dropzoneContainer(isDragActive)}
          >
            <input {...getInputProps()} />
            <FiUploadCloud className={styles.uploadIcon} />
            <p className={styles.dropzoneText}>
              {isDragActive ? CHAT_UI_TEXT.FILE_UPLOAD_DRAG_ACTIVE : CHAT_UI_TEXT.FILE_UPLOAD_DRAG_INACTIVE}
            </p>
            <p className={styles.dropzoneSubtext}>
              {CHAT_UI_TEXT.FILE_UPLOAD_SUPPORTED_FORMATS}
            </p>
          </div>
        ) : (
          // File Action Prompt UI
          <div className={styles.fileListContainer}>
            <div className="flex flex-col">
              <div className={styles.fileListHeader}>
                <h3 className={styles.fileListTitle}>
                  {uploadedFiles.length} {uploadedFiles.length === 1 ? CHAT_UI_TEXT.FILE_READY_SINGULAR : CHAT_UI_TEXT.FILE_READY_PLURAL}
                </h3>

                {/* Progress bar for uploading */}
                {isUploading && (
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressBarFill}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                )}
              </div>

              {/* File list */}
              <div className={styles.fileList}>
                {uploadedFiles.map((file, index) => {
                  // Ensure file has all required properties with defaults
                  const safeFileName = file.name || CHAT_UI_TEXT.FILE_UNNAMED;
                  const safeFileSize = typeof file.size === 'number' ? file.size : 0;
                  const safeFileType = file.type || 'application/octet-stream';

                  return (
                    <div
                      key={index}
                      className={styles.fileItem}
                    >
                      <div className={styles.fileIconContainer}>
                        {getFileIcon(safeFileType)}
                        <div className={styles.fileDetails}>
                          <p className={styles.fileName}>
                            {safeFileName}
                          </p>
                          <p className={styles.fileSize}>
                            ({formatFileSize(safeFileSize)})
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className={styles.removeButton}
                        aria-label={CHAT_UI_TEXT.ARIA_REMOVE_FILE}
                      >
                        <FiX className={isDarkMode ? 'text-gray-300' : 'text-gray-500'} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Action buttons */}
              <div className={styles.actionsContainer}>
                <button
                  onClick={analyzeFiles}
                  className={styles.actionButton('analyze', isDarkMode)}
                  disabled={isUploading}
                >
                  {showPrompt ? CHAT_UI_TEXT.FILE_UPLOAD_ANALYZE_DOCUMENT : CHAT_UI_TEXT.FILE_UPLOAD_ANALYZE_BUTTON}
                </button>
                <button
                  onClick={sendFiles}
                  className={styles.actionButton('send', isDarkMode)}
                  disabled={isUploading}
                >
                  {CHAT_UI_TEXT.FILE_UPLOAD_SEND_BUTTON}
                </button>
                <button
                  onClick={cancelUpload}
                  className={styles.actionButton('cancel', isDarkMode)}
                  disabled={isUploading}
                >
                  {CHAT_UI_TEXT.FILE_UPLOAD_CANCEL_BUTTON}
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