import { MessageType } from "../types/shared";

/**
 * Deep search for a property in an object
 * This helps find properties that might be deeply nested
 */
function findPropertyDeep(obj: any, targetProp: string, maxDepth: number = 3, currentDepth: number = 0): any {
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

  // Extract insights using a simplified approach
  let insights = null;

  // Primary path for insights - check the most common location first
  if (status.result?.insights) {
    insights = status.result.insights;
  } else if (status.insights) {
    insights = status.insights;
  } else if (status.result) {
    insights = status.result;
  }

  // Extract document metadata with priority on sourceDocument
  const documentId = status.result?.sourceDocument?.documentId ||
                     status.result?.documentId ||
                     status.documentId ||
                     'unknown';
  const fileType = status.result?.sourceDocument?.fileType ||
                   status.result?.fileType ||
                   status.fileType ||
                   'document';

  // Get document name (simplified)
  let documentName = "document";
  const s3Key = status.result?.s3Key || status.s3Key;
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

    // Format the content sections
    if (typeof structuredInsights === 'string') {
      analysisText += "### Summary\n";
      analysisText += structuredInsights + "\n\n";
    } else {
      // Extract all content sections
      const summary = structuredInsights.summary ||
        `Analysis of ${fileType.toUpperCase()} file completed.`;

      const keyPoints = Array.isArray(structuredInsights.keyPoints) ?
        structuredInsights.keyPoints.filter((point: any) => point && typeof point === 'string') : [];

      const recommendations = Array.isArray(structuredInsights.recommendations) ?
        structuredInsights.recommendations.filter((rec: any) => rec && typeof rec === 'string') : [];

      const nextSteps = structuredInsights.nextSteps || '';

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
    }
  } else {
    // Fallback for when no insights are found
    analysisText += "### Summary\n";
    analysisText += `This is a ${fileType.toUpperCase()} document that has been processed.\n\n`;
    analysisText += "No detailed insights are available for this document.\n\n";
  }

  // Add document ID for reference
  analysisText += "\n---\n*Document ID: " + documentId + "*\n";

  // Create appropriate suggestions
  const suggestions = ['Tell me more about this document', 'What are the key insights?', 'How should I use this document?'];

  // Create the bot message
  return {
    sender: 'bot',
    text: analysisText,
    timestamp: status.timestamp || new Date().toISOString(),
    suggestions: suggestions,
    chatId: status.requestId || documentId,
    chatSessionId: chatSessionId,
    agentType: 'bid-analysis' // Mark this as a document analysis message
  };
}
