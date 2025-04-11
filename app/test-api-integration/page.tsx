"use client";
import React, { useState, useEffect } from 'react';
import EnhancedFileDialog from '../components/prompts/EnhancedFileDialog';
import { UploadedFile } from '../types/shared';

export default function TestApiIntegrationPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [result, setResult] = useState<{
    files: UploadedFile[];
    variables: Record<string, string>;
  } | null>(null);
  
  // Add state for API response and status polling
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [statusResponse, setStatusResponse] = useState<any>(null);
  const [pollInterval, setPollInterval] = useState<NodeJS.Timeout | null>(null);
  
  // Clean up interval on component unmount
  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

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
        name: file.name || file.fileName,
        fileName: file.fileName || file.name,
        s3Url: file.s3Url || file.url,
        mimeType: file.type
      }));
      
      // Create a user message with the files
      const fileNames = files.map(f => f.fileName || f.name).join(', ');
      const userMessage = `Please analyze these documents: ${fileNames}`;
      
      console.log('Sending message to API with payload:', {
        promptId: 'test-api-integration-prompt',
        userId: 'test-user',
        sessionId: 'test-session',
        chatId: 'test-chat',
        s3Files,
        message: userMessage
      });
      
      // Call API to send message with prompt and files
      const response = await fetch('/api/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promptId: 'test-api-integration-prompt',
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
      
      // Start polling for status
      setApiResponse(data);
      if (data.requestId) {
        setIsPolling(true);
        
        // Set up polling interval
        const interval = setInterval(async () => {
          try {
            const statusResponse = await fetch(`/api/status/${data.requestId}?userId=test-user`);
            if (!statusResponse.ok) {
              throw new Error('Failed to check status');
            }
            
            const statusData = await statusResponse.json();
            console.log('Status response:', statusData);
            setStatusResponse(statusData);
            
            // If status is completed, stop polling
            if (statusData.status === 'COMPLETED') {
              setIsPolling(false);
              if (pollInterval) {
                clearInterval(pollInterval);
                setPollInterval(null);
              }
            }
          } catch (error) {
            console.error('Error polling status:', error);
            setIsPolling(false);
            if (pollInterval) {
              clearInterval(pollInterval);
              setPollInterval(null);
            }
          }
        }, 1000);
        
        setPollInterval(interval);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. See console for details.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">API Integration Test</h1>
        
        <div className="mb-8">
          <p className="mb-4">
            This test page demonstrates the enhanced file dialog with API integration.
            The dialog now features:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Modal dropdown selectors that appear in the center of the screen</li>
            <li>Improved file list with better visual feedback</li>
            <li>API integration with the /message endpoint</li>
            <li>Status polling to track the progress of the request</li>
            <li>Fixed issue with the same file being filled for multiple fields</li>
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
            <h2 className="text-xl font-semibold mb-2">Dialog Result:</h2>
            
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
        
        {apiResponse && (
          <div className="mt-8 p-4 border rounded-md bg-blue-50 dark:bg-blue-900/30">
            <h2 className="text-xl font-semibold mb-2">API Response:</h2>
            <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md overflow-auto text-sm">
              {JSON.stringify(apiResponse, null, 2)}
            </pre>
            
            <div className="mt-4">
              <h3 className="text-lg font-medium">Status:</h3>
              {isPolling ? (
                <div className="flex items-center mt-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent mr-2"></div>
                  <span>Polling for status...</span>
                </div>
              ) : statusResponse ? (
                <div>
                  <div className="flex items-center mt-2">
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${statusResponse.status === 'COMPLETED' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                    <span>{statusResponse.status}</span>
                    {statusResponse.progress !== undefined && (
                      <span className="ml-2">({statusResponse.progress}%)</span>
                    )}
                  </div>
                  
                  {statusResponse.completion && (
                    <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
                      <h4 className="font-medium mb-2">Completion:</h4>
                      <p>{statusResponse.completion.text}</p>
                      <div className="mt-2 text-xs text-gray-500">
                        Timestamp: {new Date(statusResponse.completion.timestamp).toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p>No status information available</p>
              )}
            </div>
          </div>
        )}

        <EnhancedFileDialog
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
          onSubmit={handleSubmit}
          promptId="test-api-integration-prompt"
          promptTitle="Test Prompt with API Integration"
          requiredFileCount={2}
          requiredVariables={Object.keys(variableTypes)}
          variableTypes={variableTypes}
        />
      </div>
    </div>
  );
}
