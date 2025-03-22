import React, { useState } from 'react';

interface ImagePreviewProps {
  fileUrl: string;
  alt?: string;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ fileUrl, alt = 'Image preview' }) => {
  const [error, setError] = useState(false);

  const handleError = () => {
    setError(true);
  };

  if (error) {
    return (
      <div className="image-preview-error">
        <p>Unable to load image</p>
      </div>
    );
  }

  return (
    <div className="image-preview-container">
      <img
        src={fileUrl}
        alt={alt}
        className="image-preview"
        onError={handleError}
      />
    </div>
  );
};

// Add some default styling
const styles = `
  .image-preview-container {
    max-width: 100%;
    margin: 10px 0;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .image-preview {
    max-width: 100%;
    max-height: 400px;
    display: block;
    object-fit: contain;
  }
  
  .image-preview-error {
    padding: 20px;
    background-color: #f8f8f8;
    border: 1px solid #ddd;
    border-radius: 4px;
    color: #d32f2f;
    text-align: center;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.innerHTML = styles;
  document.head.appendChild(styleElement);
}

export default ImagePreview;