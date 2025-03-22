import React from 'react';
import { FileAttachment } from '../../types/shared';

// Import specialized preview components
// These will be implemented separately
import PDFPreview from './PDFPreview';
import ImagePreview from './ImagePreview';
import TextPreview from './TextPreview';
import ExcelPreview from './ExcelPreview';
import CSVPreview from './CSVPreview';
import DocPreview from './DocPreview';

// File type determination helper
const getFileType = (file: FileAttachment): string => {
  // Check MIME type first if available
  if (file.contentType) {
    if (file.contentType.includes('pdf')) return 'pdf';
    if (file.contentType.includes('image')) return 'image';
    if (file.contentType.includes('text/plain')) return 'text';
    if (file.contentType.includes('text/csv') || file.contentType.includes('application/csv')) return 'csv';
    if (file.contentType.includes('application/vnd.ms-excel') ||
        file.contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) return 'excel';
    if (file.contentType.includes('application/msword') ||
        file.contentType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document')) return 'doc';
  }

  // Fallback to extension check if MIME type is not conclusive
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(extension || '')) return 'image';
  if (extension === 'txt') return 'text';
  if (extension === 'csv') return 'csv';
  if (['xls', 'xlsx', 'xlsm'].includes(extension || '')) return 'excel';
  if (['doc', 'docx'].includes(extension || '')) return 'doc';

  return 'unknown';
};

interface FilePreviewProps {
  file: FileAttachment;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file }) => {
  const fileType = getFileType(file);

  // Render the appropriate preview component based on file type
  switch (fileType) {
    case 'pdf':
      return <PDFPreview fileUrl={file.url} />;
    case 'image':
      return <ImagePreview fileUrl={file.url} />;
    case 'text':
      return <TextPreview fileUrl={file.url} />;
    case 'excel':
      return <ExcelPreview fileUrl={file.url} />;
    case 'csv':
      return <CSVPreview fileUrl={file.url} />;
    case 'doc':
      return <DocPreview url={file.url} />;
    default:
      return (
        <div className="file-preview-unsupported">
          <div className="file-preview-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
              <polyline points="13 2 13 9 20 9"></polyline>
            </svg>
          </div>
          <div className="file-preview-message">
            <h3>Preview not available</h3>
            <p>The file type "{file.name}" is not supported for preview.</p>
            <p>You can download the file to view its contents.</p>
          </div>
        </div>
      );
  }
};export default FilePreview;
