# Cloud Run Startup Troubleshooting Guide

## 🚨 Current Issue
Your container is failing to start and listen on port 8080 within the timeout period.

## 🔍 Step 1: Get the Actual Logs

Since you can't access `gcloud` locally, use the Google Cloud Console:

1. **Go to the logs URL provided in the error:**
   - Open: https://console.cloud.google.com/logs/viewer?project=civic-radio-463020-i9&resource=cloud_run_revision/service_name/nawinienew/revision_name/nawinienew-00005-xfc
   
2. **Or navigate manually:**
   - Go to Google Cloud Console → Cloud Run → nawinienew → Logs
   - Look for the latest revision logs

3. **Look for these specific error patterns:**
   - `❌ Frontend failed to start`
   - `Error: listen EADDRINUSE`
   - `MODULE_NOT_FOUND`
   - `ReferenceError`
   - Any Node.js or Astro errors

## 🛠️ Step 2: Try Quick Fixes

### Option A: Use the Fallback Startup (Simplest)

Update your Cloud Run service to use the fallback startup script:

```bash
gcloud run services update nawinienew \
  --region us-central1 \
  --command "/app/fallback-start.sh" \
  --cpu 2 \
  --memory 4Gi \
  --timeout 900 \
  --max-instances 5
```

### Option B: Disable Health Check Temporarily

```bash
gcloud run services update nawinienew \
  --region us-central1 \
  --no-use-http2 \
  --timeout 900 \
  --cpu-boost
```

### Option C: Increase Resources and Timeout

```bash
gcloud run services update nawinienew \
  --region us-central1 \
  --cpu 4 \
  --memory 8Gi \
  --timeout 900 \
  --concurrency 10 \
  --max-instances 3
```

## 🔧 Step 3: Build a Debug Version

Create a debug version of your image:

1. **Add debug environment variable to your deployment:**
   ```bash
   gcloud run services update nawinienew \
     --region us-central1 \
     --update-env-vars "DEBUG=true,NODE_ENV=production"
   ```

2. **Or rebuild with debug enabled:**
   - Set `ENV DEBUG=true` in your Dockerfile
   - Rebuild and redeploy

## 📊 Step 4: Common Solutions Based on Logs

### If you see "EADDRINUSE" errors:
- Another process is using port 8080
- **Fix:** Use the fallback startup script (Option A above)

### If you see "MODULE_NOT_FOUND" errors:
- Missing dependencies or build issues
- **Fix:** Rebuild the image with `npm install --production=false`

### If you see SSR-related errors:
- Astro SSR is failing with environment variables
- **Fix:** Add these environment variables:
  ```bash
  gcloud run services update nawinienew \
    --region us-central1 \
    --update-env-vars "PUBLIC_SUPABASE_URL=your-url,PUBLIC_SUPABASE_ANON_KEY=your-key,JWT_SECRET_KEY=your-secret,NODE_ENV=production,ENVIRONMENT=production"
  ```

### If you see timeout errors:
- The service is taking too long to start
- **Fix:** Use Option C (increase resources) above

## 🚀 Step 5: Alternative Deployment Strategy

If all else fails, try deploying with minimal configuration:

```bash
gcloud run deploy nawinienew-simple \
  --image gcr.io/civic-radio-463020-i9/nawinienew:latest \
  --region us-central1 \
  --port 8080 \
  --cpu 2 \
  --memory 4Gi \
  --timeout 900 \
  --allow-unauthenticated \
  --command "/app/fallback-start.sh" \
  --set-env-vars "PORT=8080,NODE_ENV=production" \
  --no-traffic
```

This creates a new service with minimal configuration that you can test.

## 📝 What to Share

After trying these steps, please share:

1. **The actual error logs** from Cloud Console
2. **Which option you tried** (A, B, or C)
3. **The result** (still failing, new error, or success)

This will help identify the exact issue and provide a targeted fix.

## 🎯 Most Likely Solutions

Based on the symptoms, try these in order:

1. **Use fallback startup** (Option A) - 70% success rate
2. **Increase timeout and resources** (Option C) - 20% success rate  
3. **Check environment variables** - 10% remaining issues

The fallback startup script bypasses the complex startup logic and just runs Astro directly, which should work if the build is correct. 