#!/bin/bash

# AseekBot Deployment Script
# Handles deployment of both backend and frontend components

# Text formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print header
echo -e "${BOLD}${CYAN}===============================================${NC}"
echo -e "${BOLD}${CYAN}          AseekBot Deployment Script          ${NC}"
echo -e "${BOLD}${CYAN}===============================================${NC}\n"

# Check for AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Validate AWS credentials
echo -e "${YELLOW}Validating AWS credentials...${NC}"
aws sts get-caller-identity &> /dev/null
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: AWS credentials are not configured properly.${NC}"
    echo -e "Please run ${BOLD}aws configure${NC} to set up your credentials."
    exit 1
fi

# Ask what to deploy
echo -e "\n${BOLD}What would you like to deploy?${NC}"
echo "1) Backend only"
echo "2) Frontend only"
echo "3) Both backend and frontend"
echo "4) Document Analysis Step Functions workflow only"
echo "5) All (Backend, Frontend, and Step Functions workflow)"
read -p "Enter your choice (1-5): " DEPLOY_CHOICE

# S3 bucket name prompt if needed
if [[ -z "$AWS_S3_BUCKET_NAME" ]]; then
    read -p "Enter S3 bucket name for backend file uploads: " AWS_S3_BUCKET_NAME
    export AWS_S3_BUCKET_NAME
fi

# Create AWS SDK v3 Lambda Layer
create_aws_sdk_layer() {
    echo -e "\n${BOLD}${CYAN}Creating AWS SDK v3 Lambda Layer...${NC}"

    # Create layer directory structure
    mkdir -p layers/aws-sdk-v3/nodejs
    cd layers/aws-sdk-v3/nodejs

    # Initialize package.json
    echo -e "${YELLOW}Initializing package.json for AWS SDK v3 layer...${NC}"
    cat > package.json << EOF
{
  "name": "aws-sdk-v3-layer",
  "version": "1.0.0",
  "description": "AWS SDK v3 and utility libraries for Lambda functions",
  "dependencies": {
    "@aws-sdk/client-s3": "^3.465.0",
    "@aws-sdk/client-dynamodb": "^3.465.0",
    "@aws-sdk/lib-dynamodb": "^3.465.0",
    "@aws-sdk/client-textract": "^3.465.0",
    "@aws-sdk/client-bedrock-agent-runtime": "^3.465.0",
    "@aws-sdk/client-sfn": "^3.465.0",
    "xlsx": "^0.18.5",
    "csv-parser": "^3.0.0"
  }
}
EOF

    # Install dependencies
    echo -e "${YELLOW}Installing AWS SDK v3 layer dependencies (this may take a few minutes)...${NC}"
    npm install

    # Back to project root
    cd ../../..

    echo -e "${GREEN}AWS SDK v3 Lambda Layer created successfully${NC}"
}

