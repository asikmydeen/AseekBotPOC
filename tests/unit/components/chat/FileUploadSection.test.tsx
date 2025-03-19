import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FileUploadSection from '../../../../app/components/chat/FileUploadSection';

// Mock the next/image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return <img {...props} />;
  },
}));

describe('FileUploadSection Component', () => {
  const mockFiles = [
    {
      id: '1',
      name: 'test-file-1.pdf',
      size: 1024,
      type: 'application/pdf',
    },
    {
      id: '2',
      name: 'test-file-2.jpg',
      size: 2048,
      type: 'image/jpeg',
    },
  ];

  const mockFilesWithProgress = [
    {
      id: '1',
      name: 'uploading-file.pdf',
      size: 1024,
      type: 'application/pdf',
      progress: 45,
    },
  ];

  const mockHandleRemove = jest.fn();

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders without files', () => {
    render(<FileUploadSection files={[]} onRemove={mockHandleRemove} />);
    
    // Component should render but not show any files
    expect(screen.queryByText(/test-file/)).not.toBeInTheDocument();
  });

  test('displays uploaded files correctly', () => {
    render(<FileUploadSection files={mockFiles} onRemove={mockHandleRemove} />);
    
    // Check if file names are displayed
    expect(screen.getByText('test-file-1.pdf')).toBeInTheDocument();
    expect(screen.getByText('test-file-2.jpg')).toBeInTheDocument();
    
    // Check if file sizes are displayed (1KB and 2KB)
    expect(screen.getByText('1 KB')).toBeInTheDocument();
    expect(screen.getByText('2 KB')).toBeInTheDocument();
  });

  test('shows progress bars for files being uploaded', () => {
    render(<FileUploadSection files={mockFilesWithProgress} onRemove={mockHandleRemove} />);
    
    // Check if file with progress is displayed
    expect(screen.getByText('uploading-file.pdf')).toBeInTheDocument();
    
    // Check if progress bar is rendered
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '45');
  });

  test('calls onRemove handler when remove button is clicked', () => {
    render(<FileUploadSection files={mockFiles} onRemove={mockHandleRemove} />);
    
    // Find all remove buttons
    const removeButtons = screen.getAllByRole('button');
    
    // Click the first remove button
    fireEvent.click(removeButtons[0]);
    
    // Check if the handler was called with the correct file id
    expect(mockHandleRemove).toHaveBeenCalledWith('1');
    
    // Click the second remove button
    fireEvent.click(removeButtons[1]);
    
    // Check if the handler was called with the correct file id
    expect(mockHandleRemove).toHaveBeenCalledWith('2');
    
    // Verify the handler was called exactly twice
    expect(mockHandleRemove).toHaveBeenCalledTimes(2);
  });

  test('handles files with different types correctly', () => {
    const mixedFiles = [
      {
        id: '1',
        name: 'document.pdf',
        size: 1024,
        type: 'application/pdf',
      },
      {
        id: '2',
        name: 'image.jpg',
        size: 2048,
        type: 'image/jpeg',
      },
      {
        id: '3',
        name: 'spreadsheet.xlsx',
        size: 3072,
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    ];

    render(<FileUploadSection files={mixedFiles} onRemove={mockHandleRemove} />);
    
    // Check if all file names are displayed
    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText('image.jpg')).toBeInTheDocument();
    expect(screen.getByText('spreadsheet.xlsx')).toBeInTheDocument();
    
    // Check if all file sizes are displayed
    expect(screen.getByText('1 KB')).toBeInTheDocument();
    expect(screen.getByText('2 KB')).toBeInTheDocument();
    expect(screen.getByText('3 KB')).toBeInTheDocument();
  });
});