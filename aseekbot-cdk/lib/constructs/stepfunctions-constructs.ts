import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';
import * as fs from 'fs';

export interface BaseStateMachineProps {
    stateMachineName: string;
    definitionBody?: string;
    definitionFile?: string;
    role?: iam.IRole;
    lambdaFunctions?: {
        [key: string]: lambda.IFunction;
    };
    timeout?: cdk.Duration;
    tracingEnabled?: boolean;
    logLevel?: sfn.LogLevel;
}

export class BaseStateMachineConstruct extends Construct {
    public readonly stateMachine: sfn.StateMachine;
    public readonly role: iam.Role;

    constructor(scope: Construct, id: string, props: BaseStateMachineProps) {
        super(scope, id);

        // Create role for the state machine if not provided
        if (!props.role) {
            this.role = new iam.Role(this, `${id}Role`, {
                assumedBy: new iam.ServicePrincipal('states.amazonaws.com')
            });

            // Add Lambda invoke permissions
            this.role.addManagedPolicy(
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaRole')
            );
        } else {
            this.role = props.role as iam.Role;
        }

        // Create log group for state machine
        const logGroup = new logs.LogGroup(this, `${id}LogGroup`, {
            logGroupName: `/aws/states/${props.stateMachineName}`,
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        // Get state machine definition
        let definitionString: string;

        if (props.definitionBody) {
            definitionString = props.definitionBody;
        } else if (props.definitionFile) {
            definitionString = fs.readFileSync(props.definitionFile, 'utf8');
        } else {
            throw new Error('Either definitionBody or definitionFile must be provided');
        }

        // Replace Lambda ARNs in the definition if provided
        if (props.lambdaFunctions) {
            for (const [key, func] of Object.entries(props.lambdaFunctions)) {
                definitionString = definitionString.replace(`\${${key}Arn}`, func.functionArn);
            }
        }

        // Create the state machine
        this.stateMachine = new sfn.StateMachine(this, id, {
            stateMachineName: props.stateMachineName,
            definitionBody: sfn.DefinitionBody.fromString(definitionString),
            role: this.role,
            timeout: props.timeout || cdk.Duration.minutes(30),
            tracingEnabled: props.tracingEnabled,
            logs: {
                destination: logGroup,
                level: props.logLevel || sfn.LogLevel.ALL,
            },
        });
    }

    public grantStartExecution(grantee: iam.IGrantable): iam.Grant {
        return this.stateMachine.grantStartExecution(grantee);
    }

    public grantRead(grantee: iam.IGrantable): iam.Grant {
        return this.stateMachine.grantRead(grantee);
    }

    public grantTaskResponse(grantee: iam.IGrantable): iam.Grant {
        return this.stateMachine.grantTaskResponse(grantee);
    }
}

export class DocumentAnalysisStateMachineConstruct extends BaseStateMachineConstruct {
    constructor(scope: Construct, id: string, props: {
        stateMachineName?: string;
        lambdaFunctions: {
            InitProcess: lambda.IFunction;
            StatusUpdater: lambda.IFunction;
            FileValidation: lambda.IFunction;
            TextractHandler: lambda.IFunction;
            DocxParser: lambda.IFunction;
            ExcelParser: lambda.IFunction;
            CsvParser: lambda.IFunction;
            ContentAnalyzer: lambda.IFunction;
            DocumentComparer: lambda.IFunction;
            InsightGenerator: lambda.IFunction;
            ResultStorage: lambda.IFunction;
            ErrorHandler: lambda.IFunction;
        };
        definitionFile?: string;
    }) {
        super(scope, id, {
            stateMachineName: props.stateMachineName || 'DocumentAnalysisWorkflow',
            definitionFile: props.definitionFile || path.join('resources', 'document-analysis-workflow.json'),
            lambdaFunctions: props.lambdaFunctions,
            timeout: cdk.Duration.minutes(30),
            tracingEnabled: true,
            logLevel: sfn.LogLevel.ALL,
        });

        // Grant permissions for Lambda functions to be called by the state machine
        for (const [_, func] of Object.entries(props.lambdaFunctions)) {
            func.grantInvoke(this.role);
        }
    }
}

export class ProgrammaticallyDefinedStateMachineConstruct extends Construct {
    public readonly stateMachine: sfn.StateMachine;
    public readonly role: iam.Role;

    constructor(scope: Construct, id: string, props: {
        stateMachineName: string;
        lambdaFunctions: {
            [key: string]: lambda.IFunction;
        };
    }) {
        super(scope, id);

        // Create role for the state machine
        this.role = new iam.Role(this, `${id}Role`, {
            assumedBy: new iam.ServicePrincipal('states.amazonaws.com')
        });

        // Add Lambda invoke permissions
        this.role.addManagedPolicy(
            iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaRole')
        );

        // Create log group for state machine
        const logGroup = new logs.LogGroup(this, `${id}LogGroup`, {
            logGroupName: `/aws/states/${props.stateMachineName}`,
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        // Grant permissions for Lambda functions to be called by the state machine
        for (const [_, func] of Object.entries(props.lambdaFunctions)) {
            func.grantInvoke(this.role);
        }

        // Define the state machine programmatically
        const initProcess = new tasks.LambdaInvoke(this, 'InitProcessTask', {
            lambdaFunction: props.lambdaFunctions.InitProcess,
            outputPath: '$.Payload',
        });

        const updateStatusStarted = new tasks.LambdaInvoke(this, 'UpdateStatusStartedTask', {
            lambdaFunction: props.lambdaFunctions.StatusUpdater,
            inputPath: '$',
            resultPath: '$.statusUpdate',
        });

        const validateFile = new tasks.LambdaInvoke(this, 'ValidateFileTask', {
            lambdaFunction: props.lambdaFunctions.FileValidation,
            inputPath: '$',
            resultPath: '$.validationResult',
        });

        const updateStatusValidated = new tasks.LambdaInvoke(this, 'UpdateStatusValidatedTask', {
            lambdaFunction: props.lambdaFunctions.StatusUpdater,
            inputPath: '$',
            resultPath: '$.statusUpdate',
        });

        const handleValidationError = new tasks.LambdaInvoke(this, 'HandleValidationErrorTask', {
            lambdaFunction: props.lambdaFunctions.ErrorHandler,
            inputPath: '$',
            resultPath: '$.errorHandlerResult',
        });

        const extractWithTextract = new tasks.LambdaInvoke(this, 'ExtractWithTextractTask', {
            lambdaFunction: props.lambdaFunctions.TextractHandler,
            inputPath: '$',
            resultPath: '$.extractionResult',
        });

        const extractDocxText = new tasks.LambdaInvoke(this, 'ExtractDocxTextTask', {
            lambdaFunction: props.lambdaFunctions.DocxParser,
            inputPath: '$',
            resultPath: '$.extractionResult',
        });

        const extractXlsxData = new tasks.LambdaInvoke(this, 'ExtractXlsxDataTask', {
            lambdaFunction: props.lambdaFunctions.ExcelParser,
            inputPath: '$',
            resultPath: '$.extractionResult',
        });

        const extractCsvData = new tasks.LambdaInvoke(this, 'ExtractCsvDataTask', {
            lambdaFunction: props.lambdaFunctions.CsvParser,
            inputPath: '$',
            resultPath: '$.extractionResult',
        });

        const updateStatusExtracted = new tasks.LambdaInvoke(this, 'UpdateStatusExtractedTask', {
            lambdaFunction: props.lambdaFunctions.StatusUpdater,
            inputPath: '$',
            resultPath: '$.statusUpdate',
        });

        const handleExtractionError = new tasks.LambdaInvoke(this, 'HandleExtractionErrorTask', {
            lambdaFunction: props.lambdaFunctions.ErrorHandler,
            inputPath: '$',
            resultPath: '$.errorHandlerResult',
        });

        const handleUnsupportedFileType = new tasks.LambdaInvoke(this, 'HandleUnsupportedFileTypeTask', {
            lambdaFunction: props.lambdaFunctions.ErrorHandler,
            inputPath: '$',
            resultPath: '$.errorHandlerResult',
        });

        const analyzeContent = new tasks.LambdaInvoke(this, 'AnalyzeContentTask', {
            lambdaFunction: props.lambdaFunctions.ContentAnalyzer,
            inputPath: '$',
            resultPath: '$.analysisResult',
        });

        const updateStatusAnalyzed = new tasks.LambdaInvoke(this, 'UpdateStatusAnalyzedTask', {
            lambdaFunction: props.lambdaFunctions.StatusUpdater,
            inputPath: '$',
            resultPath: '$.statusUpdate',
        });

        const handleAnalysisError = new tasks.LambdaInvoke(this, 'HandleAnalysisErrorTask', {
            lambdaFunction: props.lambdaFunctions.ErrorHandler,
            inputPath: '$',
            resultPath: '$.errorHandlerResult',
        });

        const compareDocuments = new tasks.LambdaInvoke(this, 'CompareDocumentsTask', {
            lambdaFunction: props.lambdaFunctions.DocumentComparer,
            inputPath: '$',
            resultPath: '$.comparisonResult',
        });

        const updateStatusCompared = new tasks.LambdaInvoke(this, 'UpdateStatusComparedTask', {
            lambdaFunction: props.lambdaFunctions.StatusUpdater,
            inputPath: '$',
            resultPath: '$.statusUpdate',
        });

        const handleComparisonError = new tasks.LambdaInvoke(this, 'HandleComparisonErrorTask', {
            lambdaFunction: props.lambdaFunctions.ErrorHandler,
            inputPath: '$',
            resultPath: '$.errorHandlerResult',
        });

        const generateInsights = new tasks.LambdaInvoke(this, 'GenerateInsightsTask', {
            lambdaFunction: props.lambdaFunctions.InsightGenerator,
            inputPath: '$',
            resultPath: '$.insightsResult',
        });

        const updateStatusInsightsGenerated = new tasks.LambdaInvoke(this, 'UpdateStatusInsightsGeneratedTask', {
            lambdaFunction: props.lambdaFunctions.StatusUpdater,
            inputPath: '$',
            resultPath: '$.statusUpdate',
        });

        const handleInsightError = new tasks.LambdaInvoke(this, 'HandleInsightErrorTask', {
            lambdaFunction: props.lambdaFunctions.ErrorHandler,
            inputPath: '$',
            resultPath: '$.errorHandlerResult',
        });

        const storeResults = new tasks.LambdaInvoke(this, 'StoreResultsTask', {
            lambdaFunction: props.lambdaFunctions.ResultStorage,
            inputPath: '$',
            resultPath: '$.storageResult',
        });

        const handleStorageError = new tasks.LambdaInvoke(this, 'HandleStorageErrorTask', {
            lambdaFunction: props.lambdaFunctions.ErrorHandler,
            inputPath: '$',
            resultPath: '$.errorHandlerResult',
        });

        const updateStatusCompleted = new tasks.LambdaInvoke(this, 'UpdateStatusCompletedTask', {
            lambdaFunction: props.lambdaFunctions.StatusUpdater,
            inputPath: '$',
            resultPath: '$.statusUpdate',
        });

        const updateStatusFailed = new tasks.LambdaInvoke(this, 'UpdateStatusFailedTask', {
            lambdaFunction: props.lambdaFunctions.StatusUpdater,
            inputPath: '$',
            resultPath: '$.statusUpdate',
        });

        const determineFileType = new sfn.Choice(this, 'DetermineFileType')
            .when(
                sfn.Condition.booleanEquals('$.validationResult.Payload.validationResult.isTextractSupported', true),
                extractWithTextract
            )
            .when(
                sfn.Condition.stringEquals('$.fileType', 'docx'),
                extractDocxText
            )
            .when(
                sfn.Condition.stringEquals('$.fileType', 'xlsx'),
                extractXlsxData
            )
            .when(
                sfn.Condition.stringEquals('$.fileType', 'csv'),
                extractCsvData
            )
            .otherwise(handleUnsupportedFileType);

        const checkMultipleDocuments = new sfn.Choice(this, 'CheckMultipleDocuments')
            .when(
                sfn.Condition.booleanEquals('$.isMultipleDocuments', true),
                compareDocuments
            )
            .otherwise(generateInsights);

        // Add catch clauses
        validateFile.addCatch(handleValidationError);
        extractWithTextract.addCatch(handleExtractionError);
        extractDocxText.addCatch(handleExtractionError);
        extractXlsxData.addCatch(handleExtractionError);
        extractCsvData.addCatch(handleExtractionError);
        analyzeContent.addCatch(handleAnalysisError);
        compareDocuments.addCatch(handleComparisonError);
        generateInsights.addCatch(handleInsightError);
        storeResults.addCatch(handleStorageError);

        // Connect the steps
        const workflow = initProcess
            .next(updateStatusStarted)
            .next(validateFile)
            .next(updateStatusValidated)
            .next(determineFileType);

        extractWithTextract.next(updateStatusExtracted);
        extractDocxText.next(updateStatusExtracted);
        extractXlsxData.next(updateStatusExtracted);
        extractCsvData.next(updateStatusExtracted);
        updateStatusExtracted.next(analyzeContent);
        analyzeContent.next(updateStatusAnalyzed);
        updateStatusAnalyzed.next(checkMultipleDocuments);
        compareDocuments.next(updateStatusCompared);
        updateStatusCompared.next(generateInsights);
        generateInsights.next(updateStatusInsightsGenerated);
        updateStatusInsightsGenerated.next(storeResults);
        storeResults.next(updateStatusCompleted);

        // Connect error handlers to failed state
        handleValidationError.next(updateStatusFailed);
        handleExtractionError.next(updateStatusFailed);
        handleUnsupportedFileType.next(updateStatusFailed);
        handleAnalysisError.next(updateStatusFailed);
        handleComparisonError.next(updateStatusFailed);
        handleInsightError.next(updateStatusFailed);
        handleStorageError.next(updateStatusFailed);

        // Create the state machine
        this.stateMachine = new sfn.StateMachine(this, id, {
            stateMachineName: props.stateMachineName,
            definition: sfn.Chain.start(workflow),
            role: this.role,
            timeout: cdk.Duration.minutes(30),
            tracingEnabled: true,
            logs: {
                destination: logGroup,
                level: sfn.LogLevel.ALL,
            },
        });
    }

    public grantStartExecution(grantee: iam.IGrantable): iam.Grant {
        return this.stateMachine.grantStartExecution(grantee);
    }

    public grantRead(grantee: iam.IGrantable): iam.Grant {
        return this.stateMachine.grantRead(grantee);
    }
}