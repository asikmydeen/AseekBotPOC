const {
  BedrockAgentRuntimeClient,
  InvokeAgentCommand,
} = require('@aws-sdk/client-bedrock-agent-runtime');

const MAX_RETRIES = 3;
const BASE_DELAY = 1000;

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
  if (s3Url.startsWith('s3://')) {
    return s3Url;
  }

  try {
    if (s3Url.includes('amazonaws.com')) {
      const url = new URL(s3Url);
      let bucketName = '';
      if (url.hostname.includes('.s3.')) {
        bucketName = url.hostname.split('.s3.')[0];
      } else if (url.hostname === 's3.amazonaws.com') {
        const pathParts = url.pathname.split('/');
        bucketName = pathParts[1];
        url.pathname = '/' + url.pathname.split('/').slice(2).join('/');
      } else {
        bucketName = url.hostname.split('.')[0];
      }

      const key = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
      return `s3://${bucketName}/${key}`;
    }

    const hostnameParts = new URL(s3Url).hostname.split('.');
    const bucketName = hostnameParts[0];
    const key = new URL(s3Url).pathname.startsWith('/') ?
      new URL(s3Url).pathname.substring(1) : new URL(s3Url).pathname;
    return `s3://${bucketName}/${key}`;

  } catch (error) {
    console.error(`Failed to transform S3 URL: ${s3Url}. Error:`, error);
    return s3Url;
  }
}

function normalizeUseCase(useCase, mimeType) {
  if (useCase && useCase.toLowerCase() === 'bid-analysis') {
    console.log('Using CODE_INTERPRETER for bid-analysis useCase');
    return 'CODE_INTERPRETER';
  }

  if (useCase) {
    const upperUseCase = useCase.toUpperCase();
    if (['CHAT', 'DOCUMENT_ANALYSIS', 'CODE_INTERPRETER'].includes(upperUseCase)) {
      console.log(`Using explicitly provided useCase: ${upperUseCase}`);
      return upperUseCase;
    }
  }

  if (mimeType) {
    if (mimeType.includes('spreadsheet') ||
      mimeType.includes('excel') ||
      mimeType.includes('openxmlformats-officedocument.spreadsheetml')) {
      console.log(`Using CODE_INTERPRETER for spreadsheet mime type: ${mimeType}`);
      return 'CODE_INTERPRETER';
    }

    if (mimeType.includes('wordprocessing') ||
      mimeType.includes('msword') ||
      mimeType.includes('openxmlformats-officedocument.wordprocessingml')) {
      console.log(`Using DOCUMENT_ANALYSIS for document mime type: ${mimeType}`);
      return 'DOCUMENT_ANALYSIS';
    }
  }

  console.log('Using default CHAT useCase');
  return 'CHAT';
}

async function invokeBedrockAgent(prompt, sessionId, options = {}) {
  const client = new BedrockAgentRuntimeClient({
    region: options.region || 'us-east-1',
  });

  const agentId = options.agentId || '7FDALECWCL';
  const agentAliasId = options.agentAliasId || '11OBDAVIQQ';

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

  if (options?.s3Files && options.s3Files.length > 0) {
    options.s3Files.forEach(file => {
      const uri = transformS3Url(file.s3Url);
      console.log(`Transformed S3 URI for file ${file.name}:`, uri);

      const fileUseCase = normalizeUseCase(file.useCase, file.mimeType);
      console.log(`Using useCase '${fileUseCase}' for file ${file.name}`);

      files.push({
        name: file.name,
        source: {
          sourceType: 'S3',
          s3Location: {
            uri
          }
        },
        useCase: fileUseCase
      });
    });
  }

  if (files.length > 0) {
    commandInput.sessionState = {
      files
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