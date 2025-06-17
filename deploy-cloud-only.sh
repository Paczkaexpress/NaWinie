#!/bin/bash

# Deploy Na Winie to Google Cloud (Cloud-Only Version)
# This script is optimized for Google Cloud deployment only
# Usage: ./deploy-cloud-only.sh [PROJECT_ID] [REGION]

set -e

# Configuration
PROJECT_ID=${1:-"your-project-id"}
REGION=${2:-"us-central1"}
SERVICE_NAME="nawinie"
IMAGE_NAME="nawinie-cloud"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Deploying Na Winie to Google Cloud (Cloud-Only)${NC}"
echo -e "${BLUE}Project ID: $PROJECT_ID${NC}"
echo -e "${BLUE}Region: $REGION${NC}"
echo -e "${BLUE}Service: $SERVICE_NAME${NC}"
echo

# Check if required environment variables are set
required_vars=(
    "PUBLIC_SUPABASE_URL"
    "PUBLIC_SUPABASE_ANON_KEY"
    "JWT_SECRET_KEY"
    "DATABASE_URL"
    "SUPABASE_SERVICE_ROLE_KEY"
)

echo -e "${YELLOW}📋 Validating required environment variables...${NC}"
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Error: $var is not set${NC}"
        echo "Please set all required environment variables before deploying."
        echo
        echo -e "${YELLOW}Required variables:${NC}"
        echo "export PUBLIC_SUPABASE_URL='https://your-project.supabase.co'"
        echo "export PUBLIC_SUPABASE_ANON_KEY='your-supabase-anon-key'"
        echo "export JWT_SECRET_KEY='\$(openssl rand -hex 32)'"
        echo "export DATABASE_URL='postgresql://user:pass@host:5432/db'"
        echo "export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'"
        echo
        echo -e "${YELLOW}Optional variables:${NC}"
        echo "export CORS_ORIGINS='https://your-domain.com'"
        exit 1
    else
        echo -e "${GREEN}✅ $var is set${NC}"
    fi
done

# Set optional variables with defaults
CORS_ORIGINS=${CORS_ORIGINS:-"https://your-domain.com"}

echo -e "${YELLOW}🔧 Setting up Google Cloud project...${NC}"
gcloud config set project $PROJECT_ID

echo -e "${YELLOW}🔌 Enabling required Google Cloud APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

echo -e "${YELLOW}🏗️ Building and deploying with Cloud Build...${NC}"
gcloud builds submit . \
    --config cloudbuild.cloud.yaml \
    --substitutions=\
_PUBLIC_SUPABASE_URL="$PUBLIC_SUPABASE_URL",\
_PUBLIC_SUPABASE_ANON_KEY="$PUBLIC_SUPABASE_ANON_KEY",\
_JWT_SECRET_KEY="$JWT_SECRET_KEY",\
_DATABASE_URL="$DATABASE_URL",\
_SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY",\
_REGION="$REGION",\
_CORS_ORIGINS="$CORS_ORIGINS"

# Get the service URL
echo -e "${YELLOW}🔍 Getting service information...${NC}"
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)' 2>/dev/null || echo "")

if [ -n "$SERVICE_URL" ]; then
    echo
    echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
    echo -e "${GREEN}🌐 Service URL: $SERVICE_URL${NC}"
    echo
    echo -e "${YELLOW}📝 Next steps:${NC}"
    echo "1. Update your CORS_ORIGINS to include: $SERVICE_URL"
    echo "2. Update your Supabase redirect URLs to include: $SERVICE_URL"
    echo "3. Test your application:"
    echo "   curl $SERVICE_URL"
    echo "   curl $SERVICE_URL/docs (API documentation)"
    echo
    echo -e "${YELLOW}🔧 Service Management:${NC}"
    echo "View logs:    gcloud run services logs read $SERVICE_NAME --region $REGION"
    echo "View service: gcloud run services describe $SERVICE_NAME --region $REGION"
    echo "Update env:   gcloud run services update $SERVICE_NAME --region $REGION --set-env-vars KEY=VALUE"
    echo "Scale down:   gcloud run services update $SERVICE_NAME --region $REGION --min-instances=0"
    echo
    echo -e "${GREEN}🎉 Cloud-only deployment complete!${NC}"
else
    echo -e "${RED}❌ Could not retrieve service URL. Check Cloud Run console.${NC}"
    exit 1
fi 