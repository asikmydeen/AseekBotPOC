/**
 * Function: normalizeS3Url
 * -------------------------
 * This helper function takes a file URL (which might include query parameters and an alternate bucket name) and returns a normalized version:
 *  - It removes any query parameters.
 *  - It normalizes the bucket name to the correct one (in our case, replacing 'aseekbot-files.s3' with 'aseekbot-files-ammydeen5.s3').
 *
 * Usage:
 * const normalizedUrl = normalizeS3Url(file.url || file.fileUrl);
 */

export function normalizeS3Url(url: string): string {
  if (!url) return url;

  // Remove query parameters by taking the part before '?'
  const urlWithoutParams = url.split('?')[0];

  // Normalize the bucket name if necessary
  // Replace 'aseekbot-files.s3' with 'aseekbot-files-ammydeen5.s3'
  if (urlWithoutParams.includes('aseekbot-files.s3')) {
    return urlWithoutParams.replace('aseekbot-files.s3', 'aseekbot-files-ammydeen5.s3');
  }

  return urlWithoutParams;
}

export default normalizeS3Url;