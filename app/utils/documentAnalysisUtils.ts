import { MessageType } from "../types/shared";

/**
 * Deep search for a property in an object
 * This helps find properties that might be deeply nested
 */
function findPropertyDeep(obj: any, targetProp: string, maxDepth: number = 5, currentDepth: number = 0): any {
  if (!obj || typeof obj !== 'object' || currentDepth > maxDepth) {
    return undefined;
  }

  if (obj[targetProp] !== undefined) {
    return obj[targetProp];
  }

  for (const key in obj) {
    if (typeof obj[key] === 'object') {
      const found = findPropertyDeep(obj[key], targetProp, maxDepth, currentDepth + 1);
      if (found !== undefined) {
        return found;
      }
    }
  }

  return undefined;
}

/**
 * Recursively formats an object as markdown
 * This is useful for handling unknown or complex nested structures
 * @param obj The object to format
 * @param depth Current depth level (for indentation)
 * @returns Formatted markdown string
 */
function formatObjectAsMarkdown(obj: any, depth: number = 0): string {
  if (!obj || typeof obj !== 'object') {
    return obj?.toString() || '';
  }

  // If it's an array, format each item
  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (typeof item === 'object' && item !== null) {
        return `- ${formatObjectAsMarkdown(item, depth + 1)}`;
      } else {
        return `- ${item}`;
      }
    }).join('\n');
  }

  // For objects, format each property
  let result = '';
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];

      // Skip null or undefined values
      if (value === null || value === undefined) continue;

      // Format based on value type
      if (typeof value === 'object') {
        if (Array.isArray(value) && value.length > 0) {
          result += `${'  '.repeat(depth)}**${key}**:\n${formatObjectAsMarkdown(value, depth + 1)}\n`;
        } else if (Object.keys(value).length > 0) {
          result += `${'  '.repeat(depth)}**${key}**:\n${formatObjectAsMarkdown(value, depth + 1)}\n`;
        }
      } else {
        result += `${'  '.repeat(depth)}**${key}**: ${value}\n`;
      }
    }
  }

  return result;
}

/**
 * Creates a formatted message for document analysis
 *
 * This simplified version directly extracts the most important information from the status
 * response and formats it as a markdown message. It avoids complex nested parsing logic
 * and focuses on the most common response structure.
 *
 * @param status The status response containing document analysis
 * @param chatSessionId The current chat session ID
 * @returns A formatted message to display document analysis results
 */
