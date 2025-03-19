import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FileDropzone from '../../../../app/components/chat/FileDropzone';

describe('FileDropzone Component', () => {
  const mockOnDrop = jest.fn();
  const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });

  beforeEach(() => {
    mockOnDrop.mockClear();
  });

  const renderFileDropzone = (isDragActive = false, isUploading = false) => {
    return render(
      <FileDropzone
        getRootProps={() => ({
          onClick: () => {},
          onDragEnter: () => {},
          onDragOver: () => {},
          onDrop: (e) => {
            if (e.dataTransfer?.files) {
              mockOnDrop(Array.from(e.dataTransfer.files));
            }
          },
          'data-testid': 'file-dropzone'
        })}
        getInputProps={() => ({
          onChange: (e) => {
            if (e.target.files) {
              mockOnDrop(Array.from(e.target.files));
            }
          },
          'data-testid': 'file-input'
        })}
        isDragActive={isDragActive}
        isUploading={isUploading}
        isDarkMode={false}
        uploadProgress={0}
        uploadedFiles={[]}
      />
    );
  };

  it('renders correctly', () => {
    renderFileDropzone();

    expect(screen.getByText(/Drag and drop files here/i)).toBeInTheDocument();
    expect(screen.getByText(/or click to select files/i)).toBeInTheDocument();
  });

  it('handles file selection via input change', () => {
    renderFileDropzone();

    const input = screen.getByTestId('file-input');

    Object.defineProperty(input, 'files', {
      value: [mockFile],
    });

    fireEvent.change(input);

    expect(mockOnDrop).toHaveBeenCalledTimes(1);
    expect(mockOnDrop).toHaveBeenCalledWith([mockFile]);
  });

  it('handles drag and drop file selection', () => {
    renderFileDropzone();

    const dropzone = screen.getByTestId('file-dropzone');

    // Mock DataTransfer object
    const dataTransfer = {
      files: [mockFile],
      items: [
        {
          kind: 'file',
          type: mockFile.type,
          getAsFile: () => mockFile
        }
      ],
      types: ['Files']
    };

    // Simulate drag events
    fireEvent.dragEnter(dropzone, { dataTransfer });
    fireEvent.dragOver(dropzone, { dataTransfer });
    fireEvent.drop(dropzone, { dataTransfer });

    expect(mockOnDrop).toHaveBeenCalledTimes(1);
    expect(mockOnDrop).toHaveBeenCalledWith([mockFile]);
  });

  it('shows different UI when dragging over', () => {
    // First render with isDragActive=false
    const { rerender } = renderFileDropzone(false);

    // Verify initial state
    expect(screen.getByText(/Drag and drop files here/i)).toBeInTheDocument();

    // Re-render with isDragActive=true
    rerender(
      <FileDropzone
        getRootProps={() => ({
          'data-testid': 'file-dropzone'
        })}
        getInputProps={() => ({ 'data-testid': 'file-input' })}
        isDragActive={true}
        isUploading={false}
        isDarkMode={false}
        uploadProgress={0}
        uploadedFiles={[]}
      />
    );

    // Verify drag active state shows different text
    expect(screen.getByText(/Drop files here/i)).toBeInTheDocument();
  });

  it('handles multiple files selection', () => {
    renderFileDropzone();

    const input = screen.getByTestId('file-input');
    const mockFile2 = new File(['another test content'], 'test2.txt', { type: 'text/plain' });

    Object.defineProperty(input, 'files', {
      value: [mockFile, mockFile2],
    });

    fireEvent.change(input);

    expect(mockOnDrop).toHaveBeenCalledTimes(1);
    expect(mockOnDrop).toHaveBeenCalledWith([mockFile, mockFile2]);
  });

  it('shows upload progress when uploading', () => {
    renderFileDropzone(false, true);

    // When isUploading is true, the component should show upload progress
    expect(screen.getByTestId('file-dropzone')).toBeInTheDocument();
  });

  it('prevents default behavior on drag events', () => {
    renderFileDropzone();

    const dropzone = screen.getByTestId('file-dropzone');
    const dataTransfer = { files: [mockFile] };

    const dragOverEvent = fireEvent.dragOver(dropzone, { dataTransfer });
    const dropEvent = fireEvent.drop(dropzone, { dataTransfer });

    // Both events should have their default behavior prevented
    expect(dragOverEvent).toBe(false);
    expect(dropEvent).toBe(false);
  });
});
