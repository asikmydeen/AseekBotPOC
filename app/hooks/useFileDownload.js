import { useState } from 'react';
import axios from 'axios';
import { API } from 'aws-amplify';

/**
 * Custom hook for handling file downloads
 * @returns {Object} - Download functionality and states
 */
const useFileDownload = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(null);

  /**
   * Downloads a file using a presigned URL
   * @param {string} fileKey - The key of the file to download
   * @param {string} fileName - The name to save the file as
   */
  const downloadFile = async (fileKey, fileName) => {
    setIsDownloading(true);
    setDownloadError(null);

    try {
      // Get the presigned URL from the API
      const response = await API.get('files', '/download', {
        queryStringParameters: {
          key: fileKey,
        },
      });

      // Extract the presigned URL from the response
      // This handles both cases where the response is a direct URL string
      // or a JSON object containing the URL
      let presignedUrl;
      if (typeof response === 'object' && response !== null) {
        // If response is an object, try to extract the URL from common properties
        presignedUrl = response.url || response.presignedUrl || response.downloadUrl;
        
        if (!presignedUrl) {
          // If no common URL property is found, check if the response itself is the URL
          const firstKey = Object.keys(response)[0];
          if (typeof response[firstKey] === 'string' && response[firstKey].startsWith('http')) {
            presignedUrl = response[firstKey];
          } else {
            throw new Error('Could not extract presigned URL from response');
          }
        }
      } else {
        // If response is a string, use it directly
        presignedUrl = response;
      }

      // Validate the URL
      if (!presignedUrl || typeof presignedUrl !== 'string') {
        throw new Error('Invalid presigned URL received');
      }

      // Download the file using the presigned URL
      const fileResponse = await axios.get(presignedUrl, {
        responseType: 'blob',
      });

      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(new Blob([fileResponse.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setIsDownloading(false);
    } catch (error) {
      setIsDownloading(false);
      
      // Handle specific error cases
      if (error.message && error.message.includes('SignatureDoesNotMatch')) {
        console.error('Signature mismatch error when downloading file:', error);
        setDownloadError('The download link is invalid or has expired. Please try again.');
      } else if (error.response && error.response.status === 403) {
        console.error('Access denied when downloading file:', error);
        setDownloadError('You do not have permission to download this file.');
      } else {
        console.error('Error downloading file:', error);
        setDownloadError('Failed to download the file. Please try again later.');
      }
    }
  };

  return {
    downloadFile,
    isDownloading,
    downloadError,
  };
};

export default useFileDownload;