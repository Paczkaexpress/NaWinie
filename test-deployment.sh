#!/bin/bash

# Simple deployment test script
set -e

PROJECT_ID=${1:-"your-project-id"}
SERVICE_NAME="nawinienew"

echo "🧪 Testing deployment for project: $PROJECT_ID"
echo

# Build and push
echo "📦 Building Docker image..."
docker build -t $SERVICE_NAME .
docker tag $SERVICE_NAME gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

echo "📤 Pushing to Google Container Registry..."
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

echo "🚀 Deploying to Cloud Run..."
gcloud run services update $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
  --region us-central1 \
  --port 8080 \
  --cpu 2 \
  --memory 4Gi \
  --timeout 300 \
  --max-instances 10 \
  --allow-unauthenticated

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=us-central1 --format='value(status.url)')

echo
echo "✅ Deployment completed!"
echo "Service URL: $SERVICE_URL"
echo

echo "🔍 Testing endpoints..."
echo "Health check: $SERVICE_URL/health"
echo "Main page: $SERVICE_URL/"
echo

echo "⏱️  Waiting 30 seconds for service to be ready..."
sleep 30

echo "🧪 Running basic tests..."
echo -n "Health check: "
if curl -f -s "$SERVICE_URL/health" > /dev/null; then
    echo "✅ PASSED"
else
    echo "❌ FAILED"
fi

echo -n "Main page: "
if curl -f -s "$SERVICE_URL/" > /dev/null; then
    echo "✅ PASSED"
else
    echo "❌ FAILED"
fi

echo
echo "📊 Check logs with:"
echo "gcloud logs tail --service=$SERVICE_NAME --limit=50"
echo
echo "🎉 Test complete!" 