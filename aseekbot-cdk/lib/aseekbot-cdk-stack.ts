import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiStack } from './stacks/api-stack';
import { StorageStack } from './stacks/storage-stack';
import { ProcessingStack } from './stacks/processing-stack';

export interface AseekbotCdkStackProps extends cdk.StackProps {
  // You can add custom properties here that will be passed to all stacks
}

export class AseekbotCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: AseekbotCdkStackProps) {
    super(scope, id, props);

    // Determine whether to create tables based on environment variable
    const createTables = process.env.CREATE_TABLES === 'true';
    console.log(`Creating tables: ${createTables ? 'Yes' : 'No (using existing tables)'}`);

    // Create the storage stack first as it contains resources needed by other stacks
    const storageStack = new StorageStack(this, 'StorageStack', {
      ...props,
      stackName: 'AseekbotStorageStack',
      createTables: process.env.CREATE_TABLES === 'true', // Control table creation
    });

    // Create the processing stack which depends on storage resources
    const processingStack = new ProcessingStack(this, 'ProcessingStack', {
      ...props,
      stackName: 'AseekbotProcessingStack',
      s3Bucket: storageStack.s3Bucket,
      requestStatusTable: storageStack.requestStatusTable,
      documentAnalysisStatusTable: storageStack.documentAnalysisStatusTable,
      userInteractionsTable: storageStack.userInteractionsTable,
      userFilesTable: storageStack.userFilesTable,
    });

    // Create the API stack which depends on both storage and processing resources
    const apiStack = new ApiStack(this, 'ApiStack', {
      ...props,
      stackName: 'AseekbotApiStack',
      s3Bucket: storageStack.s3Bucket,
      requestStatusTable: storageStack.requestStatusTable,
      documentAnalysisStatusTable: storageStack.documentAnalysisStatusTable,
      userInteractionsTable: storageStack.userInteractionsTable,
      userFilesTable: storageStack.userFilesTable,
      processingQueue: processingStack.processingQueue,
      documentAnalysisStateMachine: processingStack.documentAnalysisStateMachine,
    });

    // Output important resources
    new cdk.CfnOutput(this, 'AseekbotApiEndpoint', {
      value: apiStack.apiEndpoint,
      description: 'API Gateway endpoint URL',
      exportName: 'AseekbotApiEndpoint',
    });

    new cdk.CfnOutput(this, 'AseekbotS3BucketName', {
      value: storageStack.s3Bucket.bucketName,
      description: 'S3 Bucket Name',
      exportName: 'AseekbotS3BucketName',
    });

    new cdk.CfnOutput(this, 'AseekbotDocumentAnalysisStateMachine', {
      value: processingStack.documentAnalysisStateMachine.stateMachineArn,
      description: 'Document Analysis State Machine ARN',
      exportName: 'AseekbotDocumentAnalysisStateMachine',
    });
  }
}