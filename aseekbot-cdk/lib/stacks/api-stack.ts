import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';

export interface ApiStackProps extends cdk.NestedStackProps {
  s3Bucket: s3.Bucket;
  requestStatusTable: dynamodb.Table;
  documentAnalysisStatusTable: dynamodb.Table;
  userInteractionsTable: dynamodb.Table;
  userFilesTable: dynamodb.Table;
  processingQueue: sqs.Queue;
  documentAnalysisStateMachine: sfn.StateMachine;
}

export class ApiStack extends cdk.NestedStack {
  public readonly apiEndpoint: string;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Create AWS SDK Layer
    const awsSdkLayer = new lambda.LayerVersion(this, 'AwsSdkLayer', {
      code: lambda.Code.fromAsset('layers/aws-sdk-v3'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
      description: 'AWS SDK v3 libraries and other common dependencies',
    });

    // Common environment variables for all Lambda functions
    const commonEnv = {
      AWS_S3_BUCKET_NAME: props.s3Bucket.bucketName,
      DOCUMENT_ANALYSIS_STATUS_TABLE: props.documentAnalysisStatusTable.tableName,
      REQUEST_STATUS_TABLE: props.requestStatusTable.tableName,
      USER_INTERACTIONS_TABLE: props.userInteractionsTable.tableName,
      USER_FILES_TABLE: props.userFilesTable.tableName,
      SQS_QUEUE_URL: props.processingQueue.queueUrl,
      DOCUMENT_ANALYSIS_STATE_MACHINE_ARN: props.documentAnalysisStateMachine.stateMachineArn,
      BEDROCK_AGENT_ID: '7FDALECWCL',
      BEDROCK_AGENT_ALIAS_ID: '11OBDAVIQQ',
    };

    // Create Lambda functions for API endpoints
    const createTicketFunction = new lambda.Function(this, 'CreateTicketFunction', {
      functionName: 'aseekbot-create-ticket',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('src/lambdas'),
      handler: 'createTicket.handler',
      environment: commonEnv,
      timeout: cdk.Duration.seconds(29),
      memorySize: 256,
      layers: [awsSdkLayer],
    });

    const processChatMessageFunction = new lambda.Function(this, 'ProcessChatMessageFunction', {
      functionName: 'aseekbot-process-chat-message',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('src/lambdas'),
      handler: 'processChatMessage.handler',
      environment: commonEnv,
      timeout: cdk.Duration.seconds(29),
      memorySize: 256,
      layers: [awsSdkLayer],
    });

    const uploadFileFunction = new lambda.Function(this, 'UploadFileFunction', {
      functionName: 'aseekbot-upload-file',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('src/lambdas'),
      handler: 'uploadFile.handler',
      environment: commonEnv,
      timeout: cdk.Duration.seconds(29),
      memorySize: 256,
      layers: [awsSdkLayer],
    });

    const deleteFileFunction = new lambda.Function(this, 'DeleteFileFunction', {
      functionName: 'aseekbot-delete-file',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('src/lambdas'),
      handler: 'deleteFile.handler',
      environment: commonEnv,
      timeout: cdk.Duration.seconds(29),
      memorySize: 256,
      layers: [awsSdkLayer],
    });

    const downloadFileFunction = new lambda.Function(this, 'DownloadFileFunction', {
      functionName: 'aseekbot-download-file',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('src/lambdas'),
      handler: 'downloadFile.handler',
      environment: commonEnv,
      timeout: cdk.Duration.seconds(29),
      memorySize: 256,
      layers: [awsSdkLayer],
    });

    const quickLinkFunction = new lambda.Function(this, 'QuickLinkFunction', {
      functionName: 'aseekbot-quick-link',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('src/lambdas'),
      handler: 'quickLink.handler',
      environment: commonEnv,
      timeout: cdk.Duration.seconds(29),
      memorySize: 256,
      layers: [awsSdkLayer],
    });

    const getDocumentAnalysisStatusFunction = new lambda.Function(this, 'GetDocumentAnalysisStatusFunction', {
      functionName: 'aseekbot-get-document-analysis-status',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('src/lambdas'),
      handler: 'getDocumentAnalysisStatus.handler',
      environment: commonEnv,
      timeout: cdk.Duration.seconds(29),
      memorySize: 256,
      layers: [awsSdkLayer],
    });

    const startProcessingFunction = new lambda.Function(this, 'StartProcessingFunction', {
      functionName: 'aseekbot-start-processing',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('src/lambdas'),
      handler: 'startProcessing.handler',
      environment: commonEnv,
      timeout: cdk.Duration.seconds(29),
      memorySize: 256,
      layers: [awsSdkLayer],
    });

    const checkStatusFunction = new lambda.Function(this, 'CheckStatusFunction', {
      functionName: 'aseekbot-check-status',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('src/lambdas'),
      handler: 'checkStatus.handler',
      environment: commonEnv,
      timeout: cdk.Duration.seconds(29),
      memorySize: 256,
      layers: [awsSdkLayer],
    });

    const recordUserInteractionFunction = new lambda.Function(this, 'RecordUserInteractionFunction', {
      functionName: 'aseekbot-record-user-interaction',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('src/lambdas'),
      handler: 'recordUserInteraction.handler',
      environment: commonEnv,
      timeout: cdk.Duration.seconds(29),
      memorySize: 256,
      layers: [awsSdkLayer],
    });

    const getUserFilesFunction = new lambda.Function(this, 'GetUserFilesFunction', {
      functionName: 'aseekbot-get-user-files',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('src/lambdas'),
      handler: 'getUserFiles.handler',
      environment: commonEnv,
      timeout: cdk.Duration.seconds(29),
      memorySize: 256,
      layers: [awsSdkLayer],
    });

    const workerProcessorFunction = new lambda.Function(this, 'WorkerProcessorFunction', {
      functionName: 'aseekbot-worker-processor',
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('src/lambdas'),
      handler: 'workerProcessor.handler',
      environment: commonEnv,
      timeout: cdk.Duration.seconds(900), // 15 minutes
      memorySize: 1024,
      layers: [awsSdkLayer],
    });

    // Grant permissions to Lambda functions
    props.s3Bucket.grantReadWrite(uploadFileFunction);
    props.s3Bucket.grantReadWrite(deleteFileFunction);
    props.s3Bucket.grantRead(downloadFileFunction);
    props.s3Bucket.grantRead(getUserFilesFunction);
    props.s3Bucket.grantReadWrite(workerProcessorFunction);

    props.requestStatusTable.grantReadWriteData(startProcessingFunction);
    props.requestStatusTable.grantReadWriteData(checkStatusFunction);
    props.requestStatusTable.grantReadWriteData(workerProcessorFunction);

    props.userInteractionsTable.grantReadWriteData(startProcessingFunction);
    props.userInteractionsTable.grantReadWriteData(processChatMessageFunction);
    props.userInteractionsTable.grantReadWriteData(recordUserInteractionFunction);

    props.userFilesTable.grantReadWriteData(uploadFileFunction);
    props.userFilesTable.grantReadData(getUserFilesFunction);
    props.userFilesTable.grantReadData(deleteFileFunction);

    props.documentAnalysisStatusTable.grantReadData(getDocumentAnalysisStatusFunction);
    props.documentAnalysisStatusTable.grantReadWriteData(workerProcessorFunction);

    props.processingQueue.grantSendMessages(startProcessingFunction);
    props.processingQueue.grantSendMessages(processChatMessageFunction);
    props.processingQueue.grantConsumeMessages(workerProcessorFunction);

    // Grant Bedrock permissions
    const bedrockPolicy = new iam.PolicyStatement({
      actions: ['bedrock:*'],
      resources: ['*'],
    });

    processChatMessageFunction.addToRolePolicy(bedrockPolicy);
    workerProcessorFunction.addToRolePolicy(bedrockPolicy);

    // Grant Step Functions permissions
    workerProcessorFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['states:StartExecution', 'states:DescribeExecution'],
        resources: [props.documentAnalysisStateMachine.stateMachineArn],
      })
    );
    checkStatusFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['states:DescribeExecution'],
        resources: [`arn:aws:states:${this.region}:${this.account}:execution:*:*`],
      })
    );

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'AseekbotApi', {
      restApiName: 'Aseekbot API',
      description: 'API for Aseekbot chatbot',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
          'X-Amz-Security-Token',
          'X-Amz-User-Agent',
        ],
      },
      binaryMediaTypes: ['multipart/form-data', 'application/json', '*/*'],
    });

      // Replace the API endpoint creation section with this direct approach
      // Create API endpoints
      const createTicketResource = api.root.addResource('createTicket');
      createTicketResource.addMethod('POST', new apigateway.LambdaIntegration(createTicketFunction));
      createTicketResource.addMethod('OPTIONS', new apigateway.LambdaIntegration(createTicketFunction));

      const processChatMessageResource = api.root.addResource('processChatMessage');
      processChatMessageResource.addMethod('POST', new apigateway.LambdaIntegration(processChatMessageFunction));
      processChatMessageResource.addMethod('OPTIONS', new apigateway.LambdaIntegration(processChatMessageFunction));

      const uploadFileResource = api.root.addResource('uploadFile');
      uploadFileResource.addMethod('POST', new apigateway.LambdaIntegration(uploadFileFunction));
      uploadFileResource.addMethod('OPTIONS', new apigateway.LambdaIntegration(uploadFileFunction));

      const deleteFileResource = api.root.addResource('deleteFile');
      deleteFileResource.addMethod('POST', new apigateway.LambdaIntegration(deleteFileFunction));
      deleteFileResource.addMethod('OPTIONS', new apigateway.LambdaIntegration(deleteFileFunction));

      const downloadFileResource = api.root.addResource('downloadFile');
      downloadFileResource.addMethod('POST', new apigateway.LambdaIntegration(downloadFileFunction));
      downloadFileResource.addMethod('OPTIONS', new apigateway.LambdaIntegration(downloadFileFunction));

      const quickLinkResource = api.root.addResource('quickLink');
      quickLinkResource.addMethod('POST', new apigateway.LambdaIntegration(quickLinkFunction));
      quickLinkResource.addMethod('OPTIONS', new apigateway.LambdaIntegration(quickLinkFunction));

      const startProcessingResource = api.root.addResource('startProcessing');
      startProcessingResource.addMethod('POST', new apigateway.LambdaIntegration(startProcessingFunction));
      startProcessingResource.addMethod('OPTIONS', new apigateway.LambdaIntegration(startProcessingFunction));

      const recordUserInteractionResource = api.root.addResource('recordUserInteraction');
      recordUserInteractionResource.addMethod('POST', new apigateway.LambdaIntegration(recordUserInteractionFunction));
      recordUserInteractionResource.addMethod('OPTIONS', new apigateway.LambdaIntegration(recordUserInteractionFunction));

      const getUserFilesResource = api.root.addResource('getUserFiles');
      getUserFilesResource.addMethod('POST', new apigateway.LambdaIntegration(getUserFilesFunction));
      getUserFilesResource.addMethod('OPTIONS', new apigateway.LambdaIntegration(getUserFilesFunction));

      // Handle paths with proxy parameters
      const documentAnalysisResource = api.root.addResource('document-analysis');
      documentAnalysisResource.addProxy({
          defaultIntegration: new apigateway.LambdaIntegration(getDocumentAnalysisStatusFunction),
          anyMethod: true
      });

      const checkStatusResource = api.root.addResource('checkStatus');
      checkStatusResource.addProxy({
          defaultIntegration: new apigateway.LambdaIntegration(checkStatusFunction),
          anyMethod: true
      });

      // Special handling for files/download endpoint
      const filesResource = api.root.addResource('files');
      const downloadResource = filesResource.addResource('download');
      downloadResource.addMethod('ANY', new apigateway.LambdaIntegration(downloadFileFunction));

    // Set up SQS event source for the worker processor
    const eventSource = new lambda.EventSourceMapping(this, 'SqsEventSource', {
      target: workerProcessorFunction,
      eventSourceArn: props.processingQueue.queueArn,
      batchSize: 1,
    });

    // Store the API endpoint URL for output
    this.apiEndpoint = api.url;

    // Output the API URL
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'The URL of the API Gateway',
    });
  }
}