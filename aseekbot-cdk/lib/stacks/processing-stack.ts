import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export interface ProcessingStackProps extends cdk.NestedStackProps {
    stackName?: string;
    s3Bucket: s3.IBucket;
    requestStatusTable: dynamodb.ITable;
    documentAnalysisStatusTable: dynamodb.ITable;
    userInteractionsTable: dynamodb.ITable;
    userFilesTable: dynamodb.ITable;
    importResources?: boolean;
}

export class ProcessingStack extends cdk.NestedStack {
    // Expose resources to be used by other stacks
    public readonly processingQueue: sqs.Queue;
    public readonly processingDLQ: sqs.Queue;
    public readonly documentAnalysisStateMachine: sfn.StateMachine;

    // Document analysis Lambda functions
    private readonly initProcessFunction: lambda.Function;
    private readonly fileValidationFunction: lambda.Function;
    private readonly textractHandlerFunction: lambda.Function;
    private readonly docxParserFunction: lambda.Function;
    private readonly excelParserFunction: lambda.Function;
    private readonly csvParserFunction: lambda.Function;
    private readonly contentAnalyzerFunction: lambda.Function;
    private readonly documentComparerFunction: lambda.Function;
    private readonly insightGeneratorFunction: lambda.Function;
    private readonly resultStorageFunction: lambda.Function;
    private readonly errorHandlerFunction: lambda.Function;
    private readonly statusUpdaterFunction: lambda.Function;

