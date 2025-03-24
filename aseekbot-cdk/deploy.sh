#!/bin/bash

# deploy.sh - Wrapper script to properly set environment variables for deployment

# Set default values
export ENVIRONMENT=dev
export AWS_S3_BUCKET_NAME=aseekbot-files-dev
export IMPORT_BUCKET=false
export CREATE_TABLES=false
export IMPORT_RESOURCES=false

# Process command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --import-all)
      export IMPORT_BUCKET=true
      export IMPORT_RESOURCES=true
      shift
      ;;
    --import-bucket)
      export IMPORT_BUCKET=true
      shift
      ;;
    --import-resources)
      export IMPORT_RESOURCES=true
      shift
      ;;
    --no-import-bucket)
      export IMPORT_BUCKET=false
      shift
      ;;
    --create-tables)
      export CREATE_TABLES=true
      shift
      ;;
    --no-create-tables)
      export CREATE_TABLES=false
      shift
      ;;
    --env|--environment)
      export ENVIRONMENT="$2"
      if [[ "$ENVIRONMENT" == "prod" ]]; then
        export AWS_S3_BUCKET_NAME=aseekbot-files
      else
        export AWS_S3_BUCKET_NAME=aseekbot-files-${ENVIRONMENT}
      fi
      shift 2
      ;;
    --stack)
      export STACK_TO_DEPLOY="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Display configuration
echo "Deployment Configuration:"
echo "-------------------------"
echo "Environment: $ENVIRONMENT"
echo "S3 Bucket: $AWS_S3_BUCKET_NAME"
echo "Import Bucket: $IMPORT_BUCKET"
echo "Import Resources: $IMPORT_RESOURCES"
echo "Create Tables: $CREATE_TABLES"
echo "Stack to Deploy: ${STACK_TO_DEPLOY:-all}"
echo

# Build the project
echo "Building project..."
npm run build

# Run deployment
echo "Starting deployment..."
if [[ -n "$STACK_TO_DEPLOY" ]]; then
  npx cdk deploy "$STACK_TO_DEPLOY" --require-approval never
else
  npx cdk deploy --all --require-approval never
fi