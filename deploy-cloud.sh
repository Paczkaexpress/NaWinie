#!/bin/bash

# Deploy Na Winie to Google Cloud
# Usage: ./deploy-cloud.sh [PROJECT_ID] [REGION]

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

echo -e "${GREEN}🚀 Deploying Na Winie to Google Cloud${NC}"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo

# Set Google Cloud project
echo -e "${YELLOW}🔧 Setting up Google Cloud project...${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}🔌 Enabling required Google Cloud APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com

# Check if environment variables are set in Cloud Console
echo -e "${BLUE}📋 Checking for environment variables in Google Cloud...${NC}"
echo "This script will use environment variables that you've set in:"
echo "1. Google Cloud Build substitution variables"
echo "2. Google Cloud Console > Cloud Run > Service > Variables & Secrets"
echo

# Option 1: Deploy using Cloud Build (Recommended)
echo -e "${YELLOW}🏗️ Building and deploying with Cloud Build...${NC}"
echo "Make sure you have set the following substitution variables in your Cloud Build trigger:"
echo "- _PUBLIC_SUPABASE_URL"
echo "- _PUBLIC_SUPABASE_ANON_KEY"
echo "- _JWT_SECRET_KEY"
echo "- _DATABASE_URL"
echo "- _CORS_ORIGINS"
echo

read -p "Do you want to continue with Cloud Build deployment? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Build and deploy using Cloud Build
    echo -e "${YELLOW}🏗️ Submitting build to Cloud Build...${NC}"
    echo "Note: Make sure your substitution variables are set in the Cloud Build trigger."
    
    gcloud builds submit . --config cloudbuild.yaml
    
    # Get the service URL
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)' 2>/dev/null || echo "")
    
    if [ -n "$SERVICE_URL" ]; then
        echo
        echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
        echo -e "${GREEN}🌐 Service URL: $SERVICE_URL${NC}"
    else
        echo -e "${RED}❌ Deployment may have failed. Check Cloud Build logs.${NC}"
    fi
else
    echo -e "${BLUE}ℹ️  Skipping Cloud Build deployment.${NC}"
fi

echo
echo -e "${YELLOW}📝 Alternative deployment methods:${NC}"
echo
echo -e "${BLUE}Option 1: Set environment variables in Cloud Build trigger${NC}"
echo "1. Go to Google Cloud Console > Cloud Build > Triggers"
echo "2. Edit your trigger and add substitution variables:"
echo "   _PUBLIC_SUPABASE_URL = your-supabase-url"
echo "   _PUBLIC_SUPABASE_ANON_KEY = your-anon-key"
echo "   _JWT_SECRET_KEY = your-jwt-secret"
echo "   _DATABASE_URL = your-database-url"
echo "   _CORS_ORIGINS = your-cors-origins"
echo

echo -e "${BLUE}Option 2: Manual deployment with gcloud${NC}"
echo "If you have environment variables set locally, run:"
echo "gcloud builds submit . --config cloudbuild.yaml \\"
echo "  --substitutions=\\"
echo "_PUBLIC_SUPABASE_URL=\"\$PUBLIC_SUPABASE_URL\",\\"
echo "_PUBLIC_SUPABASE_ANON_KEY=\"\$PUBLIC_SUPABASE_ANON_KEY\",\\"
echo "_JWT_SECRET_KEY=\"\$JWT_SECRET_KEY\",\\"
echo "_DATABASE_URL=\"\$DATABASE_URL\",\\"
echo "_CORS_ORIGINS=\"\$CORS_ORIGINS\""
echo

echo -e "${BLUE}Option 3: Update existing Cloud Run service${NC}"
echo "If you want to update environment variables on an existing service:"
echo "gcloud run services update $SERVICE_NAME --region $REGION \\"
echo "  --update-env-vars JWT_SECRET_KEY=your-secret,PUBLIC_SUPABASE_URL=your-url"
echo

echo -e "${YELLOW}🔧 Next steps after deployment:${NC}"
echo "1. Verify your service is running: gcloud run services list"
echo "2. Check logs: gcloud logs tail --service=$SERVICE_NAME"
echo "3. Test your application endpoints"
echo "4. Update CORS_ORIGINS to include your service URL"
echo

echo -e "${GREEN}✅ Deployment script completed!${NC}" 