    constructor(scope: Construct, id: string, props: ProcessingStackProps) {
        super(scope, id, props);

        // Determine if we should import resources
        const importResources = props.importResources ?? process.env.IMPORT_RESOURCES === 'true';
        console.log(`Processing Stack - Import resources: ${importResources}`);

        // Create AWS SDK Layer
        const awsSdkLayer = new lambda.LayerVersion(this, 'AwsSdkLayer', {
            code: lambda.Code.fromAsset('layers/aws-sdk-v3'),
            compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
            description: 'AWS SDK v3 libraries and other common dependencies',
        });

        // Create or import SQS queues
        if (importResources) {
            // Import existing queues
            console.log('Importing existing SQS queues');
            this.processingDLQ = sqs.Queue.fromQueueArn(
                this,
                'ImportedProcessingDLQ',
                `arn:aws:sqs:${this.region}:${this.account}:aseekbot-processing-dlq`
            ) as sqs.Queue;

            this.processingQueue = sqs.Queue.fromQueueArn(
                this,
                'ImportedProcessingQueue',
                `arn:aws:sqs:${this.region}:${this.account}:aseekbot-processing-queue`
            ) as sqs.Queue;

            // Import existing state machine
            console.log('Importing existing Step Functions state machine');
            this.documentAnalysisStateMachine = sfn.StateMachine.fromStateMachineArn(
                this,
                'ImportedDocumentAnalysisStateMachine',
                `arn:aws:states:${this.region}:${this.account}:stateMachine:DocumentAnalysisWorkflow`
            ) as sfn.StateMachine;
        } else {
            // Create Dead Letter Queue
            this.processingDLQ = new sqs.Queue(this, 'ProcessingDeadLetterQueue', {
                queueName: 'aseekbot-processing-dlq',
                retentionPeriod: cdk.Duration.days(14),
            });

            // Create SQS Queue for processing
            this.processingQueue = new sqs.Queue(this, 'ProcessingQueue', {
                queueName: 'aseekbot-processing-queue',
                visibilityTimeout: cdk.Duration.seconds(900), // 15 minutes to match Lambda timeout
                retentionPeriod: cdk.Duration.days(14),
                deadLetterQueue: {
                    queue: this.processingDLQ,
                    maxReceiveCount: 3,
                },
            });
        }

        // Common environment variables for Lambda functions
        const commonEnvironment = {
            AWS_S3_BUCKET_NAME: props.s3Bucket.bucketName,
            DOCUMENT_ANALYSIS_STATUS_TABLE: props.documentAnalysisStatusTable.tableName,
            REQUEST_STATUS_TABLE: props.requestStatusTable.tableName,
            USER_INTERACTIONS_TABLE: props.userInteractionsTable.tableName,
            USER_FILES_TABLE: props.userFilesTable.tableName,
            BEDROCK_AGENT_ID: '7FDALECWCL',
            BEDROCK_AGENT_ALIAS_ID: '11OBDAVIQQ',
        };

        // Create Document Analysis Lambda functions
        this.initProcessFunction = new lambda.Function(this, 'InitProcessFunction', {
            functionName: 'aseekbot-init-process',
            runtime: lambda.Runtime.NODEJS_18_X,
            code: lambda.Code.fromAsset('src/functions/document-analysis'),
            handler: 'init-process.handler',
            timeout: cdk.Duration.seconds(30),
            memorySize: 256,
            environment: commonEnvironment,
            layers: [awsSdkLayer],
        });

        this.fileValidationFunction = new lambda.Function(this, 'FileValidationFunction', {
            functionName: 'aseekbot-file-validation',
            runtime: lambda.Runtime.NODEJS_18_X,
            code: lambda.Code.fromAsset('src/functions/document-analysis'),
            handler: 'file-validation.handler',
            timeout: cdk.Duration.seconds(30),
            memorySize: 256,
            environment: commonEnvironment,
            layers: [awsSdkLayer],
        });

        this.textractHandlerFunction = new lambda.Function(this, 'TextractHandlerFunction', {
            functionName: 'aseekbot-textract-handler',
            runtime: lambda.Runtime.NODEJS_18_X,
            code: lambda.Code.fromAsset('src/functions/document-analysis'),
            handler: 'textract-handler.handler',
            timeout: cdk.Duration.seconds(300),
            memorySize: 512,
            environment: commonEnvironment,
            layers: [awsSdkLayer],
        });

        this.docxParserFunction = new lambda.Function(this, 'DocxParserFunction', {
            functionName: 'aseekbot-docx-parser',
            runtime: lambda.Runtime.NODEJS_18_X,
            code: lambda.Code.fromAsset('src/functions/document-analysis'),
            handler: 'docx-parser.handler',
            timeout: cdk.Duration.seconds(60),
            memorySize: 256,
            environment: commonEnvironment,
            layers: [awsSdkLayer],
        });

        this.excelParserFunction = new lambda.Function(this, 'ExcelParserFunction', {
            functionName: 'aseekbot-excel-parser',
            runtime: lambda.Runtime.NODEJS_18_X,
            code: lambda.Code.fromAsset('src/functions/document-analysis'),
            handler: 'excel-parser.handler',
            timeout: cdk.Duration.seconds(60),
            memorySize: 256,
            environment: commonEnvironment,
            layers: [awsSdkLayer],
        });

        this.csvParserFunction = new lambda.Function(this, 'CsvParserFunction', {
            functionName: 'aseekbot-csv-parser',
            runtime: lambda.Runtime.NODEJS_18_X,
            code: lambda.Code.fromAsset('src/functions/document-analysis'),
            handler: 'csv-parser.handler',
            timeout: cdk.Duration.seconds(60),
            memorySize: 256,
            environment: commonEnvironment,
            layers: [awsSdkLayer],
        });

        this.contentAnalyzerFunction = new lambda.Function(this, 'ContentAnalyzerFunction', {
            functionName: 'aseekbot-content-analyzer',
            runtime: lambda.Runtime.NODEJS_18_X,
            code: lambda.Code.fromAsset('src/functions/document-analysis'),
            handler: 'content-analyzer.handler',
            timeout: cdk.Duration.seconds(60),
            memorySize: 256,
            environment: commonEnvironment,
            layers: [awsSdkLayer],
        });

        this.documentComparerFunction = new lambda.Function(this, 'DocumentComparerFunction', {
            functionName: 'aseekbot-document-comparer',
            runtime: lambda.Runtime.NODEJS_18_X,
            code: lambda.Code.fromAsset('src/functions/document-analysis'),
            handler: 'document-comparer.handler',
            timeout: cdk.Duration.seconds(60),
            memorySize: 256,
            environment: commonEnvironment,
            layers: [awsSdkLayer],
        });

        this.insightGeneratorFunction = new lambda.Function(this, 'InsightGeneratorFunction', {
            functionName: 'aseekbot-insight-generator',
            runtime: lambda.Runtime.NODEJS_18_X,
            code: lambda.Code.fromAsset('src/functions/document-analysis'),
            handler: 'insight-generator.handler',
            timeout: cdk.Duration.seconds(120),
            memorySize: 256,
            environment: commonEnvironment,
            layers: [awsSdkLayer],
        });

        this.resultStorageFunction = new lambda.Function(this, 'ResultStorageFunction', {
            functionName: 'aseekbot-result-storage',
            runtime: lambda.Runtime.NODEJS_18_X,
            code: lambda.Code.fromAsset('src/functions/document-analysis'),
            handler: 'result-storage.handler',
            timeout: cdk.Duration.seconds(60),
            memorySize: 256,
            environment: commonEnvironment,
            layers: [awsSdkLayer],
        });

        this.errorHandlerFunction = new lambda.Function(this, 'ErrorHandlerFunction', {
            functionName: 'aseekbot-error-handler',
            runtime: lambda.Runtime.NODEJS_18_X,
            code: lambda.Code.fromAsset('src/functions/document-analysis'),
            handler: 'error-handler.handler',
            timeout: cdk.Duration.seconds(30),
            memorySize: 256,
            environment: commonEnvironment,
            layers: [awsSdkLayer],
        });

        this.statusUpdaterFunction = new lambda.Function(this, 'StatusUpdaterFunction', {
            functionName: 'aseekbot-status-updater',
            runtime: lambda.Runtime.NODEJS_18_X,
            code: lambda.Code.fromAsset('src/functions/document-analysis'),
            handler: 'status-updater.handler',
            timeout: cdk.Duration.seconds(30),
            memorySize: 256,
            environment: commonEnvironment,
            layers: [awsSdkLayer],
        });

        // Grant S3 permissions
        props.s3Bucket.grantReadWrite(this.initProcessFunction);
        props.s3Bucket.grantReadWrite(this.fileValidationFunction);
        props.s3Bucket.grantReadWrite(this.textractHandlerFunction);
        props.s3Bucket.grantReadWrite(this.docxParserFunction);
        props.s3Bucket.grantReadWrite(this.excelParserFunction);
        props.s3Bucket.grantReadWrite(this.csvParserFunction);
        props.s3Bucket.grantReadWrite(this.contentAnalyzerFunction);
        props.s3Bucket.grantReadWrite(this.documentComparerFunction);
        props.s3Bucket.grantReadWrite(this.resultStorageFunction);
        props.s3Bucket.grantReadWrite(this.insightGeneratorFunction);

        // Grant DynamoDB permissions
        props.documentAnalysisStatusTable.grantReadWriteData(this.initProcessFunction);
        props.documentAnalysisStatusTable.grantReadWriteData(this.statusUpdaterFunction);
        props.documentAnalysisStatusTable.grantReadWriteData(this.errorHandlerFunction);
        props.documentAnalysisStatusTable.grantReadWriteData(this.resultStorageFunction);

        // Grant Textract permissions
        this.textractHandlerFunction.addToRolePolicy(
            new iam.PolicyStatement({
                actions: [
                    'textract:DetectDocumentText',
                    'textract:StartDocumentTextDetection',
                    'textract:GetDocumentTextDetection',
                    'textract:StartDocumentAnalysis',
                    'textract:GetDocumentAnalysis',
                    'textract:AnalyzeDocument'
                ],
                resources: ['*'],
            })
        );

        // Grant Bedrock permissions to insight generator
        this.insightGeneratorFunction.addToRolePolicy(
            new iam.PolicyStatement({
                actions: ['bedrock:*'],
                resources: ['*'],
            })
        );

        // Only create the state machine if we're not importing it
        if (!importResources) {
            // Define Step Functions workflow based on the JSON definition
            // Read the state machine definition from the file
            const stateMachineDefinition = require('../../resources/document-analysis-workflow.json');

            // Create a role for the state machine with inline policies
            const stateMachineRole = new iam.Role(this, 'DocumentAnalysisStateMachineRole', {
                assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
                inlinePolicies: {
                    LambdaInvoke: new iam.PolicyDocument({
                        statements: [
                            new iam.PolicyStatement({
                                actions: ['lambda:InvokeFunction'],
                                resources: [
                                    this.initProcessFunction.functionArn,
                                    this.fileValidationFunction.functionArn,
                                    this.textractHandlerFunction.functionArn,
                                    this.docxParserFunction.functionArn,
                                    this.excelParserFunction.functionArn,
                                    this.csvParserFunction.functionArn,
                                    this.contentAnalyzerFunction.functionArn,
                                    this.documentComparerFunction.functionArn,
                                    this.insightGeneratorFunction.functionArn,
                                    this.resultStorageFunction.functionArn,
                                    this.errorHandlerFunction.functionArn,
                                    this.statusUpdaterFunction.functionArn
                                ]
                            })
                        ]
                    })
                }
            });

            // Substitute Lambda ARNs in the definition
            const substitutedDefinition = JSON.stringify(stateMachineDefinition)
                .replace('${InitProcessLambdaArn}', this.initProcessFunction.functionArn)
                .replace('${StatusUpdaterLambdaArn}', this.statusUpdaterFunction.functionArn)
                .replace('${FileValidationLambdaArn}', this.fileValidationFunction.functionArn)
                .replace('${TextractHandlerLambdaArn}', this.textractHandlerFunction.functionArn)
                .replace('${DocxParserLambdaArn}', this.docxParserFunction.functionArn)
                .replace('${ExcelParserLambdaArn}', this.excelParserFunction.functionArn)
                .replace('${CsvParserLambdaArn}', this.csvParserFunction.functionArn)
                .replace('${ContentAnalyzerLambdaArn}', this.contentAnalyzerFunction.functionArn)
                .replace('${DocumentComparerLambdaArn}', this.documentComparerFunction.functionArn)
                .replace('${InsightGeneratorLambdaArn}', this.insightGeneratorFunction.functionArn)
                .replace('${ResultStorageLambdaArn}', this.resultStorageFunction.functionArn)
                .replace('${ErrorHandlerLambdaArn}', this.errorHandlerFunction.functionArn);

            // Create the state machine
            this.documentAnalysisStateMachine = new sfn.StateMachine(this, 'DocumentAnalysisStateMachine', {
                stateMachineName: 'DocumentAnalysisWorkflow',
                definitionBody: sfn.DefinitionBody.fromString(substitutedDefinition),
                role: stateMachineRole,
                timeout: cdk.Duration.minutes(30),
            });
        }

        // Output the state machine ARN for reference in other resources
        new cdk.CfnOutput(this, 'DocumentAnalysisStateMachineArn', {
            value: this.documentAnalysisStateMachine.stateMachineArn,
            description: 'ARN of the Document Analysis State Machine',
        });
    }
}