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
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Deploying Na Winie to Google Cloud${NC}"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
echo

# Check if required environment variables are set
required_vars=(
    "PUBLIC_SUPABASE_URL"
    "PUBLIC_SUPABASE_ANON_KEY"
    "JWT_SECRET_KEY"
    "DATABASE_URL"
)

echo -e "${YELLOW}📋 Checking required environment variables...${NC}"
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Error: $var is not set${NC}"
        echo "Please set all required environment variables before deploying."
        echo "Example:"
        echo "export PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
        echo "export PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
        echo "export JWT_SECRET_KEY=your-jwt-secret"
        echo "export DATABASE_URL=postgresql://..."
        exit 1
    else
        echo -e "${GREEN}✅ $var is set${NC}"
    fi
done

# Set Google Cloud project
echo -e "${YELLOW}🔧 Setting up Google Cloud project...${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}🔌 Enabling required Google Cloud APIs...${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and push the Docker image using Cloud Build
echo -e "${YELLOW}🏗️ Building Docker image with Cloud Build...${NC}"
gcloud builds submit . \
    --config cloudbuild.yaml \
    --substitutions=\
_PUBLIC_SUPABASE_URL="$PUBLIC_SUPABASE_URL",\
_PUBLIC_SUPABASE_ANON_KEY="$PUBLIC_SUPABASE_ANON_KEY",\
_PUBLIC_USE_LOCAL_BACKEND="false",\
_JWT_SECRET_KEY="$JWT_SECRET_KEY",\
_DATABASE_URL="$DATABASE_URL",\
_REGION="$REGION"

# Deploy to Cloud Run
echo -e "${YELLOW}🚢 Deploying to Cloud Run...${NC}"
gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/nawinie:latest \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --memory 4Gi \
    --cpu 2 \
    --concurrency 100 \
    --timeout 300 \
    --set-env-vars "\
JWT_SECRET_KEY=$JWT_SECRET_KEY,\
JWT_ALGORITHM=HS256,\
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30,\
PUBLIC_SUPABASE_URL=$PUBLIC_SUPABASE_URL,\
PUBLIC_SUPABASE_ANON_KEY=$PUBLIC_SUPABASE_ANON_KEY,\
SUPABASE_URL=$PUBLIC_SUPABASE_URL,\
SUPABASE_ANON_KEY=$PUBLIC_SUPABASE_ANON_KEY,\
DATABASE_URL=$DATABASE_URL,\
ENVIRONMENT=production,\
PUBLIC_USE_LOCAL_BACKEND=false,\
CORS_ORIGINS=https://your-domain.com"

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --format 'value(status.url)')

echo
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo -e "${GREEN}🌐 Service URL: $SERVICE_URL${NC}"
echo
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Update your CORS_ORIGINS to include: $SERVICE_URL"
echo "2. Update your Supabase redirect URLs to include: $SERVICE_URL"
echo "3. Test your application: curl $SERVICE_URL"
echo
echo -e "${YELLOW}🔧 To update environment variables later:${NC}"
echo "gcloud run services update $SERVICE_NAME --region $REGION --set-env-vars KEY=VALUE" 