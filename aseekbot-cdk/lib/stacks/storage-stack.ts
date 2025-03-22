import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export interface StorageStackProps extends cdk.NestedStackProps {
  // Add any custom properties here
}

export class StorageStack extends cdk.NestedStack {
  // Expose resources to be used by other stacks
  public readonly s3Bucket: s3.Bucket;
  public readonly requestStatusTable: dynamodb.Table;
  public readonly documentAnalysisStatusTable: dynamodb.Table;
  public readonly userInteractionsTable: dynamodb.Table;
  public readonly userFilesTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: StorageStackProps) {
    super(scope, id, props);

    // Create S3 bucket for file storage with CORS configuration
    this.s3Bucket = new s3.Bucket(this, 'AseekbotBucket', {
      bucketName: process.env.AWS_S3_BUCKET_NAME || `aseekbot-files-${this.account}-${this.region}`,
      removalPolicy: cdk.RemovalPolicy.RETAIN, // RETAIN to avoid accidental deletion
      autoDeleteObjects: false,
      versioned: false,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.HEAD,
          ],
          allowedOrigins: ['*'], // In production, restrict to your application domains
          maxAge: 3000,
        },
      ],
      encryption: s3.BucketEncryption.S3_MANAGED,
    });

    // Create DynamoDB table for request status tracking
    this.requestStatusTable = new dynamodb.Table(this, 'RequestStatusTable', {
      tableName: 'RequestStatus',
      partitionKey: { name: 'requestId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // Add GSI for sessionId
    this.requestStatusTable.addGlobalSecondaryIndex({
      indexName: 'SessionIdIndex',
      partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Create DynamoDB table for document analysis status tracking
    this.documentAnalysisStatusTable = new dynamodb.Table(this, 'DocumentAnalysisStatusTable', {
      tableName: 'DocumentAnalysisStatus',
      partitionKey: { name: 'documentId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create DynamoDB table for user interactions tracking
    this.userInteractionsTable = new dynamodb.Table(this, 'UserInteractionsTable', {
      tableName: 'UserInteractions',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // Add GSI for chatId
    this.userInteractionsTable.addGlobalSecondaryIndex({
      indexName: 'ChatIdIndex',
      partitionKey: { name: 'chatId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Add timestamp GSI for sorting and querying
    this.userInteractionsTable.addGlobalSecondaryIndex({
      indexName: 'chatId-timestamp-index',
      partitionKey: { name: 'chatId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Create DynamoDB table for user files tracking
    this.userFilesTable = new dynamodb.Table(this, 'UserFilesTable', {
      tableName: 'UserFiles',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'fileKey', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });
  }
}