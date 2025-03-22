// app/hooks/usePresignedUrl.ts
import { useState, useEffect, useCallback } from 'react';
import { downloadFileApi } from '../api/advancedApi';

interface FileAttachment {
  url?: string;
  fileUrl?: string;
  name?: string;
  type?: string;
  size?: number;
}

/**
 * Custom hook to fetch and manage presigned URLs for file attachments
 * @param fileInput - Either a file attachment object or an S3 key string
 * @param autoFetch - Whether to automatically fetch the URL on mount (default: true)
 * @returns Object containing loading state, error state, presigned URL, and refetch function
 */
export function usePresignedUrl(
  fileInput: FileAttachment | string | null,
  autoFetch: boolean = true
) {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);

  // Extract the file URL from the input
  const getFileUrl = useCallback((): string | null => {
    if (!fileInput) return null;
    
    // If fileInput is a string, assume it's already an S3 key or URL
    if (typeof fileInput === 'string') {
      return fileInput;
    }
    
    // Otherwise, extract URL from file attachment object
    return fileInput.url || fileInput.fileUrl || null;
  }, [fileInput]);

  // Function to fetch the presigned URL
  const fetchUrl = useCallback(async () => {
    const fileUrl = getFileUrl();
    if (!fileUrl) {
      setError(new Error('No valid file URL provided'));
      return null;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await downloadFileApi(fileUrl);
      
      if (result && result.fileUrl) {
        setPresignedUrl(result.fileUrl);
        return result.fileUrl;
      } else {
        throw new Error('Failed to get presigned URL from API');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setError(error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getFileUrl]);

  // Fetch URL on mount if autoFetch is true
  useEffect(() => {
    if (autoFetch && getFileUrl()) {
      fetchUrl();
    }
  }, [autoFetch, fetchUrl, getFileUrl]);

  return {
    loading,
    error,
    presignedUrl,
    fetchUrl,
  };
}

export default usePresignedUrl;