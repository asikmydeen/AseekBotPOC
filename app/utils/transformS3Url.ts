/**
 * Utility function to transform HTTPS S3 URLs to S3 URI format
 * 
 * @param s3Url - The HTTPS URL of the S3 object (e.g., https://bucket-name.s3.amazonaws.com/path/to/file.txt)
 * @returns The S3 URI in the format s3://bucket/key
 * @throws Error if the URL is invalid or cannot be transformed
 */
export function transformS3Url(s3Url: string): string {
  // Return the original string if it's already in S3 URI format
  if (s3Url.startsWith('s3://')) {
    return s3Url;
  }

  try {
    // Parse the URL
    const url = new URL(s3Url);
    
    // Extract bucket name from hostname
    // The bucket name is typically the first part of the hostname
    const hostnameParts = url.hostname.split('.');
    const bucketName = hostnameParts[0];
    
    // Extract the key from the pathname
    // Remove leading slash if present
    const key = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
    
    // Return the formatted S3 URI
    return `s3://${bucketName}/${key}`;
  } catch (error) {
    // Handle errors during URL parsing
    throw new Error(`Failed to transform S3 URL: ${s3Url}. Error: ${(error as Error).message}`);
  }
}

export default transformS3Url;