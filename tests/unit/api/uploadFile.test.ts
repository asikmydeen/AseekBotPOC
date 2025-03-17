import { createMocks } from 'node-mocks-http';
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import handler from '../../../pages/api/uploadFile';

// Mock the fs module
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn().mockResolvedValue(undefined),
  },
  existsSync: jest.fn().mockReturnValue(true),
}));

// Mock the path module
jest.mock('path', () => ({
  join: jest.fn().mockImplementation((...args) => args.join('/')),
  resolve: jest.fn().mockImplementation((...args) => args.join('/')),
}));

// Mock the formidable module
jest.mock('formidable', () => {
  return {
    IncomingForm: jest.fn().mockImplementation(() => ({
      parse: jest.fn().mockImplementation((req, callback) => {
        const fields = { sessionId: req.headers.sessionid };
        const files = req.headers.includeFile ? {
          file: {
            filepath: 'temp/testfile.txt',
            originalFilename: 'testfile.txt',
            mimetype: 'text/plain',
            size: 1024,
          }
        } : {};
        callback(null, fields, files);
      }),
    })),
  };
});

describe('Upload File API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should successfully upload a file and return the file URL', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      headers: {
        sessionId: 'test-session-123',
        includeFile: true,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('fileUrl');
    expect(responseData.fileUrl).toContain('uploads/test-session-123/testfile.txt');
    expect(fs.promises.mkdir).toHaveBeenCalled();
    expect(fs.promises.writeFile).toHaveBeenCalled();
  });

  test('should return 400 when sessionId is missing', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      headers: {
        includeFile: true,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('error');
    expect(responseData.error).toContain('Session ID is required');
  });

  test('should return 400 when file is missing', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      headers: {
        sessionId: 'test-session-123',
        includeFile: false,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('error');
    expect(responseData.error).toContain('No file uploaded');
  });

  test('should return 405 for non-POST requests', async () => {
    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'GET',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('error');
    expect(responseData.error).toContain('Method not allowed');
  });

  test('should handle server errors during file processing', async () => {
    // Mock a failure in the writeFile function
    (fs.promises.writeFile as jest.Mock).mockRejectedValueOnce(new Error('Failed to write file'));

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: 'POST',
      headers: {
        sessionId: 'test-session-123',
        includeFile: true,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('error');
    expect(responseData.error).toContain('Error processing file');
  });
});