import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export interface BaseTableProps {
  tableName: string;
  partitionKey: dynamodb.Attribute;
  sortKey?: dynamodb.Attribute;
  billingMode?: dynamodb.BillingMode;
  removalPolicy?: cdk.RemovalPolicy;
  pointInTimeRecovery?: boolean;
  timeToLiveAttribute?: string;
  stream?: dynamodb.StreamViewType;
}

export interface GlobalSecondaryIndexProps {
  indexName: string;
  partitionKey: dynamodb.Attribute;
  sortKey?: dynamodb.Attribute;
  projectionType?: dynamodb.ProjectionType;
  nonKeyAttributes?: string[];
}

export class BaseTableConstruct extends Construct {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: BaseTableProps) {
    super(scope, id);

    this.table = new dynamodb.Table(this, id, {
      tableName: props.tableName,
      partitionKey: props.partitionKey,
      sortKey: props.sortKey,
      billingMode: props.billingMode || dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: props.removalPolicy || cdk.RemovalPolicy.RETAIN,
      pointInTimeRecovery: props.pointInTimeRecovery || false,
      timeToLiveAttribute: props.timeToLiveAttribute,
      stream: props.stream,
    });
  }

  public addGlobalSecondaryIndex(props: GlobalSecondaryIndexProps): void {
    this.table.addGlobalSecondaryIndex({
      indexName: props.indexName,
      partitionKey: props.partitionKey,
      sortKey: props.sortKey,
      projectionType: props.projectionType || dynamodb.ProjectionType.ALL,
      nonKeyAttributes: props.nonKeyAttributes,
    });
  }

  public grantReadData(grantee: cdk.aws_iam.IGrantable): cdk.aws_iam.Grant {
    return this.table.grantReadData(grantee);
  }

  public grantWriteData(grantee: cdk.aws_iam.IGrantable): cdk.aws_iam.Grant {
    return this.table.grantWriteData(grantee);
  }

  public grantReadWriteData(grantee: cdk.aws_iam.IGrantable): cdk.aws_iam.Grant {
    return this.table.grantReadWriteData(grantee);
  }
}

export class RequestStatusTableConstruct extends BaseTableConstruct {
  constructor(scope: Construct, id: string, props: {
    tableName: string;
    removalPolicy?: cdk.RemovalPolicy;
  }) {
    super(scope, id, {
      tableName: props.tableName,
      partitionKey: {
        name: 'requestId',
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: props.removalPolicy,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // Add GSI for sessionId
    this.addGlobalSecondaryIndex({
      indexName: 'SessionIdIndex',
      partitionKey: {
        name: 'sessionId',
        type: dynamodb.AttributeType.STRING,
      },
    });
  }
}

export class DocumentAnalysisStatusTableConstruct extends BaseTableConstruct {
  constructor(scope: Construct, id: string, props: {
    tableName: string;
    removalPolicy?: cdk.RemovalPolicy;
  }) {
    super(scope, id, {
      tableName: props.tableName,
      partitionKey: {
        name: 'documentId',
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: props.removalPolicy,
    });
  }
}

export class UserInteractionsTableConstruct extends BaseTableConstruct {
  constructor(scope: Construct, id: string, props: {
    tableName: string;
    removalPolicy?: cdk.RemovalPolicy;
  }) {
    super(scope, id, {
      tableName: props.tableName,
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: props.removalPolicy,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });

    // Add GSI for chatId
    this.addGlobalSecondaryIndex({
      indexName: 'ChatIdIndex',
      partitionKey: {
        name: 'chatId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // Add timestamp GSI for sorting and querying
    this.addGlobalSecondaryIndex({
      indexName: 'chatId-timestamp-index',
      partitionKey: {
        name: 'chatId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
    });
  }
}

export class UserFilesTableConstruct extends BaseTableConstruct {
  constructor(scope: Construct, id: string, props: {
    tableName: string;
    removalPolicy?: cdk.RemovalPolicy;
  }) {
    super(scope, id, {
      tableName: props.tableName,
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'fileKey',
        type: dynamodb.AttributeType.STRING,
      },
      removalPolicy: props.removalPolicy,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
    });
  }
}