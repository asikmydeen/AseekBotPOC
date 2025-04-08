import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { apiService } from '../utils/apiService';
import { UploadedFile } from '../types/shared';

interface UseFileUploadProps {
  onFilesUpdate?: (files: UploadedFile[]) => void;
}

/**
 * Custom hook to handle file uploads using react-dropzone
 */
const useFileUpload = ({ onFilesUpdate }: UseFileUploadProps = {}) => {
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const addExternalFile = useCallback((externalFile: UploadedFile) => {
    if (!externalFile || !externalFile.name) {
      console.error('Invalid external file:', externalFile);
      return;
    }

    // Ensure the external file has all the required properties
    const formattedFile: UploadedFile = {
      name: externalFile.name || 'Unknown File',
      size: externalFile.size || 0,
      type: externalFile.type || 'application/octet-stream',
      url: externalFile.url || '',
      fileId: externalFile.fileId,
      status: 'success', // Mark as already uploaded
      progress: 100
    };

    // Add to state and preserve existing files
    setUploadedFiles(prevFiles => {
      // Check if this file already exists (by URL or name+size)
      const fileExists = prevFiles.some(f =>
        (f.url && f.url === formattedFile.url) ||
        (f.name === formattedFile.name && f.size === formattedFile.size)
      );

      if (fileExists) {
        console.log('File already exists in the list:', formattedFile.name);
        return prevFiles; // Don't add duplicates
      }

      console.log('Adding external file to list:', formattedFile.name);
      return [...prevFiles, formattedFile];
    });
  }, []);

  useEffect(() => {
    if (onFilesUpdate) {
      onFilesUpdate(uploadedFiles);
    }
  }, [uploadedFiles, onFilesUpdate]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      try {
        setIsUploading(true);
        console.log("Files dropped:", acceptedFiles.map(f => f.name));

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
          progress: 0,
          url: '' // Temporary empty URL that will be populated after upload
        }));

        console.log("New files to add:", newFiles);

        // Add files to state first with pending status
        setUploadedFiles(prevFiles => {
          const updatedFiles = [...prevFiles, ...newFiles];
          console.log("Updated files state:", updatedFiles);
          return updatedFiles;
        });

        // Generate a session ID for this batch of uploads
        const sessionId = `session-${Date.now()}`;

        // Process each file upload through the API
        const fileUploads = filesToAdd.map(async (file, index) => {
          try {
            // Update status to uploading
            setUploadedFiles(prevFiles => {
              const updatedFiles = [...prevFiles];
              const fileIndex = prevFiles.findIndex(f =>
                f.name === file.name &&
                f.size === file.size &&
                f.status === 'pending'
              );

              if (fileIndex >= 0) {
                updatedFiles[fileIndex] = {
                  ...updatedFiles[fileIndex],
                  status: 'uploading',
                  progress: 10 // Initial progress
                };
              }

              return updatedFiles;
            });

            // Call the upload API
            const uploadResult = await uploadFileApi(file, sessionId, 'test-user');

            console.log(`File ${file.name} uploaded:`, uploadResult);

            // Update with success status and URL
            setUploadedFiles(prevFiles => {
              const updatedFiles = [...prevFiles];
              const fileIndex = prevFiles.findIndex(f =>
                f.name === file.name &&
                f.size === file.size &&
                f.status === 'uploading'
              );

              if (fileIndex >= 0) {
                updatedFiles[fileIndex] = {
                  ...updatedFiles[fileIndex],
                  status: 'success',
                  progress: 100,
                  url: uploadResult.fileUrl || '',
                  fileId: uploadResult.fileId
                };
              }

              return updatedFiles;
            });

            return uploadResult;
          } catch (error) {
            // Update with error status
            setUploadedFiles(prevFiles => {
              const updatedFiles = [...prevFiles];
              const fileIndex = prevFiles.findIndex(f =>
                f.name === file.name &&
                f.size === file.size &&
                (f.status === 'uploading' || f.status === 'pending')
              );

              if (fileIndex >= 0) {
                updatedFiles[fileIndex] = {
                  ...updatedFiles[fileIndex],
                  status: 'error',
                  error: error instanceof Error ? error.message : 'Upload failed',
                  url: '' // Ensure URL is set to avoid undefined
                };
              }

              return updatedFiles;
            });

            console.error(`Error uploading file ${file.name}:`, error);
            return null;
          }
        });

        // Wait for all uploads to complete
        await Promise.all(fileUploads);
        console.log("All files processed. Current uploaded files:", uploadedFiles);

      } catch (error) {
        console.error('Error uploading files:', error);
      } finally {
        setIsUploading(false);
      }
    },
    [uploadedFiles.length]
  );

  const removeFile = useCallback((index: number) => {
    if (index < 0 || index >= uploadedFiles.length) return;

    const fileToRemove = uploadedFiles[index];
    console.log("Removing file:", fileToRemove.name);

    if (fileToRemove && fileToRemove.url) {
      // Call the API to delete file from S3
      deleteFileApi(fileToRemove.url)
        .then(() => {
          setUploadedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
        })
        .catch(error => {
          console.error("Failed to delete file from S3:", error);
          // Remove from state anyway
          setUploadedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
        });
    } else {
      setUploadedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    }
  }, [uploadedFiles]);

  const clearUploadedFiles = useCallback(() => {
    console.log("Clearing all uploaded files");
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
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/csv': ['.csv']
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
    clearUploadedFiles,
    addExternalFile
  };
};

export default useFileUpload;