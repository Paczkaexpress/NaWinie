# Docker Image Deployment Guide for Google Cloud

This guide explains how to deploy your Na Winie application to Google Cloud using just a Docker image.

## 🐳 How It Works

Your updated Docker container now:
1. **Builds the frontend with placeholder values** (no secrets needed at build time)
2. **Injects real environment variables at runtime** when the container starts
3. **Automatically configures both frontend and backend** using environment variables from Google Cloud

## 🚀 Deployment Steps

### Step 1: Build Your Docker Image

```bash
# Build the Docker image locally
docker build -t nawinie .

# Tag it for Google Container Registry (replace YOUR_PROJECT_ID)
docker tag nawinie gcr.io/YOUR_PROJECT_ID/nawinie:latest
```

### Step 2: Push to Google Container Registry

```bash
# Configure Docker to use gcloud
gcloud auth configure-docker

# Push the image
docker push gcr.io/YOUR_PROJECT_ID/nawinie:latest
```

### Step 3: Deploy to Cloud Run with Environment Variables

#### Option A: Using gcloud CLI

```bash
gcloud run deploy nawinie \
  --image gcr.io/YOUR_PROJECT_ID/nawinie:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 4Gi \
  --cpu 2 \
  --port 8080 \
  --set-env-vars "PORT=8080,ENVIRONMENT=production,PUBLIC_USE_LOCAL_BACKEND=false" \
  --update-env-vars "JWT_SECRET_KEY=your-jwt-secret,PUBLIC_SUPABASE_URL=https://your-project.supabase.co,PUBLIC_SUPABASE_ANON_KEY=your-anon-key,DATABASE_URL=your-database-url,CORS_ORIGINS=https://your-domain.com"
```

#### Option B: Using Google Cloud Console (Recommended for beginners)

1. **Go to Google Cloud Console** → Cloud Run
2. **Click "Create Service"**
3. **Container Image URL**: `gcr.io/YOUR_PROJECT_ID/nawinie:latest`
4. **Service name**: `nawinie`
5. **Region**: Choose your preferred region
6. **CPU allocation**: 2 CPUs
7. **Memory**: 4 GiB
8. **Port**: 8080
9. **Authentication**: Allow unauthenticated invocations

10. **In the "Variables & Secrets" tab, add these environment variables:**

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `PORT` | `8080` | Cloud Run port |
| `ENVIRONMENT` | `production` | App environment |
| `PUBLIC_USE_LOCAL_BACKEND` | `false` | Use Supabase instead of local backend |
| `JWT_SECRET_KEY` | `your-jwt-secret-key` | Secret for JWT tokens |
| `PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Your Supabase URL |
| `PUBLIC_SUPABASE_ANON_KEY` | `your-supabase-anon-key` | Your Supabase anonymous key |
| `DATABASE_URL` | `your-database-connection-string` | Database connection |
| `CORS_ORIGINS` | `https://your-domain.com` | Allowed CORS origins |

11. **Click "Create"**

### Step 4: Verify Deployment

After deployment, check the logs:

```bash
# View deployment logs
gcloud logs tail --service=nawinie

# Get service URL
gcloud run services describe nawinie --region=us-central1 --format='value(status.url)'
```

Look for these startup messages in the logs:
- ✅ All required environment variables are set
- Frontend environment configuration completed
- ✅ Both services started successfully!

## 🔧 Environment Variables Reference

