#!/bin/bash

# AseekBot Frontend Deployment Script
# Handles deployment of the frontend component only

# Text formatting
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Print header
echo -e "${BOLD}${CYAN}===============================================${NC}"
echo -e "${BOLD}${CYAN}         AseekBot Frontend Deployment         ${NC}"
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

deploy_frontend() {
    echo -e "\n${BOLD}${CYAN}Deploying Frontend Application...${NC}"

    # Navigate to the project root directory
    cd "$(pwd)"

    # If API_URL is not set, prompt for it
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

    # Update API endpoint configuration in lambdaApi.ts (if the file exists)
    echo -e "${YELLOW}Updating API endpoint configuration...${NC}"
    if [[ -f "app/utils/lambdaApi.ts" ]]; then
        cp app/utils/lambdaApi.ts app/utils/lambdaApi.ts.bak
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

    # Add _redirects file for SPA client-side routing
    echo -e "${YELLOW}Adding SPA routing fix for client-side navigation...${NC}"
    echo "/* /index.html 200" > out/_redirects

    # Copy index.html to create a userguide route
    echo -e "${YELLOW}Creating userguide route static file...${NC}"
    mkdir -p out/userguide
    cp out/index.html out/userguide/index.html

    # Create a 404.html file that redirects to index.html
    echo -e "${YELLOW}Creating 404 error handler...${NC}"
    cp out/index.html out/404.html

    # Upload build files to S3
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

    # Check CloudFront error page configuration
    echo -e "${YELLOW}Checking CloudFront error page configuration...${NC}"
    HAS_404_CONFIG=$(aws cloudfront get-distribution-config --id "$CLOUDFRONT_DISTRIBUTION_ID" --query 'DistributionConfig.CustomErrorResponses' --output text)
    if [[ -z "$HAS_404_CONFIG" || "$HAS_404_CONFIG" == "None" ]]; then
        echo -e "${YELLOW}No custom error responses found. Please configure CloudFront custom error pages:${NC}"
        echo -e "${BOLD}1. Go to CloudFront console: https://console.aws.amazon.com/cloudfront/${NC}"
        echo -e "${BOLD}2. Select your distribution: $CLOUDFRONT_DISTRIBUTION_ID${NC}"
        echo -e "${BOLD}3. Go to the Error Pages tab and add:${NC}"
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

# Execute frontend deployment
deploy_frontend

# Final message
echo -e "\n${BOLD}${GREEN}===============================================${NC}"
echo -e "${BOLD}${GREEN}       Frontend Deployment Complete!          ${NC}"
echo -e "${BOLD}${GREEN}===============================================${NC}"

# Save frontend deployment settings for future use
echo -e "\n${YELLOW}Would you like to save frontend deployment settings for next time? (y/n)${NC}"
read -p "> " SAVE_FRONTEND
if [[ "$SAVE_FRONTEND" == "y" || "$SAVE_FRONTEND" == "Y" ]]; then
    echo "export FRONTEND_S3_BUCKET=\"$FRONTEND_S3_BUCKET\"" > deploy-config.sh
    echo "export CLOUDFRONT_DISTRIBUTION_ID=\"$CLOUDFRONT_DISTRIBUTION_ID\"" >> deploy-config.sh
    echo "export API_URL=\"$API_URL\"" >> deploy-config.sh
    echo -e "${GREEN}Frontend settings saved.${NC}"
fi

echo -e "\nNext time, you can source these settings with: ${BOLD}source deploy-config.sh${NC}\n"

exit 0
