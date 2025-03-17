/**
 * Utility functions for the Aseekbot application
 */

/**
 * Removes leading whitespace from multi-line strings while preserving relative indentation.
 * This is useful for formatting template literals in JSX or other contexts where
 * you want to maintain the structure of the text but remove the indentation
 * caused by the code's formatting.
 * 
 * @param {string} text - The multi-line string to process
 * @returns {string} The processed string with consistent indentation removed
 */
export function stripIndent(text: string): string {
  if (!text) return '';
  
  // Split the text into lines
  const lines = text.split('\n');
  
  // Find the minimum indentation level (excluding empty lines)
  const minIndent = lines
    .filter(line => line.trim().length > 0)
    .reduce((min, line) => {
      const indent = line.match(/^\s*/)?.[0].length || 0;
      return indent < min ? indent : min;
    }, Infinity) || 0;
  
  // Remove the common indentation from each line
  return lines
    .map(line => line.slice(minIndent))
    .join('\n')
    .trim();
}