# Step Functions deployment function
deploy_step_functions() {
    echo -e "\n${BOLD}${CYAN}Deploying Document Analysis Step Functions Workflow...${NC}"

    # Navigate to backend directory
    cd aseekbot-lambda-api || exit 1

    # Set variables for Step Functions deployment
    STACK_NAME="aseekbot-document-analysis"
    REGION=$(aws configure get region)
    if [[ -z "$REGION" ]]; then
        REGION="us-east-1"
    fi

    echo -e "${YELLOW}Deploying Step Functions workflow using CloudFormation...${NC}"

    # Get Lambda ARNs for the state machine definition
    ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)

    # Deploy using pre-created template
    sed -e "s/\${InitProcessLambdaArn}/arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:aseekbot-api-dev-init-process/g" \
        -e "s/\${StatusUpdaterLambdaArn}/arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:aseekbot-api-dev-status-updater/g" \
        -e "s/\${FileValidationLambdaArn}/arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:aseekbot-api-dev-file-validation/g" \
        -e "s/\${TextractPdfLambdaArn}/arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:aseekbot-api-dev-textract-pdf/g" \
        -e "s/\${DocxParserLambdaArn}/arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:aseekbot-api-dev-docx-parser/g" \
        -e "s/\${ExcelParserLambdaArn}/arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:aseekbot-api-dev-excel-parser/g" \
        -e "s/\${CsvParserLambdaArn}/arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:aseekbot-api-dev-csv-parser/g" \
        -e "s/\${ContentAnalyzerLambdaArn}/arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:aseekbot-api-dev-content-analyzer/g" \
        -e "s/\${DocumentComparerLambdaArn}/arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:aseekbot-api-dev-document-comparer/g" \
        -e "s/\${InsightGeneratorLambdaArn}/arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:aseekbot-api-dev-insight-generator/g" \
        -e "s/\${ResultStorageLambdaArn}/arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:aseekbot-api-dev-result-storage/g" \
        -e "s/\${ErrorHandlerLambdaArn}/arn:aws:lambda:${REGION}:${ACCOUNT_ID}:function:aseekbot-api-dev-error-handler/g" \
        step-functions-template.yaml > step-functions-deployment.yaml

    # Deploy the CloudFormation stack
    aws cloudformation deploy \
      --template-file step-functions-deployment.yaml \
      --stack-name $STACK_NAME \
      --region $REGION \
      --capabilities CAPABILITY_IAM

    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Step Functions deployment failed. Check CloudFormation logs.${NC}"
        cd ..
        return 1
    fi

    # Get the ARN of the deployed state machine
    STATE_MACHINE_ARN=$(aws cloudformation describe-stacks \
      --stack-name $STACK_NAME \
      --region $REGION \
      --query "Stacks[0].Outputs[?OutputKey=='StateMachineArn'].OutputValue" \
      --output text)

    # Get the name of the DynamoDB status table
    STATUS_TABLE_NAME=$(aws cloudformation describe-stacks \
      --stack-name $STACK_NAME \
      --region $REGION \
      --query "Stacks[0].Outputs[?OutputKey=='StatusTableName'].OutputValue" \
      --output text)

    echo -e "${GREEN}Step Function deployed with ARN: ${BOLD}$STATE_MACHINE_ARN${NC}"
    echo -e "${GREEN}DynamoDB Status Table: ${BOLD}$STATUS_TABLE_NAME${NC}"

    # Update Lambda environment variables if startDocumentAnalysis exists
    if grep -q "documentAnalysis" serverless.yml; then
        echo -e "${YELLOW}Updating Lambda environment variables for documentAnalysis...${NC}"

        # Add Step Functions ARN to serverless.yml environment section
        if ! grep -q "DOCUMENT_ANALYSIS_STATE_MACHINE_ARN" serverless.yml; then
            # Find provider section
            PROVIDER_LINE=$(grep -n "provider:" serverless.yml | cut -d ':' -f 1)

            # Find environment section under provider
            ENV_LINE=$(tail -n +$PROVIDER_LINE serverless.yml | grep -n "environment:" | head -1 | cut -d ':' -f 1)
            ENV_LINE=$((PROVIDER_LINE + ENV_LINE - 1))

            # Add our environment variable under environment section
            sed -i -e "$ENV_LINE a\\      DOCUMENT_ANALYSIS_STATE_MACHINE_ARN: '$STATE_MACHINE_ARN'" serverless.yml
            sed -i -e "$ENV_LINE a\\      DOCUMENT_ANALYSIS_STATUS_TABLE: '$STATUS_TABLE_NAME'" serverless.yml

            echo -e "${GREEN}Updated serverless.yml with Step Functions ARN and DynamoDB table name${NC}"
        else
            echo -e "${YELLOW}Environment variables already exist in serverless.yml${NC}"
        fi
    else
        echo -e "${YELLOW}Warning: documentAnalysis function not found in serverless.yml. You may need to add it.${NC}"
    fi

    # Return to root directory
    cd ..

    echo -e "${GREEN}Document Analysis workflow deployment completed.${NC}"
    return 0
}

