#!/bin/bash

# Enhanced deployment script for Google Cloud with debugging

PROJECT_ID="civic-radio-463020-i9"
SERVICE_NAME="nawinienew"
REGION="europe-west1"

echo "🚀 Starting enhanced deployment to Google Cloud..."

# First, check if environment variables are set in Cloud Run
echo "📋 Checking current environment variables in Cloud Run..."
gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID --format="value(spec.template.spec.template.spec.containers[0].env[].name,spec.template.spec.template.spec.containers[0].env[].value)" 2>/dev/null || echo "Service not found or no env vars set"

echo ""
echo "🏗️ Building and deploying with Cloud Build..."

# Submit the build
gcloud builds submit \
  --config=cloudbuild.yaml \
  --project=$PROJECT_ID \
  --region=$REGION \
  --substitutions=_SERVICE_NAME=$SERVICE_NAME,_REGION=$REGION

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build completed successfully!"
    
    echo ""
    echo "🔧 Setting environment variables..."
    
    # Set environment variables (replace with your actual values)
    gcloud run services update $SERVICE_NAME \
      --region=$REGION \
      --project=$PROJECT_ID \
      --set-env-vars="PUBLIC_SUPABASE_URL=https://upqxcctfqgdbllfkkyie.supabase.co,PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwcXhjY3RmcWdkYmxsZmtreWllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MDcyNjIsImV4cCI6MjA0ODM4MzI2Mn0.5mHKu6kTlF6wT4VmJqIB1WTBpT8A89O--k3SWLGjGjQ,JWT_SECRET_KEY=your-secret-jwt-key-here,PUBLIC_USE_LOCAL_BACKEND=false"
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ Environment variables set successfully!"
        
        echo ""
        echo "🧪 Running post-deployment tests..."
        
        # Get the service URL
        SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID --format="value(status.url)")
        
        echo "Service URL: $SERVICE_URL"
        
        # Test basic health check
        echo "Testing basic connectivity..."
        curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" "$SERVICE_URL/" || echo "❌ Health check failed"
        
        # Test runtime config injection
        echo ""
        echo "Testing runtime config availability..."
        curl -s "$SERVICE_URL/runtime-config.js" | head -5 || echo "❌ Runtime config not accessible"
        
        # Test a recipe detail page
        echo ""
        echo "Testing recipe page routing..."
        curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" "$SERVICE_URL/recipes/123e4567-e89b-12d3-a456-426614174000" || echo "❌ Recipe routing test failed"
        
        echo ""
        echo "🎉 Deployment complete!"
        echo ""
        echo "📋 Service Information:"
        echo "  URL: $SERVICE_URL"
        echo "  Project: $PROJECT_ID"
        echo "  Service: $SERVICE_NAME"
        echo "  Region: $REGION"
        echo ""
        echo "🔍 Debug information:"
        echo "  - Check browser console for runtime config logs"
        echo "  - Check Network tab for failed API requests"
        echo "  - Environment variables are injected at runtime"
        echo ""
        echo "💡 If you see 'using mock data' in console:"
        echo "  1. Check browser dev tools for runtime config"
        echo "  2. Verify environment variables in Cloud Run console"
        echo "  3. Check that runtime-config.js is accessible"
        
    else
        echo "❌ Failed to set environment variables"
        exit 1
    fi
else
    echo "❌ Build failed"
    exit 1
fi 