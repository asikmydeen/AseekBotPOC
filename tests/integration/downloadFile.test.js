const request = require('supertest');
const { URL } = require('url');

// Get the API endpoint from environment variables or use a default for local testing
const API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:3000';

describe('Download File API Integration Tests', () => {
  // Test file key to use in tests
  const testFileKey = 'test-files/sample.pdf';
  
  describe('GET /files/download', () => {
    it('should return a valid presigned URL with HTTP 200', async () => {
      // Make GET request with query parameters
      const response = await request(API_ENDPOINT)
        .get(`/files/download?fileKey=${encodeURIComponent(testFileKey)}`)
        .expect('Content-Type', /json/)
        .expect(200);
      
      // Verify response structure
      expect(response.body).toHaveProperty('url');
      
      // Verify URL format
      const presignedUrl = response.body.url;
      expect(typeof presignedUrl).toBe('string');
      
      // Validate URL structure
      expect(() => new URL(presignedUrl)).not.toThrow();
      
      // Verify URL starts with expected S3 bucket URL
      expect(presignedUrl.startsWith('https://aseek-bot-uploads.s3')).toBe(true);
      
      // Verify URL contains the file key
      expect(presignedUrl.includes(encodeURIComponent(testFileKey))).toBe(true);
    });
    
    it('should return HTTP 400 when fileKey is missing', async () => {
      // Make GET request without fileKey
      const response = await request(API_ENDPOINT)
        .get('/files/download')
        .expect('Content-Type', /json/)
        .expect(400);
      
      // Verify error response
      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('fileKey');
    });
  });
  
  describe('POST /files/download', () => {
    it('should return a valid presigned URL with HTTP 200', async () => {
      // Make POST request with JSON body
      const response = await request(API_ENDPOINT)
        .post('/files/download')
        .send({ fileKey: testFileKey })
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(200);
      
      // Verify response structure
      expect(response.body).toHaveProperty('url');
      
      // Verify URL format
      const presignedUrl = response.body.url;
      expect(typeof presignedUrl).toBe('string');
      
      // Validate URL structure
      expect(() => new URL(presignedUrl)).not.toThrow();
      
      // Verify URL starts with expected S3 bucket URL
      expect(presignedUrl.startsWith('https://aseek-bot-uploads.s3')).toBe(true);
      
      // Verify URL contains the file key
      expect(presignedUrl.includes(encodeURIComponent(testFileKey))).toBe(true);
    });
    
    it('should return HTTP 400 when fileKey is missing', async () => {
      // Make POST request without fileKey
      const response = await request(API_ENDPOINT)
        .post('/files/download')
        .send({})
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);
      
      // Verify error response
      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('fileKey');
    });
    
    it('should return HTTP 400 when fileKey is empty', async () => {
      // Make POST request with empty fileKey
      const response = await request(API_ENDPOINT)
        .post('/files/download')
        .send({ fileKey: '' })
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400);
      
      // Verify error response
      expect(response.body).toHaveProperty('statusCode', 400);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('fileKey');
    });
  });
  
  describe('URL format validation', () => {
    it('should return a URL without extra JSON wrapping', async () => {
      // Make request to get the URL
      const response = await request(API_ENDPOINT)
        .post('/files/download')
        .send({ fileKey: testFileKey })
        .set('Content-Type', 'application/json')
        .expect(200);
      
      // Get the URL from the response
      const presignedUrl = response.body.url;
      
      // Verify the URL is a string, not an object or JSON string
      expect(typeof presignedUrl).toBe('string');
      
      // Ensure the URL doesn't contain unexpected JSON characters
      expect(presignedUrl).not.toContain('{"url":');
      expect(presignedUrl).not.toContain('"}');
      
      // Verify the URL is properly formatted
      const urlObj = new URL(presignedUrl);
      expect(urlObj.protocol).toBe('https:');
      expect(urlObj.hostname).toContain('aseek-bot-uploads.s3');
      
      // Verify URL parameters
      const params = urlObj.searchParams;
      expect(params.has('X-Amz-Algorithm')).toBe(true);
      expect(params.has('X-Amz-Credential')).toBe(true);
      expect(params.has('X-Amz-Date')).toBe(true);
      expect(params.has('X-Amz-Expires')).toBe(true);
      expect(params.has('X-Amz-Signature')).toBe(true);
    });
  });
});