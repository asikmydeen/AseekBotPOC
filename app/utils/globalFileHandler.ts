// app/utils/globalFileHandler.ts
import { UploadedFile } from '../types/shared';

// Define the global function type
declare global {
  interface Window {
    addExternalFileToUpload: (file: UploadedFile) => void;
  }
}

/**
 * Initialize the global file handler
 * This function adds a global function to the window object that can be used to add files to the upload queue
 */
export function initGlobalFileHandler() {
  // Initialize the global function if it doesn't exist
  if (typeof window !== 'undefined' && !window.addExternalFileToUpload) {
    window.addExternalFileToUpload = (file: UploadedFile) => {
      console.log('Global file handler called with file:', file.name);
      
      // Create a custom event to add the file
      const event = new CustomEvent('addExternalFile', { detail: file });
      window.dispatchEvent(event);
    };
    
    console.log('Global file handler initialized');
  }
}
