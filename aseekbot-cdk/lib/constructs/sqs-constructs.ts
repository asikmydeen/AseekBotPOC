import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as iam from 'aws-cdk-lib/aws-iam';

export interface BaseQueueProps {
  queueName: string;
  visibilityTimeout?: cdk.Duration;
  retentionPeriod?: cdk.Duration;
  fifo?: boolean;
  contentBasedDeduplication?: boolean;
  deliveryDelay?: cdk.Duration;
}

export interface DeadLetterQueueProps extends BaseQueueProps {
  maxReceiveCount?: number;
}

export class BaseQueueConstruct extends Construct {
  public readonly queue: sqs.Queue;

  constructor(scope: Construct, id: string, props: BaseQueueProps) {
    super(scope, id);

    this.queue = new sqs.Queue(this, id, {
      queueName: props.queueName,
      visibilityTimeout: props.visibilityTimeout || cdk.Duration.seconds(30),
      retentionPeriod: props.retentionPeriod || cdk.Duration.days(4),
      fifo: props.fifo || false,
      contentBasedDeduplication: props.contentBasedDeduplication || false,
      deliveryDelay: props.deliveryDelay,
    });
  }

  public grantSendMessages(grantee: iam.IGrantable): iam.Grant {
    return this.queue.grantSendMessages(grantee);
  }

  public grantConsumeMessages(grantee: iam.IGrantable): iam.Grant {
    return this.queue.grantConsumeMessages(grantee);
  }

  public grantPurge(grantee: iam.IGrantable): iam.Grant {
    return this.queue.grantPurge(grantee);
  }
}

export class QueueWithDLQConstruct extends Construct {
  public readonly queue: sqs.Queue;
  public readonly deadLetterQueue: sqs.Queue;

  constructor(scope: Construct, id: string, props: DeadLetterQueueProps) {
    super(scope, id);

    // Create the dead letter queue
    this.deadLetterQueue = new sqs.Queue(this, `${id}DeadLetterQueue`, {
      queueName: `${props.queueName}-dlq`,
      retentionPeriod: props.retentionPeriod || cdk.Duration.days(14), // Longer retention for DLQ
      fifo: props.fifo || false,
      contentBasedDeduplication: props.contentBasedDeduplication || false,
    });

    // Create the main queue with the dead letter queue configured
    this.queue = new sqs.Queue(this, `${id}Queue`, {
      queueName: props.queueName,
      visibilityTimeout: props.visibilityTimeout || cdk.Duration.seconds(30),
      retentionPeriod: props.retentionPeriod || cdk.Duration.days(4),
      fifo: props.fifo || false,
      contentBasedDeduplication: props.contentBasedDeduplication || false,
      deliveryDelay: props.deliveryDelay,
      deadLetterQueue: {
        queue: this.deadLetterQueue,
        maxReceiveCount: props.maxReceiveCount || 3,
      },
    });
  }

  public grantSendMessages(grantee: iam.IGrantable): iam.Grant {
    return this.queue.grantSendMessages(grantee);
  }

  public grantConsumeMessages(grantee: iam.IGrantable): iam.Grant {
    return this.queue.grantConsumeMessages(grantee);
  }

  public grantPurge(grantee: iam.IGrantable): iam.Grant {
    return this.queue.grantPurge(grantee);
  }
}

export class ProcessingQueueConstruct extends QueueWithDLQConstruct {
  constructor(scope: Construct, id: string, props?: {
    queueName?: string;
    maxReceiveCount?: number;
  }) {
    super(scope, id, {
      queueName: props?.queueName || 'aseekbot-processing-queue',
      visibilityTimeout: cdk.Duration.seconds(900), // 15 minutes to match Lambda timeout
      retentionPeriod: cdk.Duration.days(14),
      maxReceiveCount: props?.maxReceiveCount || 3,
    });
  }
}

export class NotificationQueueConstruct extends QueueWithDLQConstruct {
  constructor(scope: Construct, id: string, props?: {
    queueName?: string;
    maxReceiveCount?: number;
  }) {
    super(scope, id, {
      queueName: props?.queueName || 'aseekbot-notification-queue',
      visibilityTimeout: cdk.Duration.seconds(60),
      retentionPeriod: cdk.Duration.days(7),
      maxReceiveCount: props?.maxReceiveCount || 3,
    });
  }
}