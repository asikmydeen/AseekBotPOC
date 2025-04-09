'use client';

import React from 'react';
import { MdAttachment, MdLibraryAdd, MdDelete, MdAnalytics } from 'react-icons/md';
import { FiDownload } from 'react-icons/fi';
import {
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileImage,
  FaFileAlt,
  FaFileCsv,
  FaFile
} from 'react-icons/fa';

interface UploadedFile {
  fileId: string;
  fileName: string;
  fileKey: string;
  uploadDate: string;
  fileSize: number;
  fileType?: string;
  presignedUrl?: string;
}

interface FilesListProps {
  uploadedFiles: UploadedFile[];
  styles: any;
  onAddToChat: (file: UploadedFile, e: React.MouseEvent) => void;
  onDownload: (file: UploadedFile, e: React.MouseEvent) => void;
  onAnalyze: (file: UploadedFile, e: React.MouseEvent) => void;
  onDelete: (file: UploadedFile, e: React.MouseEvent) => void;
}

const FilesList: React.FC<FilesListProps> = ({
  uploadedFiles,
  styles,
  onAddToChat,
  onDownload,
  onAnalyze,
  onDelete
}) => {
  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === undefined || bytes === null || bytes <= 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon based on file type
  const getFileIcon = (fileType: string | undefined) => {
    if (!fileType) return <FaFile className="text-gray-500" />;
    if (fileType.includes('pdf')) return <FaFilePdf className="text-red-500" />;
    if (fileType.includes('word') || fileType.includes('docx')) return <FaFileWord className="text-blue-500" />;
    if (fileType.includes('text') || fileType.includes('txt')) return <FaFileAlt className="text-gray-500" />;
    if (fileType.includes('csv')) return <FaFileCsv className="text-green-500" />;
    if (fileType.includes('excel') || fileType.includes('xlsx') || fileType.includes('xls')) return <FaFileExcel className="text-green-600" />;
    if (fileType.includes('image')) return <FaFileImage className="text-purple-500" />;
    return <FaFile className="text-gray-500" />;
  };

  return (
    <div className={styles.files.container}>
      <div className={styles.content.section.header}>
        <MdAttachment className="mr-2" size={20} />
        <h3 className={styles.content.section.title}>Uploaded Files</h3>
      </div>
      {uploadedFiles && uploadedFiles.length > 0 ? (
        <div className={styles.files.list}>
          {uploadedFiles.filter(file => file && file.fileName).map((file, index) => (
            <div
              key={`file-${index}`}
              className={styles.files.item}
            >
              <div className={styles.files.itemContent}>
                <div className="flex items-center w-full">
                  <span className={styles.files.itemIndex}>{index + 1}.</span>
                  <div className={styles.files.iconContainer}>
                    {getFileIcon(file.fileType)}
                  </div>
                  <div className={styles.files.fileInfo}>
                    <p className={styles.files.fileName}>{file.fileName}</p>
                    <p className={styles.files.fileSize}>{formatFileSize(file.fileSize)}</p>
                  </div>
                </div>
                <div className={styles.files.actionsContainer}>
                  <button
                    onClick={(e) => onAddToChat(file, e)}
                    className={styles.files.actionButton}
                    title="Add to chat"
                    aria-label="Add to chat"
                  >
                    <MdLibraryAdd size={18} />
                  </button>
                  <button
                    onClick={(e) => onDownload(file, e)}
                    className={styles.files.actionButton}
                    title="Download file"
                    aria-label="Download file"
                  >
                    <FiDownload size={16} />
                  </button>
                  <button
                    onClick={(e) => onAnalyze(file, e)}
                    className={styles.files.actionButton}
                    title="Perform analysis"
                    aria-label="Perform analysis"
                  >
                    <MdAnalytics size={18} />
                  </button>
                  <button
                    onClick={(e) => onDelete(file, e)}
                    className={styles.files.actionButton}
                    title="Delete file"
                    aria-label="Delete file"
                  >
                    <MdDelete size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.files.emptyText}>
          No uploaded files
        </p>
      )}
    </div>
  );
};

export default FilesList;
