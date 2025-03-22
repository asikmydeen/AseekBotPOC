import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { AseekbotCdkStack } from '../lib/aseekbot-cdk-stack';

describe('AseekbotCdkStack', () => {
  test('Stack creates S3 bucket', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new AseekbotCdkStack(app, 'MyTestStack');
    // THEN
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: expect.stringMatching(/aseekbot-files.*/),
    });
  });

  test('Stack creates DynamoDB tables', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new AseekbotCdkStack(app, 'MyTestStack');
    // THEN
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::DynamoDB::Table', 4);

    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'RequestStatus'
    });

    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'UserInteractions'
    });

    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'UserFiles'
    });

    template.hasResourceProperties('AWS::DynamoDB::Table', {
      TableName: 'DocumentAnalysisStatus'
    });
  });

  test('Stack creates SQS queues', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new AseekbotCdkStack(app, 'MyTestStack');
    // THEN
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::SQS::Queue', 2);

    template.hasResourceProperties('AWS::SQS::Queue', {
      QueueName: 'aseekbot-processing-queue'
    });

    template.hasResourceProperties('AWS::SQS::Queue', {
      QueueName: 'aseekbot-processing-dlq'
    });
  });

  test('Stack creates Step Functions state machine', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new AseekbotCdkStack(app, 'MyTestStack');
    // THEN
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);

    template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
      StateMachineName: 'DocumentAnalysisWorkflow'
    });
  });

  test('Stack creates API Gateway', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new AseekbotCdkStack(app, 'MyTestStack');
    // THEN
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
  });
});