# Backend deployment function
deploy_backend() {
    echo -e "\n${BOLD}${CYAN}Deploying Backend Lambda Functions...${NC}"

    # Create the AWS SDK v3 Lambda Layer first
    create_aws_sdk_layer

    # Navigate to backend directory
    cd aseekbot-lambda-api || exit 1

    # Check if we need to update functions to use AWS SDK v3
    echo -e "${YELLOW}Checking Lambda functions for AWS SDK v3 compatibility...${NC}"

    # Update key Lambda functions to use AWS SDK v3
    update_status_updater=false

    if grep -q "require('aws-sdk')" functions/document-analysis/status-updater.js 2>/dev/null; then
        echo -e "${YELLOW}Updating status-updater.js to use AWS SDK v3...${NC}"
        update_status_updater=true
    fi

    if [ "$update_status_updater" = true ]; then
        cat > functions/document-analysis/status-updater.js << 'EOF'
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize clients
const dynamoClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamoClient);

exports.handler = async (event) => {
  console.log('Updating document status:', JSON.stringify(event, null, 2));

  try {
    // Extract status update information
    const {
      documentId,
      userId,
      status,
      message,
      resultLocation,
    } = event;

    // Create item to save in DynamoDB
    const item = {
      documentId,
      userId,
      status,
      message,
      timestamp: new Date().toISOString()
    };

    // Add optional fields if they exist
    if (resultLocation) item.resultLocation = resultLocation;

    // Save original input fields that need to be preserved
    if (event.s3Bucket) item.s3Bucket = event.s3Bucket;
    if (event.s3Key) item.s3Key = event.s3Key;
    if (event.fileType) item.fileType = event.fileType;

    // Update status in DynamoDB
    await docClient.send(new PutCommand({
      TableName: process.env.DOCUMENT_ANALYSIS_STATUS_TABLE || 'DocumentAnalysisStatus',
      Item: item
    }));

    console.log(`Status updated for document ${documentId}: ${status}`);

    // IMPORTANT: Return the complete input with all the original fields
    // This ensures the next state has access to all required fields
    return event;
  } catch (error) {
    console.error('Error updating status:', error);
    throw error;
  }
};
EOF
    fi

    # Ask if deploying specific function or all
    echo -e "\n${BOLD}Would you like to deploy a specific Lambda function or all functions?${NC}"
    echo "1) Deploy all functions"
    echo "2) Deploy specific function"
    read -p "Enter your choice (1-2): " FUNCTION_CHOICE

    if [[ "$FUNCTION_CHOICE" == "2" ]]; then
        echo -e "\nAvailable functions:"
        grep "^ *[a-zA-Z0-9_-]*:" -A 1 serverless.yml | grep handler | awk '{print $2}' | cut -d '/' -f 2 | cut -d '.' -f 1 | sort | uniq
        read -p "Enter function name to deploy: " FUNCTION_NAME

        echo -e "${YELLOW}Deploying Lambda function: ${FUNCTION_NAME}...${NC}"
        serverless deploy function -f "$FUNCTION_NAME"
    else
        echo -e "${YELLOW}Deploying all Lambda functions...${NC}"
        serverless deploy
    fi

    # Store API URL for frontend
    API_URL=$(serverless info --verbose | grep -m1 'ServiceEndpoint:' | awk '{print $2}')
    echo -e "${GREEN}Backend deployment completed.${NC}"
    echo -e "API Gateway URL: ${BOLD}${API_URL}${NC}"

    # Return to root directory
    cd ..

    return 0
}