### Required Variables
- `JWT_SECRET_KEY`: Secret key for JWT token generation
- `PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

### Optional Variables
- `DATABASE_URL`: Database connection string (if using external database)
- `CORS_ORIGINS`: Comma-separated list of allowed CORS origins
- `PORT`: Port for the service (default: 8080 for Cloud Run)
- `ENVIRONMENT`: Application environment (default: production)

### Debug Variables
The container logs will show:
- Which environment variables are set/missing
- Whether runtime configuration is loaded properly
- API and Supabase configuration status

## 🐛 Troubleshooting

### Server Error 500 (Your Current Issue)

If you're seeing a 500 error with Astro SSR errors in the logs, here's how to debug:

1. **Check the full logs:**
   ```bash
   # Get detailed logs from your Cloud Run service
   gcloud logs tail --service=nawinie --limit=100
   
   # Or view in Google Cloud Console
   # Go to Cloud Run > nawinie > Logs
   ```

2. **Check if environment variables are properly set:**
   ```bash
   # Test the health endpoint
   curl https://your-service-url/health
   
   # Check environment variables in the service
   gcloud run services describe nawinie --region=us-central1 --format="table(spec.template.spec.containers[0].env[].name,spec.template.spec.containers[0].env[].value)"
   ```

3. **Common fixes for SSR errors:**
   
   **Missing Environment Variables:**
   - Ensure `PUBLIC_SUPABASE_URL` is set
   - Ensure `PUBLIC_SUPABASE_ANON_KEY` is set  
   - Ensure `JWT_SECRET_KEY` is set
   - Ensure `PORT=8080` is set
   
   **Update environment variables:**
   ```bash
   gcloud run services update nawinie --region=us-central1 \
     --update-env-vars "PUBLIC_SUPABASE_URL=https://your-project.supabase.co,PUBLIC_SUPABASE_ANON_KEY=your-anon-key,JWT_SECRET_KEY=your-jwt-secret,PORT=8080"
   ```

4. **Redeploy with latest fixes:**
   ```bash
   # Rebuild and redeploy
   docker build -t nawinie .
   docker tag nawinie gcr.io/YOUR_PROJECT_ID/nawinie:latest
   docker push gcr.io/YOUR_PROJECT_ID/nawinie:latest
   
   # Update the service to use the new image
   gcloud run services update nawinie --region=us-central1 \
     --image gcr.io/YOUR_PROJECT_ID/nawinie:latest
   ```

### Environment Variables Not Loading

1. **Check if variables are set:**
   ```bash
   gcloud run services describe nawinie --region=us-central1 --format="table(spec.template.spec.containers[0].env[].name,spec.template.spec.containers[0].env[].value)"
   ```

2. **Check application logs:**
   ```bash
   gcloud logs tail --service=nawinie --limit=50
   ```

3. **Update environment variables:**
   ```bash
   gcloud run services update nawinie --region=us-central1 \
     --update-env-vars JWT_SECRET_KEY=new-secret,PUBLIC_SUPABASE_URL=new-url
   ```

### Frontend Not Loading Environment Variables

The container now automatically:
- Injects runtime environment variables into frontend JavaScript
- Creates a `runtime-config.js` file with your environment variables
- Logs configuration status to browser console

Check browser console for messages like:
- "API Configuration: ..."
- "Supabase Configuration: ..."

### Service Not Starting

Common issues:
- **Port mismatch**: Ensure `PORT=8080` is set
- **Memory limits**: Use at least 2Gi memory
- **Missing secrets**: Check that required environment variables are set

## 🔒 Security Best Practices

### Use Google Secret Manager (Advanced)

For production, store sensitive values in Secret Manager:

```bash
# Store secret
echo "your-jwt-secret" | gcloud secrets create jwt-secret-key --data-file=-

# Use in Cloud Run
gcloud run services update nawinie \
  --update-secrets="JWT_SECRET_KEY=jwt-secret-key:latest"
```

### Environment-Specific Deployments

- **Development**: Use test/staging Supabase project
- **Production**: Use production Supabase project with proper CORS settings

## 📊 Monitoring

After deployment:
1. **Check service health**: Visit your service URL
2. **Monitor logs**: `gcloud logs tail --service=nawinie`
3. **Check metrics**: Google Cloud Console → Cloud Run → nawinie → Metrics

Your application should now be running with all environment variables properly configured! 🎉 