import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as path from 'path';

export interface BaseLambdaProps {
    functionName: string;
    description?: string;
    handler: string;
    memorySize?: number;
    timeout?: cdk.Duration;
    environment?: { [key: string]: string };
    layers?: lambda.ILayerVersion[];
    runtime?: lambda.Runtime;
    codePath: string;
    reservedConcurrentExecutions?: number;
}

export interface ApiLambdaProps extends BaseLambdaProps {
    apiRole?: iam.IRole;
}

export interface ProcessorLambdaProps extends BaseLambdaProps {
    processorRole?: iam.IRole;
}

export class BaseLambdaConstruct extends Construct {
    public readonly function: lambda.Function;
    public readonly role: iam.Role;

    constructor(scope: Construct, id: string, props: BaseLambdaProps, role?: iam.IRole) {
        super(scope, id);

        // Create role for the Lambda function if not provided
        if (!role) {
            this.role = new iam.Role(this, `${id}Role`, {
                assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
            });

            // Add basic Lambda execution permissions
            this.role.addManagedPolicy(
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
            );
        } else {
            this.role = role as iam.Role;
        }

        // Create the Lambda function
        this.function = new lambda.Function(this, id, {
            functionName: props.functionName,
            description: props.description,
            handler: props.handler,
            runtime: props.runtime || lambda.Runtime.NODEJS_18_X,
            code: lambda.Code.fromAsset(props.codePath),
            memorySize: props.memorySize || 256,
            timeout: props.timeout || cdk.Duration.seconds(29),
            environment: props.environment,
            layers: props.layers,
            role: this.role,
            reservedConcurrentExecutions: props.reservedConcurrentExecutions,
            logRetention: logs.RetentionDays.ONE_WEEK,
        });
    }

    public addToPolicy(statement: iam.PolicyStatement): void {
        this.role.addToPolicy(statement);
    }

    public grantInvoke(grantee: iam.IGrantable): iam.Grant {
        return this.function.grantInvoke(grantee);
    }
}

export class ApiLambdaConstruct extends BaseLambdaConstruct {
    constructor(scope: Construct, id: string, props: ApiLambdaProps) {
        super(
            scope,
            id,
            {
                ...props,
                timeout: props.timeout || cdk.Duration.seconds(29) // API Gateway has a 30-second timeout
            },
            props.apiRole
        );

        // Add API Gateway specific permissions if needed
        this.role.addToPolicy(
            new iam.PolicyStatement({
                actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
                resources: ['*'],
            })
        );
    }
}

export class ProcessorLambdaConstruct extends BaseLambdaConstruct {
    constructor(scope: Construct, id: string, props: ProcessorLambdaProps) {
        super(
            scope,
            id,
            {
                ...props,
                timeout: props.timeout || cdk.Duration.seconds(900), // Longer timeout for processing functions
                memorySize: props.memorySize || 512 // More memory for processing
            },
            props.processorRole
        );

        // Add specialized permissions for processor functions if needed
        this.role.addToPolicy(
            new iam.PolicyStatement({
                actions: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                    'states:StartExecution',
                    'states:DescribeExecution'
                ],
                resources: ['*'],
            })
        );
    }
}

export class DocumentAnalysisLambdaConstruct extends BaseLambdaConstruct {
    constructor(scope: Construct, id: string, props: BaseLambdaProps) {
        super(
            scope,
            id,
            {
                ...props,
                timeout: props.timeout || cdk.Duration.seconds(60)
            }
        );

        // Add permissions specific to document analysis
        this.role.addToPolicy(
            new iam.PolicyStatement({
                actions: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                ],
                resources: ['*'],
            })
        );
    }
}

export class LambdaLayerConstruct extends Construct {
  public readonly layer: lambda.LayerVersion;

  constructor(scope: Construct, id: string, props: {
    layerName: string;
    description?: string;
    codePath: string;
    compatibleRuntimes?: lambda.Runtime[];
  }) {
    super(scope, id);

    this.layer = new lambda.LayerVersion(this, id, {
      layerVersionName: props.layerName,
      description: props.description,
      code: lambda.Code.fromAsset(props.codePath),
      compatibleRuntimes: props.compatibleRuntimes || [lambda.Runtime.NODEJS_18_X],
    });
  }
}
