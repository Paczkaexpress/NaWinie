#!/bin/bash

echo "🚀 Quick deployment for environment variable fix..."

# Deploy the updated Docker configuration
gcloud builds submit \
  --config=cloudbuild.yaml \
  --project=civic-radio-463020-i9 \
  --region=europe-west1 \
  --substitutions=_SERVICE_NAME=nawinienew,_REGION=europe-west1

echo ""
echo "🔧 IMPORTANT: After the build completes, you MUST:"
echo "1. Go to: https://console.cloud.google.com/run?project=civic-radio-463020-i9"
echo "2. Click service: nawinienew"
echo "3. Click 'Edit & Deploy New Revision'"
echo "4. Variables & Secrets tab"
echo "5. Verify these environment variables are set:"
echo ""
echo "   PUBLIC_SUPABASE_URL = https://upqxcctfqgdbllfkkyie.supabase.co"
echo "   PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwcXhjY3RmcWdkYmxsZmtreWllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MDcyNjIsImV4cCI6MjA0ODM4MzI2Mn0.5mHKu6kTlF6wT4VmJqIB1WTBpT8A89O--k3SWLGjGjQ"
echo "   JWT_SECRET_KEY = your-super-secret-jwt-key-here-change-this"
echo "   PUBLIC_USE_LOCAL_BACKEND = false"
echo ""
echo "6. Click 'Deploy'"
echo ""
echo "🧪 After deployment, test:"
echo "   - Visit: https://nawinienew-508925890147.europe-west1.run.app/runtime-config.js"
echo "   - Should show real Supabase URL, not 'placeholder-will-be-replaced-at-runtime'"
echo ""
echo "✅ The fix changes the runtime-config.js endpoint to use process.env instead of import.meta.env" 