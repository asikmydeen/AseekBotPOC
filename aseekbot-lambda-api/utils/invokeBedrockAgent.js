const {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} = require('@aws-sdk/client-bedrock-agent-runtime');

// Constants for retry mechanism
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second base delay

async function retryWithExponentialBackoff(operation) {
  let lastError = new Error('Operation failed after maximum retries');

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const isRetryable =
        error instanceof Error &&
        (error.message.includes('DependencyFailedException') ||
         error.message.includes('timeout') ||
         error.message.includes('Try the request again'));

      if (!isRetryable) {
        throw error;
      }

      console.error('Retry attempt failed with error:', error);

      if (attempt < MAX_RETRIES - 1) {
        const delay = BASE_DELAY * Math.pow(2, attempt) * (0.5 + Math.random() * 0.5);
        console.log(`Retrying operation after ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

function transformS3Url(s3Url) {
  if (!s3Url.startsWith('https://')) {
    return s3Url;
  }

  try {
    const url = new URL(s3Url);
    const hostnameParts = url.hostname.split('.');
    const bucketName = hostnameParts[0];
    const key = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
    return `s3://${bucketName}/${key}`;
  } catch (error) {
    console.error('Error transforming S3 URL:', error, 'Original URL:', s3Url);
    return s3Url;
  }
}

function normalizeUseCase(useCase) {
  if (!useCase) return 'CHAT';

  if (useCase.toLowerCase() === 'bid-analysis') {
    return 'CODE_INTERPRETER';
  }

  return useCase;
}

async function invokeBedrockAgent(prompt, sessionId, options = {}) {
  const client = new BedrockAgentRuntimeClient({
    region: options.region || 'us-east-1',
  });

  const agentId = options.agentId || 'AJBHXXILZN';
  const agentAliasId = options.agentAliasId || 'AVKP1ITZAA';

  const commandInput = {
    agentId,
    agentAliasId,
    sessionId,
    inputText: prompt,
  };

  const files = [];

  if (options.binaryFile) {
    const { name, content, type, useCase } = options.binaryFile;
    files.push({
      name,
      source: {
        byteContent: content,
        mediaType: type,
      },
      useCase: normalizeUseCase(useCase),
    });
  }

  if (options.s3Files && options.s3Files.length > 0) {
    options.s3Files.forEach(file => {
      const uri = transformS3Url(file.s3Url);
      console.log(`Transformed S3 URI for file ${file.name}:`, uri);

      files.push({
        name: file.name,
        source: {
          sourceType: 'S3',
          s3Location: {
            uri,
          },
        },
        useCase: normalizeUseCase(file.useCase),
      });
    });
  }

  if (files.length > 0) {
    commandInput.sessionState = {
      files: files,
    };
  }

  console.log('Invoking Bedrock agent with payload:', JSON.stringify(commandInput, null, 2));

  const command = new InvokeAgentCommand(commandInput);

  try {
    const response = await retryWithExponentialBackoff(() => client.send(command));
    
    let completion = '';

    if (response.completion) {
      for await (const chunk of response.completion) {
        if (chunk.chunk?.bytes) {
          const decoder = new TextDecoder();
          const text = decoder.decode(chunk.chunk.bytes);
          completion += text;
        }
      }
    }

    return {
      sessionId,
      completion,
    };
  } catch (error) {
    console.error('Error invoking Bedrock agent:', error);
    throw error;
  }
}

module.exports = {
  invokeBedrockAgent,
  transformS3Url
};
