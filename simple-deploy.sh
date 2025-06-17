#!/bin/bash

# Simple deployment script for Google Cloud
echo "🚀 Deploying to Google Cloud..."

# Build and deploy using Cloud Build
gcloud builds submit \
  --config=cloudbuild.yaml \
  --project=civic-radio-463020-i9 \
  --region=europe-west1 \
  --substitutions=_SERVICE_NAME=nawinienew,_REGION=europe-west1

echo "✅ Deployment submitted to Google Cloud Build"
echo "Check the build progress at: https://console.cloud.google.com/cloud-build/builds" 