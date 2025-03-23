import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as customResources from 'aws-cdk-lib/custom-resources';

export interface StorageStackProps extends cdk.NestedStackProps {
  stackName?: string;
  createTables?: boolean; // Add a prop to control table creation
  importBucket?: boolean; // Add this property
  bucketName?: string;    // Add this property
}

export class StorageStack extends cdk.NestedStack {
  // Expose resources to be used by other stacks
  public readonly s3Bucket: s3.IBucket;
  public readonly requestStatusTable: dynamodb.ITable;
  public readonly documentAnalysisStatusTable: dynamodb.ITable;
  public readonly userInteractionsTable: dynamodb.ITable;
  public readonly userFilesTable: dynamodb.ITable;

  constructor(scope: Construct, id: string, props?: StorageStackProps) {
    super(scope, id, props);

    // Check if we should import the bucket
    const importBucket = props?.importBucket ?? false;
    const bucketName = props?.bucketName || process.env.AWS_S3_BUCKET_NAME || `aseekbot-files-${this.account}-${this.region}`;

    if (importBucket) {
      // Import existing S3 bucket
      console.log(`Importing existing S3 bucket: ${bucketName}`);
      this.s3Bucket = s3.Bucket.fromBucketName(
        this,
        'AseekbotBucket',
        bucketName
      );
    } else {
      // Create S3 bucket for file storage with CORS configuration
      console.log(`Creating new S3 bucket: ${bucketName}`);
      this.s3Bucket = new s3.Bucket(this, 'AseekbotBucket', {
        bucketName: bucketName,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
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
            allowedOrigins: ['*'],
            maxAge: 3000,
          },
        ],
        encryption: s3.BucketEncryption.S3_MANAGED,
      });
    }

    // Check if we should create tables or import existing ones
    const createTables = props?.createTables ?? false;
    console.log(`Creating tables: ${createTables ? 'Yes' : 'No (using existing tables)'}`);

    if (createTables) {
      // Create new DynamoDB tables
      const requestStatusTable = new dynamodb.Table(this, 'RequestStatusTable', {
        tableName: 'RequestStatus',
        partitionKey: { name: 'requestId', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      });

      requestStatusTable.addGlobalSecondaryIndex({
        indexName: 'SessionIdIndex',
        partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
        projectionType: dynamodb.ProjectionType.ALL,
      });

      this.requestStatusTable = requestStatusTable;

      this.documentAnalysisStatusTable = new dynamodb.Table(this, 'DocumentAnalysisStatusTable', {
        tableName: 'DocumentAnalysisStatus',
        partitionKey: { name: 'documentId', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      });

      const userInteractionsTable = new dynamodb.Table(this, 'UserInteractionsTable', {
        tableName: 'UserInteractions',
        partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      });

      userInteractionsTable.addGlobalSecondaryIndex({
        indexName: 'ChatIdIndex',
        partitionKey: { name: 'chatId', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
        projectionType: dynamodb.ProjectionType.ALL,
      });

      userInteractionsTable.addGlobalSecondaryIndex({
        indexName: 'chatId-timestamp-index',
        partitionKey: { name: 'chatId', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
        projectionType: dynamodb.ProjectionType.ALL,
      });

      this.userInteractionsTable = userInteractionsTable;

      this.userFilesTable = new dynamodb.Table(this, 'UserFilesTable', {
        tableName: 'UserFiles',
        partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'fileKey', type: dynamodb.AttributeType.STRING },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      });
    } else {
      // Import existing DynamoDB tables
      console.log('Importing existing DynamoDB tables');
      this.requestStatusTable = dynamodb.Table.fromTableName(
        this,
        'RequestStatusTable',
        'RequestStatus'
      );

      this.documentAnalysisStatusTable = dynamodb.Table.fromTableName(
        this,
        'DocumentAnalysisStatusTable',
        'DocumentAnalysisStatus'
      );

      this.userInteractionsTable = dynamodb.Table.fromTableName(
        this,
        'UserInteractionsTable',
        'UserInteractions'
      );

      this.userFilesTable = dynamodb.Table.fromTableName(
        this,
        'UserFilesTable',
        'UserFiles'
      );
    }
  }
}