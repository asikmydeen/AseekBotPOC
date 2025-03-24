import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export interface StorageStackProps extends cdk.NestedStackProps {
  stackName?: string;
  createTables?: boolean;
  importBucket?: boolean;
  bucketName?: string;
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
    const importBucket = props?.importBucket ?? process.env.IMPORT_BUCKET === 'true';
    const bucketName = props?.bucketName || process.env.AWS_S3_BUCKET_NAME || `aseekbot-files-${this.account}-${this.region}`;

    console.log(`Storage Stack - Import bucket: ${importBucket}, Bucket name: ${bucketName}`);

    if (importBucket) {
      // Import existing S3 bucket
      console.log(`Importing existing S3 bucket: ${bucketName}`);
      this.s3Bucket = s3.Bucket.fromBucketName(
        this,
        'ImportedAseekbotBucket',
        bucketName
      );

      // Apply CORS to the existing bucket using custom resources if necessary
      new cdk.CustomResource(this, 'BucketCorsCustomResource', {
        serviceToken: this.createCorsLambdaFunction(bucketName).functionArn,
        properties: {
          BucketName: bucketName,
          CorsConfiguration: JSON.stringify({
            CORSRules: [
              {
                AllowedHeaders: ['*'],
                AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
                AllowedOrigins: ['*'],
                ExposeHeaders: [
                  'ETag',
                  'x-amz-meta-custom-header',
                  'x-amz-server-side-encryption',
                  'x-amz-request-id',
                  'x-amz-id-2',
                  'Date'
                ],
                MaxAgeSeconds: 3600
              }
            ]
          })
        }
      });

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
              s3.HttpMethods.DELETE,
            ],
            allowedOrigins: ['*'],
            exposedHeaders: [
              'ETag',
              'x-amz-meta-custom-header',
              'x-amz-server-side-encryption',
              'x-amz-request-id',
              'x-amz-id-2',
              'Date'
            ],
            maxAge: 3600,
          },
        ],
        encryption: s3.BucketEncryption.S3_MANAGED,
      });
    }

    // Check if we should create tables or import existing ones
    const createTables = props?.createTables ?? process.env.CREATE_TABLES === 'true';
    console.log(`Storage Stack - Creating tables: ${createTables ? 'Yes' : 'No (using existing tables)'}`);

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
        'ImportedRequestStatusTable',
        'RequestStatus'
      );

      this.documentAnalysisStatusTable = dynamodb.Table.fromTableName(
        this,
        'ImportedDocumentAnalysisStatusTable',
        'DocumentAnalysisStatus'
      );

      this.userInteractionsTable = dynamodb.Table.fromTableName(
        this,
        'ImportedUserInteractionsTable',
        'UserInteractions'
      );

      this.userFilesTable = dynamodb.Table.fromTableName(
        this,
        'ImportedUserFilesTable',
        'UserFiles'
      );
    }
  }

  // Helper method to create a Lambda function for applying CORS to existing buckets
  private createCorsLambdaFunction(bucketName: string) {
    const lambda = new cdk.aws_lambda.Function(this, 'BucketCorsLambda', {
      runtime: cdk.aws_lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: cdk.aws_lambda.Code.fromInline(`
const AWS = require('aws-sdk');
const response = require('cfn-response');

exports.handler = async (event, context) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  try {
    // Only process Create or Update events
    if (event.RequestType === 'Delete') {
      await response.send(event, context, response.SUCCESS, {});
      return;
    }

    const s3 = new AWS.S3();
    const bucketName = event.ResourceProperties.BucketName;
    const corsConfig = JSON.parse(event.ResourceProperties.CorsConfiguration);

    console.log(\`Applying CORS configuration to bucket: \${bucketName}\`);
    console.log('CORS Config:', JSON.stringify(corsConfig, null, 2));

    await s3.putBucketCors({
      Bucket: bucketName,
      CORSConfiguration: corsConfig
    }).promise();

    console.log('CORS configuration applied successfully');
    await response.send(event, context, response.SUCCESS, {
      BucketName: bucketName,
      Message: 'CORS configuration applied successfully'
    });
  } catch (error) {
    console.error('Error:', error);
    await response.send(event, context, response.FAILED, {
      Error: error.message
    });
  }
};
      `),
      timeout: cdk.Duration.seconds(30),
    });

    // Add permissions to modify S3 bucket CORS
    lambda.addToRolePolicy(new cdk.aws_iam.PolicyStatement({
      actions: ['s3:PutBucketCors', 's3:GetBucketCors'],
      resources: [`arn:aws:s3:::${bucketName}`],
    }));

    return lambda;
  }
}