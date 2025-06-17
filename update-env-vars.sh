#!/bin/bash

# Update environment variables for Na Winie Cloud Run service
# Usage: ./update-env-vars.sh [PROJECT_ID] [REGION]

set -e

# Configuration
PROJECT_ID=${1:-"your-project-id"}
REGION=${2:-"us-central1"}
SERVICE_NAME="nawinie"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔧 Updating environment variables for Na Winie Cloud Run service${NC}"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"
echo

# Set Google Cloud project
gcloud config set project $PROJECT_ID

# Check if service exists
if ! gcloud run services describe $SERVICE_NAME --region $REGION &> /dev/null; then
    echo -e "${RED}❌ Error: Service '$SERVICE_NAME' not found in region '$REGION'${NC}"
    echo "Please deploy the service first using ./deploy-cloud.sh"
    exit 1
fi

echo -e "${BLUE}📋 Current environment variables:${NC}"
gcloud run services describe $SERVICE_NAME --region $REGION --format="value(spec.template.spec.containers[0].env[].name,spec.template.spec.containers[0].env[].value)" | paste - - | column -t -s $'\t'
echo

echo -e "${YELLOW}🔧 Updating environment variables...${NC}"
echo "You can update specific environment variables. Leave empty to skip."
echo

# Prompt for environment variables
read -p "PUBLIC_SUPABASE_URL: " PUBLIC_SUPABASE_URL
read -p "PUBLIC_SUPABASE_ANON_KEY: " PUBLIC_SUPABASE_ANON_KEY
read -s -p "JWT_SECRET_KEY: " JWT_SECRET_KEY
echo
read -p "DATABASE_URL: " DATABASE_URL
read -p "CORS_ORIGINS (comma-separated): " CORS_ORIGINS

# Build the update command
UPDATE_VARS=""

if [ -n "$PUBLIC_SUPABASE_URL" ]; then
    UPDATE_VARS="${UPDATE_VARS}PUBLIC_SUPABASE_URL=$PUBLIC_SUPABASE_URL,"
    UPDATE_VARS="${UPDATE_VARS}SUPABASE_URL=$PUBLIC_SUPABASE_URL,"
fi

if [ -n "$PUBLIC_SUPABASE_ANON_KEY" ]; then
    UPDATE_VARS="${UPDATE_VARS}PUBLIC_SUPABASE_ANON_KEY=$PUBLIC_SUPABASE_ANON_KEY,"
    UPDATE_VARS="${UPDATE_VARS}SUPABASE_ANON_KEY=$PUBLIC_SUPABASE_ANON_KEY,"
fi

if [ -n "$JWT_SECRET_KEY" ]; then
    UPDATE_VARS="${UPDATE_VARS}JWT_SECRET_KEY=$JWT_SECRET_KEY,"
fi

if [ -n "$DATABASE_URL" ]; then
    UPDATE_VARS="${UPDATE_VARS}DATABASE_URL=$DATABASE_URL,"
fi

if [ -n "$CORS_ORIGINS" ]; then
    UPDATE_VARS="${UPDATE_VARS}CORS_ORIGINS=$CORS_ORIGINS,"
fi

# Remove trailing comma
UPDATE_VARS=${UPDATE_VARS%,}

if [ -n "$UPDATE_VARS" ]; then
    echo -e "${YELLOW}🚀 Updating Cloud Run service...${NC}"
    gcloud run services update $SERVICE_NAME \
        --region $REGION \
        --update-env-vars "$UPDATE_VARS"
    
    echo -e "${GREEN}✅ Environment variables updated successfully!${NC}"
    
    # Get the service URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')
    echo -e "${GREEN}🌐 Service URL: $SERVICE_URL${NC}"
    
else
    echo -e "${BLUE}ℹ️  No environment variables to update.${NC}"
fi

echo
echo -e "${YELLOW}📝 To view current environment variables:${NC}"
echo "gcloud run services describe $SERVICE_NAME --region $REGION --format=\"table(spec.template.spec.containers[0].env[].name,spec.template.spec.containers[0].env[].value)\""

echo
echo -e "${YELLOW}📊 To check service logs:${NC}"
echo "gcloud logs tail --service=$SERVICE_NAME"

echo
echo -e "${GREEN}✅ Update completed!${NC}" 