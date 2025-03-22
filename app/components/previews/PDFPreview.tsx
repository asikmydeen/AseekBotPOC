import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import styles from './PDFPreview.module.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface PDFPreviewProps {
  fileUrl: string;
}

const PDFPreview: React.FC<PDFPreviewProps> = ({ fileUrl }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setLoading(false);
  };

  const onDocumentLoadError = (error: Error) => {
    setError(error);
    setLoading(false);
  };

  const goToPreviousPage = () => {
    setPageNumber(prevPageNumber => Math.max(prevPageNumber - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prevPageNumber => Math.min(prevPageNumber + 1, numPages || 1));
  };

  return (
    <div className={styles.pdfPreviewContainer}>
      {loading && <div className={styles.loadingIndicator}>Loading PDF...</div>}
      
      {error && (
        <div className={styles.errorContainer}>
          <p>Error loading PDF: {error.message}</p>
        </div>
      )}

      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        className={styles.pdfDocument}
      >
        <Page 
          pageNumber={pageNumber} 
          className={styles.pdfPage}
          renderTextLayer={true}
          renderAnnotationLayer={true}
        />
      </Document>

      {numPages && (
        <div className={styles.pdfControls}>
          <button 
            onClick={goToPreviousPage} 
            disabled={pageNumber <= 1}
            className={styles.navButton}
          >
            Previous
          </button>
          
          <span className={styles.pageInfo}>
            Page {pageNumber} of {numPages}
          </span>
          
          <button 
            onClick={goToNextPage} 
            disabled={pageNumber >= numPages}
            className={styles.navButton}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default PDFPreview;