export function createDocumentAnalysisMessage(status: any, chatSessionId: string): MessageType {
  console.log('Creating document analysis message from status');

  // Extract insights using a more comprehensive approach
  let insights = null;

  // Primary path for insights - check the most common location first
  if (status.result?.insights) {
    insights = status.result.insights;
  } else if (status.insights) {
    insights = status.insights;
  } else if (status.result) {
    insights = status.result;
  }

  // If insights is not found or doesn't contain expected properties, use deep search
  if (!insights ||
      (typeof insights === 'object' &&
       !insights.summary &&
       !insights.keyPoints &&
       !insights.recommendations &&
       !insights.nextSteps)) {

    // Try to find insights property using deep search
    const deepInsights = findPropertyDeep(status, 'insights', 5);
    if (deepInsights) {
      insights = deepInsights;
    }
  }

  // Check if insights contains a nested insights property
  if (insights && insights.insights) {
    insights = insights.insights;
  }

  // Extract document metadata with priority on sourceDocument
  const documentId = status.result?.sourceDocument?.documentId ||
                     status.result?.documentId ||
                     status.documentId ||
                     findPropertyDeep(status, 'documentId', 5) ||
                     'unknown';
  const fileType = status.result?.sourceDocument?.fileType ||
                   status.result?.fileType ||
                   status.fileType ||
                   findPropertyDeep(status, 'fileType', 5) ||
                   'document';

  // Get document name (improved)
  let documentName = "document";
  const s3Key = status.result?.s3Key || status.s3Key || findPropertyDeep(status, 's3Key', 5);
  if (s3Key) {
    const keyParts = s3Key.split('/');
    if (keyParts.length > 0) {
      documentName = decodeURIComponent(keyParts[keyParts.length - 1].replace(/\+/g, ' '));
    }
  }

  // Format the response as markdown
  let analysisText = `## Document Analysis: ${documentName}\n\n`;

  // Helper function to check if content is duplicate or contained in another section
  const isDuplicate = (text: string, otherTexts: string[]): boolean => {
    if (!text) return true;
    return otherTexts.some(otherText =>
      otherText && (
        text === otherText ||
        otherText.includes(text) ||
        text.includes(otherText)
      )
    );
  };

  // Handle different response formats
  if (insights) {
    // Try to extract structured data if available
    let structuredInsights = insights;

    // If insights is a string, try to parse it as JSON
    if (typeof insights === 'string') {
      try {
        structuredInsights = JSON.parse(insights);
      } catch (e) {
        structuredInsights = { summary: insights };
      }
    }

    // If insights contains a Bedrock completion that's a JSON string, parse it
    if (insights.bedrockResponse?.completion) {
      try {
        const parsed = JSON.parse(insights.bedrockResponse.completion);
        structuredInsights = parsed;
      } catch (e) {
        // If parsing fails, use the string directly
        structuredInsights = {
          summary: insights.bedrockResponse.completion
        };
      }
    }

    // Check for nested completion structures
    if (insights.completion && typeof insights.completion === 'string') {
      try {
        const parsed = JSON.parse(insights.completion);
        structuredInsights = parsed;
      } catch (e) {
        // If parsing fails, use the string directly
        if (!structuredInsights.summary) {
          structuredInsights.summary = insights.completion;
        }
      }
    }

    // Format the content sections
    if (typeof structuredInsights === 'string') {
      analysisText += "### Summary\n";
      analysisText += structuredInsights + "\n\n";
    } else {
      // Extract all content sections with deep property search if needed
      const summary = structuredInsights.summary ||
                     findPropertyDeep(structuredInsights, 'summary', 3) ||
                     `Analysis of ${fileType.toUpperCase()} file completed.`;

      // Extract key points with fallback to deep search
      let keyPoints: string[] = [];
      if (Array.isArray(structuredInsights.keyPoints)) {
        keyPoints = structuredInsights.keyPoints.filter((point: any) => point && typeof point === 'string');
      } else {
        const deepKeyPoints = findPropertyDeep(structuredInsights, 'keyPoints', 3);
        if (Array.isArray(deepKeyPoints)) {
          keyPoints = deepKeyPoints.filter((point: any) => point && typeof point === 'string');
        }
      }

      // Extract recommendations with fallback to deep search
      let recommendations: string[] = [];
      if (Array.isArray(structuredInsights.recommendations)) {
        recommendations = structuredInsights.recommendations.filter((rec: any) => rec && typeof rec === 'string');
      } else {
        const deepRecommendations = findPropertyDeep(structuredInsights, 'recommendations', 3);
        if (Array.isArray(deepRecommendations)) {
          recommendations = deepRecommendations.filter((rec: any) => rec && typeof rec === 'string');
        }
      }

      // Extract next steps with fallback to deep search
      const nextSteps = structuredInsights.nextSteps ||
                       findPropertyDeep(structuredInsights, 'nextSteps', 3) ||
                       '';

      // Add summary section
      analysisText += "### Summary\n";
      analysisText += summary + "\n\n";

      // Add key points if available and not duplicates of summary
      if (keyPoints.length > 0) {
        // Filter out key points that are duplicates of the summary
        const uniqueKeyPoints = keyPoints.filter((point: string) =>
          !isDuplicate(point, [summary])
        );

        if (uniqueKeyPoints.length > 0) {
          analysisText += "### Key Points\n";
          uniqueKeyPoints.forEach((point: any) => {
            analysisText += `- ${point}\n`;
          });
          analysisText += "\n";
        }
      }

      // Add recommendations if available and not duplicates
      if (recommendations.length > 0) {
        // Filter out recommendations that are duplicates of summary or key points
        const uniqueRecommendations = recommendations.filter((rec: string) =>
          !isDuplicate(rec, [summary, ...keyPoints])
        );

        if (uniqueRecommendations.length > 0) {
          analysisText += "### Recommendations\n";
          uniqueRecommendations.forEach((rec: any) => {
            analysisText += `- ${rec}\n`;
          });
          analysisText += "\n";
        }
      }

      // Add next steps if available and not a duplicate
      if (nextSteps && !isDuplicate(nextSteps, [summary])) {
        analysisText += "### Next Steps\n";
        analysisText += nextSteps + "\n\n";
      }

      // For any unknown structure that doesn't fit the known fields
      // Check if we have any additional insights that weren't captured
      const knownKeys = ['summary', 'keyPoints', 'recommendations', 'nextSteps'];
      const additionalKeys = Object.keys(structuredInsights).filter(
        key => !knownKeys.includes(key) &&
              typeof structuredInsights[key] === 'object' &&
              structuredInsights[key] !== null
      );

      if (additionalKeys.length > 0) {
        for (const key of additionalKeys) {
          const value = structuredInsights[key];
          if (value && typeof value === 'object' && Object.keys(value).length > 0) {
            analysisText += `### ${key.charAt(0).toUpperCase() + key.slice(1)}\n`;
            analysisText += formatObjectAsMarkdown(value) + "\n\n";
          }
        }
      }
    }
  } else {
    // Fallback for when no insights are found
    analysisText += "### Summary\n";
    analysisText += `This is a ${fileType.toUpperCase()} document that has been processed.\n\n`;

    // Try to extract any useful information from the status object
    const potentialInsightKeys = ['analysis', 'result', 'output', 'content', 'text'];
    let foundAdditionalContent = false;

    for (const key of potentialInsightKeys) {
      const content = findPropertyDeep(status, key, 5);
      if (content && typeof content === 'object' && Object.keys(content).length > 0) {
        analysisText += "### Additional Information\n";
        analysisText += formatObjectAsMarkdown(content) + "\n\n";
        foundAdditionalContent = true;
        break;
      } else if (content && typeof content === 'string' && content.length > 10) {
        analysisText += "### Additional Information\n";
        analysisText += content + "\n\n";
        foundAdditionalContent = true;
        break;
      }
    }

    if (!foundAdditionalContent) {
      analysisText += "No detailed insights are available for this document.\n\n";
    }
  }

  // Add document ID for reference
  analysisText += "\n---\n*Document ID: " + documentId + "*\n";

  // Create appropriate suggestions based on document type
  let suggestions = ['Tell me more about this document', 'What are the key insights?', 'How should I use this document?'];

  // Add document-type specific suggestions
  if (fileType.toLowerCase().includes('pdf') || fileType.toLowerCase().includes('doc')) {
    suggestions.push('Summarize the main points');
  } else if (fileType.toLowerCase().includes('csv') || fileType.toLowerCase().includes('xls')) {
    suggestions.push('What trends do you see in this data?');
  }

  // Debug log to help diagnose message formatting issues
  console.log('Document analysis message sources:', {
    hasFormattedMessage: !!status.formattedMessage,
    hasFormattedResponse: !!status.formattedResponse,
    hasDeepFormattedMessage: !!findPropertyDeep(status, 'formattedMessage', 5),
    analysisTextLength: analysisText.length
  });

  // Create the bot message
  // Use analysisText for both formattedMessage and text to ensure proper markdown rendering
  return {
    sender: 'bot',
    formattedMessage: analysisText,
    text: analysisText,
    timestamp: status.timestamp || new Date().toISOString(),
    suggestions: suggestions,
    chatId: status.requestId || documentId,
    chatSessionId: chatSessionId,
    agentType: 'bid-analysis' // Mark this as a document analysis message
  };
}