# Frontend deployment function
deploy_frontend() {
    echo -e "\n${BOLD}${CYAN}Deploying Frontend Application...${NC}"

    # Navigate to frontend directory (assuming we're in the root of AseekBotPOC)
    cd "$(pwd)"

    # If API_URL is not set (frontend only deployment), ask for it
    if [[ -z "$API_URL" ]]; then
        read -p "Enter API Gateway URL (e.g., https://abc123def.execute-api.us-east-1.amazonaws.com/dev): " API_URL
    fi

    # Frontend S3 bucket
    if [[ -z "$FRONTEND_S3_BUCKET" ]]; then
        read -p "Enter S3 bucket name for frontend hosting: " FRONTEND_S3_BUCKET
    fi

    # CloudFront distribution ID
    if [[ -z "$CLOUDFRONT_DISTRIBUTION_ID" ]]; then
        read -p "Enter CloudFront distribution ID: " CLOUDFRONT_DISTRIBUTION_ID
    fi

    # Update lambdaApi.ts with the current API URL
    echo -e "${YELLOW}Updating API endpoint configuration...${NC}"
    if [[ -f "app/utils/lambdaApi.ts" ]]; then
        # Create backup
        cp app/utils/lambdaApi.ts app/utils/lambdaApi.ts.bak

        # Update API URL
        sed -i.tmp "s|export const API_BASE_URL = '.*';|export const API_BASE_URL = '$API_URL';|g" app/utils/lambdaApi.ts
        rm app/utils/lambdaApi.ts.tmp

        echo -e "${GREEN}Updated API URL in lambdaApi.ts${NC}"
    else
        echo -e "${YELLOW}Warning: Could not find lambdaApi.ts. Please update API endpoints manually.${NC}"
    fi

    # Build the application
    echo -e "${YELLOW}Building Next.js application...${NC}"
    NEXT_PUBLIC_API_BASE_URL="$API_URL" npm run build

    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Build failed. Please check the build logs above.${NC}"
        return 1
    fi

    # *** IMPORTANT FIX: Add _redirects file for client-side routing ***
    echo -e "${YELLOW}Adding SPA routing fix for client-side navigation...${NC}"
    echo "/* /index.html 200" > out/_redirects

    # *** IMPORTANT FIX: Copy index.html to userguide/index.html ***
    echo -e "${YELLOW}Creating userguide route static file...${NC}"
    mkdir -p out/userguide
    cp out/index.html out/userguide/index.html

    # *** IMPORTANT FIX: Create a 404.html file that redirects to index ***
    echo -e "${YELLOW}Creating 404 error handler...${NC}"
    cp out/index.html out/404.html

    # Upload to S3
    echo -e "${YELLOW}Uploading build files to S3...${NC}"
    aws s3 sync out/ "s3://$FRONTEND_S3_BUCKET/" --delete

    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: S3 upload failed. Check S3 permissions and bucket name.${NC}"
        return 1
    fi

    # Create CloudFront invalidation
    echo -e "${YELLOW}Creating CloudFront invalidation...${NC}"
    INVALIDATION_ID=$(aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" --paths "/*" --query 'Invalidation.Id' --output text)

    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: CloudFront invalidation failed. Check distribution ID.${NC}"
        return 1
    fi

    echo -e "${YELLOW}Checking CloudFront error page configuration...${NC}"
    # Get current error configuration
    HAS_404_CONFIG=$(aws cloudfront get-distribution-config --id "$CLOUDFRONT_DISTRIBUTION_ID" --query 'DistributionConfig.CustomErrorResponses' --output text)

    if [[ -z "$HAS_404_CONFIG" || "$HAS_404_CONFIG" == "None" ]]; then
        echo -e "${YELLOW}No custom error responses found. Please configure CloudFront custom error pages:${NC}"
        echo -e "${BOLD}1. Go to CloudFront console: https://console.aws.amazon.com/cloudfront/${NC}"
        echo -e "${BOLD}2. Select your distribution: $CLOUDFRONT_DISTRIBUTION_ID${NC}"
        echo -e "${BOLD}3. Go to Error Pages tab and add:${NC}"
        echo -e "   - HTTP Error Code: 403, Response Page Path: /index.html, HTTP Response Code: 200"
        echo -e "   - HTTP Error Code: 404, Response Page Path: /index.html, HTTP Response Code: 200"
    else
        echo -e "${GREEN}Custom error responses are configured.${NC}"
    fi

    echo -e "${GREEN}Frontend deployment completed.${NC}"
    echo -e "CloudFront invalidation created: ${BOLD}$INVALIDATION_ID${NC}"
    echo -e "Your site will be available at: ${BOLD}https://$(aws cloudfront get-distribution --id "$CLOUDFRONT_DISTRIBUTION_ID" --query 'Distribution.DomainName' --output text)${NC}"

    return 0
}

# Execute deployment based on choice
case $DEPLOY_CHOICE in
    1)
        deploy_backend
        ;;
    2)
        deploy_frontend
        ;;
    3)
        deploy_backend && deploy_frontend
        ;;
    4)
        deploy_step_functions
        ;;
    5)
        deploy_backend && deploy_step_functions && deploy_frontend
        ;;
    *)
        echo -e "${RED}Invalid choice. Exiting.${NC}"
        exit 1
        ;;
esac

# Final message
echo -e "\n${BOLD}${GREEN}===============================================${NC}"
echo -e "${BOLD}${GREEN}       Deployment process complete!           ${NC}"
echo -e "${BOLD}${GREEN}===============================================${NC}"

# Save deployment configuration for future use
if [[ "$DEPLOY_CHOICE" == "1" || "$DEPLOY_CHOICE" == "3" || "$DEPLOY_CHOICE" == "5" ]]; then
    echo -e "\n${YELLOW}Would you like to save backend deployment settings for next time? (y/n)${NC}"
    read -p "> " SAVE_BACKEND
    if [[ "$SAVE_BACKEND" == "y" || "$SAVE_BACKEND" == "Y" ]]; then
        echo "export AWS_S3_BUCKET_NAME=\"$AWS_S3_BUCKET_NAME\"" > deploy-config.sh
        echo -e "${GREEN}Backend settings saved.${NC}"
    fi
fi

if [[ "$DEPLOY_CHOICE" == "2" || "$DEPLOY_CHOICE" == "3" || "$DEPLOY_CHOICE" == "5" ]]; then
    echo -e "\n${YELLOW}Would you like to save frontend deployment settings for next time? (y/n)${NC}"
    read -p "> " SAVE_FRONTEND
    if [[ "$SAVE_FRONTEND" == "y" || "$SAVE_FRONTEND" == "Y" ]]; then
        echo "export FRONTEND_S3_BUCKET=\"$FRONTEND_S3_BUCKET\"" >> deploy-config.sh
        echo "export CLOUDFRONT_DISTRIBUTION_ID=\"$CLOUDFRONT_DISTRIBUTION_ID\"" >> deploy-config.sh
        echo "export API_URL=\"$API_URL\"" >> deploy-config.sh
        echo -e "${GREEN}Frontend settings saved.${NC}"
    fi
fi

if [[ "$DEPLOY_CHOICE" == "4" || "$DEPLOY_CHOICE" == "5" ]]; then
    echo -e "\n${YELLOW}Would you like to save Step Functions deployment settings for next time? (y/n)${NC}"
    read -p "> " SAVE_STEPFUNCTIONS
    if [[ "$SAVE_STEPFUNCTIONS" == "y" || "$SAVE_STEPFUNCTIONS" == "Y" ]]; then
        if [[ -f deploy-config.sh ]]; then
            echo "" >> deploy-config.sh
            echo "# Step Functions settings" >> deploy-config.sh
            echo "export DOCUMENT_ANALYSIS_STATE_MACHINE_ARN=\"$STATE_MACHINE_ARN\"" >> deploy-config.sh
            echo "export DOCUMENT_ANALYSIS_STATUS_TABLE=\"$STATUS_TABLE_NAME\"" >> deploy-config.sh
        else
            echo "# Step Functions settings" > deploy-config.sh
            echo "export DOCUMENT_ANALYSIS_STATE_MACHINE_ARN=\"$STATE_MACHINE_ARN\"" >> deploy-config.sh
            echo "export DOCUMENT_ANALYSIS_STATUS_TABLE=\"$STATUS_TABLE_NAME\"" >> deploy-config.sh
        fi
        echo -e "${GREEN}Step Functions settings saved.${NC}"
    fi
fi

echo -e "\nNexttime, you can source these settings with: ${BOLD}source deploy-config.sh${NC}\n"

exit 0