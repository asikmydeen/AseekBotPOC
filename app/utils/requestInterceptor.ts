// app/utils/requestInterceptor.ts
import { TEST_USER_ID } from './apiService';

/**
 * Intercepts API requests and modifies them if needed
 * @param url The URL to make the request to
 * @param method The HTTP method to use
 * @param body The request body
 * @returns Modified request parameters
 */
export function interceptRequest(url: string, method: string, body: any) {
  // Only intercept POST requests to the message endpoint
  if (method === 'POST' && url.includes('/message')) {
    console.log('Intercepting message request:', body);
    
    // Check if this is a vendor-sow-comparison-analysis-v1 prompt
    if (body.promptId === 'vendor-sow-comparison-analysis-v1' || 
        (body.promptMetadata && body.promptMetadata.promptId === 'vendor-sow-comparison-analysis-v1')) {
      
      console.log('Detected vendor-sow-comparison-analysis-v1 prompt, adding s3Files');
      
      // Get the file names from the variables
      const sowFileName = body.variables?.sow_doc || 
                         body.promptMetadata?.variables?.sow_doc || 
                         'SOW SIN60_67 intersite access -Final.docx';
      
      const bidDoc1FileName = body.variables?.bid_doc_1 || 
                             body.promptMetadata?.variables?.bid_doc_1 || 
                             'Bid Template - General - Acme Associates R2.xlsx';
      
      const bidDoc2FileName = body.variables?.bid_doc_2 || 
                             body.promptMetadata?.variables?.bid_doc_2 || 
                             'Bid Template - Fixed Rates - LSK - SIN V2 Pedestrian Gate.xlsx';
      
      // Create the s3Files array with the correct format
      const s3Files = [
        {
          name: 'Acme_Bid',
          fileName: bidDoc1FileName,
          s3Url: `https://aseekbot-files-ammydeen9.s3.us-east-1.amazonaws.com/uploads/${TEST_USER_ID}/${Date.now()}_${encodeURIComponent(bidDoc1FileName)}`,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        },
        {
          name: 'LSK_Bid',
          fileName: bidDoc2FileName,
          s3Url: `https://aseekbot-files-ammydeen9.s3.us-east-1.amazonaws.com/uploads/${TEST_USER_ID}/${Date.now()}_${encodeURIComponent(bidDoc2FileName)}`,
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        },
        {
          name: 'SOW',
          fileName: sowFileName,
          s3Url: `https://aseekbot-files-ammydeen9.s3.us-east-1.amazonaws.com/uploads/${TEST_USER_ID}/${Date.now()}_${encodeURIComponent(sowFileName)}`,
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        }
      ];
      
      // Add the s3Files array to the request body
      body.s3Files = s3Files;
      
      // Also add it to the promptMetadata if it exists
      if (body.promptMetadata) {
        body.promptMetadata.s3Files = s3Files;
      }
      
      console.log('Modified request body:', body);
    }
  }
  
  return { url, method, body };
}
