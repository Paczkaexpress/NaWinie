#!/bin/bash

# Quick fix for syntax error and redeploy
set -e

PROJECT_ID="civic-radio-463020-i9"
SERVICE_NAME="nawinienew"
REGION="europe-west1"

echo "🔧 Quick fix deployment for syntax error"
echo "Project: $PROJECT_ID"
echo "Service: $SERVICE_NAME"
echo "Region: $REGION"
echo

echo "📦 Building Docker image..."
docker build -t $SERVICE_NAME .
docker tag $SERVICE_NAME gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

echo "📤 Pushing to Google Container Registry..."
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

echo "🚀 Deploying to Cloud Run..."
gcloud run services update $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
  --region $REGION \
  --port 8080 \
  --cpu 2 \
  --memory 4Gi \
  --timeout 900 \
  --allow-unauthenticated

echo
echo "✅ Deployment completed!"
echo

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')
echo "🌐 Service URL: $SERVICE_URL"

echo
echo "📊 To check logs:"
echo "gcloud logs tail --service=$SERVICE_NAME --limit=50"

echo
echo "🧪 Test endpoints:"
echo "curl $SERVICE_URL/"
echo "curl $SERVICE_URL/health" 