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
read -p "Enter your choice (1-3): " DEPLOY_CHOICE

# S3 bucket name prompt if needed
if [[ -z "$AWS_S3_BUCKET_NAME" ]]; then
    read -p "Enter S3 bucket name for backend file uploads: " AWS_S3_BUCKET_NAME
    export AWS_S3_BUCKET_NAME
fi

# Backend deployment function
deploy_backend() {
    echo -e "\n${BOLD}${CYAN}Deploying Backend Lambda Functions...${NC}"

    # Navigate to backend directory
    cd aseekbot-lambda-api || exit 1

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
if [[ "$DEPLOY_CHOICE" == "1" || "$DEPLOY_CHOICE" == "3" ]]; then
    echo -e "\n${YELLOW}Would you like to save backend deployment settings for next time? (y/n)${NC}"
    read -p "> " SAVE_BACKEND
    if [[ "$SAVE_BACKEND" == "y" || "$SAVE_BACKEND" == "Y" ]]; then
        echo "export AWS_S3_BUCKET_NAME=\"$AWS_S3_BUCKET_NAME\"" > deploy-config.sh
        echo -e "${GREEN}Backend settings saved.${NC}"
    fi
fi

if [[ "$DEPLOY_CHOICE" == "2" || "$DEPLOY_CHOICE" == "3" ]]; then
    echo -e "\n${YELLOW}Would you like to save frontend deployment settings for next time? (y/n)${NC}"
    read -p "> " SAVE_FRONTEND
    if [[ "$SAVE_FRONTEND" == "y" || "$SAVE_FRONTEND" == "Y" ]]; then
        echo "export FRONTEND_S3_BUCKET=\"$FRONTEND_S3_BUCKET\"" >> deploy-config.sh
        echo "export CLOUDFRONT_DISTRIBUTION_ID=\"$CLOUDFRONT_DISTRIBUTION_ID\"" >> deploy-config.sh
        echo "export API_URL=\"$API_URL\"" >> deploy-config.sh
        echo -e "${GREEN}Frontend settings saved.${NC}"
    fi
fi

echo -e "\nNexttime, you can source these settings with: ${BOLD}source deploy-config.sh${NC}\n"

exit 0