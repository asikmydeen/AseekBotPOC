// app/utils/vendorAnalysisApi.ts
import { LAMBDA_ENDPOINTS } from './lambdaApi';
import { TEST_USER_ID } from './apiService';

/**
 * Makes a direct API request to the message endpoint with the exact payload format needed for vendor analysis
 */
export async function sendVendorAnalysisRequest(
  chatSessionId: string,
  files: any[],
  variables: Record<string, string>
) {
  console.log('Making direct vendor analysis API request');

  // Create the exact payload format needed
  const payload = {
    promptId: 'vendor-sow-comparison-analysis-v1',
    userId: TEST_USER_ID,
    sessionId: chatSessionId,
    chatId: chatSessionId,
    variables: variables,
    s3Files: []
  };

  // Format files with the exact naming convention needed
  if (files && files.length > 0) {
    // Find SOW file
    const sowFile = files.find(file =>
      file.name.toLowerCase().includes('sow') ||
      (file.type && file.type.toLowerCase().includes('word')));

    // Find LSK file
    const lskFile = files.find(file =>
      file.name.toLowerCase().includes('lsk') ||
      file.name.toLowerCase().includes('sin v2'));

    // Find Wah Loon file
    const wahLoonFile = files.find(file =>
      file.name.toLowerCase().includes('wah loon') ||
      file.name.toLowerCase().includes('sin061'));

    // Add files in the correct order with the correct names
    if (lskFile) {
      payload.s3Files.push({
        name: 'LSK_Bid',
        fileName: lskFile.name,
        s3Url: lskFile.url || lskFile.fileUrl || lskFile.s3Url || '',
        mimeType: lskFile.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
    }

    if (wahLoonFile) {
      payload.s3Files.push({
        name: 'Acme_Bid',
        fileName: wahLoonFile.name,
        s3Url: wahLoonFile.url || wahLoonFile.fileUrl || wahLoonFile.s3Url || '',
        mimeType: wahLoonFile.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
    }

    if (sowFile) {
      payload.s3Files.push({
        name: 'SOW',
        fileName: sowFile.name,
        s3Url: sowFile.url || sowFile.fileUrl || sowFile.s3Url || '',
        mimeType: sowFile.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      });
    }
  }

  console.log('Sending vendor analysis request with payload:', JSON.stringify(payload, null, 2));

  // Make the API request directly
  try {
    const response = await fetch(LAMBDA_ENDPOINTS.message, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'aseekbot-dev-key'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('Vendor analysis API response:', data);
    return data;
  } catch (error) {
    console.error('Error making vendor analysis API request:', error);
    throw error;
  }
}
