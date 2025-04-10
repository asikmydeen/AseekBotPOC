'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaPaperclip,
  FaDownload,
  FaExternalLinkAlt,
  FaFilePdf,
  FaFileWord,
  FaFile,
  FaFileCsv,
  FaFileExcel,
  FaFileImage
} from 'react-icons/fa';

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
}

interface MessageAttachmentsProps {
  attachments: Attachment[];
  isDarkMode: boolean;
  styles: any;
  onDownload: (fileUrl: string, fileName: string) => void;
  onView: (fileUrl: string) => void;
}

const MessageAttachments: React.FC<MessageAttachmentsProps> = ({
  attachments,
  isDarkMode,
  styles,
  onDownload,
  onView
}) => {
  const [isFileCollapsed, setIsFileCollapsed] = useState(attachments.length > 3);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon based on file type
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FaFilePdf className={styles.attachments.icon.pdf} size={16} />;
    if (fileType.includes('word') || fileType.includes('docx')) return <FaFileWord className={styles.attachments.icon.word} size={16} />;
    if (fileType.includes('text') || fileType.includes('txt')) return <FaFile className={styles.attachments.icon.text} size={16} />;
    if (fileType.includes('csv')) return <FaFileCsv className={styles.attachments.icon.csv} size={16} />;
    if (fileType.includes('excel') || fileType.includes('xlsx') || fileType.includes('xls')) return <FaFileExcel className={styles.attachments.icon.excel} size={16} />;
    if (fileType.includes('image')) return <FaFileImage className={styles.attachments.icon.image} size={16} />;
    return <FaFile className={styles.attachments.icon.default} size={16} />;
  };

  // Determine which files to display
  const filesToDisplay = isFileCollapsed ? attachments.slice(0, 3) : attachments;
  const hasMoreFiles = attachments.length > 3 && isFileCollapsed;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className={styles.attachments.container}
    >
      <div className={styles.attachments.header.container}>
        <div className={styles.attachments.header.iconContainer}>
          <FaPaperclip className={styles.attachments.header.icon} />
          <span className={styles.attachments.header.count}>
            {attachments.length} Attachment{attachments.length !== 1 ? 's' : ''}
          </span>
        </div>
        {attachments.length > 3 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsFileCollapsed(!isFileCollapsed)}
            className={styles.attachments.showMore}
          >
            {isFileCollapsed ? 'Show All' : 'Show Less'}
          </motion.button>
        )}
      </div>

      <div className={styles.attachments.list}>
        {filesToDisplay.map((file) => (
          <motion.div
            key={file.id}
            whileHover={styles.attachments.itemHover}
            className={styles.attachments.item}
          >
            <div className={styles.attachments.icon.container}>
              {getFileIcon(file.type)}
            </div>
            <div className={styles.attachments.content}>
              <div className={styles.attachments.name}>{file.name}</div>
              <div className={styles.attachments.size}>
                {formatFileSize(file.size)}
              </div>
            </div>
            <div className={styles.attachments.actions}>
              <motion.button
                whileHover={styles.attachments.actionButtonHover}
                whileTap={{ scale: 0.9 }}
                className={styles.attachments.actionButton}
                onClick={() => onView(file.url)}
                aria-label={`View ${file.name}`}
              >
                <FaExternalLinkAlt size={14} className={styles.attachments.icon.default} />
              </motion.button>
              <motion.button
                whileHover={styles.attachments.actionButtonHover}
                whileTap={{ scale: 0.9 }}
                className={styles.attachments.actionButton}
                onClick={() => onDownload(file.url, file.name)}
                aria-label={`Download ${file.name}`}
              >
                <FaDownload size={14} className={styles.attachments.icon.default} />
              </motion.button>
            </div>
          </motion.div>
        ))}

        {hasMoreFiles && (
          <motion.div
            whileHover={styles.attachments.toggleButtonHover}
            className={styles.attachments.toggleButton}
            onClick={() => setIsFileCollapsed(false)}
          >
            Show {attachments.length - 3} more attachment{attachments.length - 3 !== 1 ? 's' : ''}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default MessageAttachments;
