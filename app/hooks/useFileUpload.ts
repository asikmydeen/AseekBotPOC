import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadFileApi } from '../api/advancedApi';

interface UploadResult {
  fileUrl: string;
  fileId: string;
}

export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress?: number;
  url?: string;
  fileId?: string;
  error?: string;
}

/**
 * Custom hook to handle file uploads using react-dropzone
 */
const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      try {
        setIsUploading(true);

        // Enforce maximum of 10 files
        const remainingSlots = 10 - uploadedFiles.length;
        const filesToAdd = acceptedFiles.slice(0, remainingSlots);

        if (filesToAdd.length === 0) return;

        // Convert File objects to simplified objects with pending status
        const newFiles: UploadedFile[] = filesToAdd.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          file: file,
          status: 'pending',
          progress: 0
        }));

        // Add files to state first with pending status
        setUploadedFiles(prevFiles => [...prevFiles, ...newFiles]);

        // Generate a session ID for this batch of uploads
        const sessionId = `session-${Date.now()}`;

        // Process each file upload through the API
        const fileUploads = filesToAdd.map(async (file, index) => {
          try {
            // Update status to uploading
            setUploadedFiles(prevFiles => {
              const updatedFiles = [...prevFiles];
              const fileIndex = prevFiles.length - filesToAdd.length + index;
              updatedFiles[fileIndex] = {
                ...updatedFiles[fileIndex],
                status: 'uploading',
                progress: 10 // Initial progress
              };
              return updatedFiles;
            });

            // Call the upload API
            const uploadResult = await uploadFileApi(file, sessionId) as UploadResult;

            // Update with success status and URL
            setUploadedFiles(prevFiles => {
              const updatedFiles = [...prevFiles];
              const fileIndex = prevFiles.length - filesToAdd.length + index;
              updatedFiles[fileIndex] = {
                ...updatedFiles[fileIndex],
                status: 'success',
                progress: 100,
                url: uploadResult.fileUrl,
                fileId: uploadResult.fileId
              };
              return updatedFiles;
            });

            return uploadResult;
          } catch (error) {
            // Update with error status
            setUploadedFiles(prevFiles => {
              const updatedFiles = [...prevFiles];
              const fileIndex = prevFiles.length - filesToAdd.length + index;
              updatedFiles[fileIndex] = {
                ...updatedFiles[fileIndex],
                status: 'error',
                error: error instanceof Error ? error.message : 'Upload failed'
              };
              return updatedFiles;
            });

            console.error(`Error uploading file ${file.name}:`, error);
            return null;
          }
        });

        // Wait for all uploads to complete
        await Promise.all(fileUploads);
      } catch (error) {
        console.error('Error uploading files:', error);
      } finally {
        setIsUploading(false);
      }
    },
    [uploadedFiles.length]
  );

  const removeFile = useCallback((index: number) => {
    setUploadedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  }, []);

  const clearUploadedFiles = useCallback(() => {
    setUploadedFiles([]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    // Accept common file types
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxSize: 10485760, // 10MB
  });

  return {
    isUploading,
    onDrop,
    getRootProps,
    getInputProps,
    isDragActive,
    uploadedFiles,
    removeFile,
    clearUploadedFiles
  };
};

export default useFileUpload;
