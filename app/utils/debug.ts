// app/utils/debug.ts

/**
 * Safely logs objects to the console, handling circular references
 * and providing better formatted output
 *
 * @param label - A label for the log
 * @param data - The data to log
 */
export function debugLog(label: string, data: any): void {
    // Only log in development environment
    if (process.env.NODE_ENV !== 'development') {
        return;
    }

    console.group(`Debug: ${label}`);

    try {
        // For objects, try to JSON stringify with formatting
        if (typeof data === 'object' && data !== null) {
            // Create a function to handle circular references
            const getCircularReplacer = () => {
                const seen = new WeakSet();
                return (key: string, value: any) => {
                    if (typeof value === 'object' && value !== null) {
                        if (seen.has(value)) {
                            return '[Circular Reference]';
                        }
                        seen.add(value);
                    }
                    return value;
                };
            };

            // Try to stringify with 2 spaces of indentation
            const json = JSON.stringify(data, getCircularReplacer(), 2);
            console.log(json);
        } else {
            // For other types, just log directly
            console.log(data);
        }
    } catch (error) {
        console.log('Error stringifying object:', error);
        console.log('Original data:', data);
    }

    console.groupEnd();
}

/**
 * Special debug function for document analysis responses
 *
 * @param response - The document analysis response
 */
export function debugDocumentAnalysis(response: any): void {
    debugLog('Document Analysis Response', response);

    // Add specific checks for document analysis response structure
    const checks = {
        'isDocumentAnalysis exists': response?.isDocumentAnalysis !== undefined,
        'isDocumentAnalysis value': response?.isDocumentAnalysis,
        'result exists': response?.result !== undefined,
        'insights exists': response?.result?.insights !== undefined,
        'insights.summary exists': response?.result?.insights?.summary !== undefined,
        'insights.keyPoints exists': response?.result?.insights?.keyPoints !== undefined,
        'insights.keyPoints is array': Array.isArray(response?.result?.insights?.keyPoints),
        'insights.recommendations exists': response?.result?.insights?.recommendations !== undefined,
        'insights.recommendations is array': Array.isArray(response?.result?.insights?.recommendations),
        'insights.nextSteps exists': response?.result?.insights?.nextSteps !== undefined
    };

    debugLog('Document Analysis Checks', checks);

    // Show the insights structure
    if (response?.result?.insights) {
        debugLog('Document Analysis Insights', response.result.insights);
    }
}