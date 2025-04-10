"use client";
import React, { useState } from 'react';
import EnhancedFileDialog from '../components/prompts/EnhancedFileDialog';
import { UploadedFile } from '../types/shared';

export default function TestModalDropdownPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [result, setResult] = useState<{
    files: UploadedFile[];
    variables: Record<string, string>;
  } | null>(null);

  // Test with different variable types
  const variableTypes = {
    'document_file': { type: 'file' },
    'reference_file': { type: 'file' },
    'user_name': { type: 'text' },
    'item_count': { type: 'number' },
    'start_date': { type: 'date' },
    'priority': { type: 'select', options: ['Low', 'Medium', 'High'] }
  };

  const handleSubmit = async (files: UploadedFile[], variables: Record<string, string>) => {
    console.log('Files submitted:', files);
    console.log('Variables submitted:', variables);
    setResult({ files, variables });
    setIsDialogOpen(false);

    try {
      // Format files for API
      const s3Files = files.map(file => ({
        name: file.name,
        fileName: file.fileName || file.name,
        s3Url: file.s3Url || file.url,
        mimeType: file.type
      }));

      // Create a user message with the files
      const fileNames = files.map(f => f.fileName || f.name).join(', ');
      const userMessage = `Please analyze these documents: ${fileNames}`;

      // Call API to send message with prompt and files
      const response = await fetch('/api/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptId: 'test-modal-dropdown-prompt',
          userId: 'test-user',
          sessionId: 'test-session',
          chatId: 'test-chat',
          s3Files,
          message: userMessage
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      console.log('API response:', data);

      // You would typically start polling for status here
      // and update the UI accordingly
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. See console for details.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Modal File Dropdown Test</h1>

        <div className="mb-8">
          <p className="mb-4">
            This test page demonstrates the enhanced file dialog with modal dropdown selectors for file variables.
            The dialog now features:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Modal dropdown selectors that appear in the center of the screen</li>
            <li>Improved file list with better visual feedback</li>
            <li>Search functionality within the dropdown</li>
            <li>Direct file upload from the dropdown</li>
            <li>Clear selection buttons</li>
            <li>Appropriate input types for different variable types</li>
          </ul>
        </div>

        <button
          onClick={() => setIsDialogOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Open Dialog
        </button>

        {result && (
          <div className="mt-8 p-4 border rounded-md">
            <h2 className="text-xl font-semibold mb-2">Result:</h2>

            <h3 className="text-lg font-medium mt-4">Files:</h3>
            {result.files.length === 0 ? (
              <p className="text-gray-500">No files selected</p>
            ) : (
              <ul className="list-disc pl-5">
                {result.files.map((file, index) => (
                  <li key={index}>
                    {file.fileName || file.name} ({file.type}, {file.size} bytes)
                  </li>
                ))}
              </ul>
            )}

            <h3 className="text-lg font-medium mt-4">Variables:</h3>
            {Object.keys(result.variables).length === 0 ? (
              <p className="text-gray-500">No variables filled</p>
            ) : (
              <ul className="list-disc pl-5">
                {Object.entries(result.variables).map(([key, value], index) => (
                  <li key={index}>
                    <strong>{key}:</strong> {value}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <EnhancedFileDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSubmit={handleSubmit}
          promptId="test-modal-dropdown-prompt"
          promptTitle="Test Prompt with Modal File Dropdown Selectors"
          requiredFileCount={2}
          requiredVariables={Object.keys(variableTypes)}
          variableTypes={variableTypes}
        />
      </div>
    </div>
  );
}
