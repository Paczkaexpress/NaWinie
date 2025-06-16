# Deployment Guide

This guide covers how to deploy Na Winie in different environments, from local development to Google Cloud production.

## 🏠 Local Development

### Prerequisites
- Docker and Docker Compose installed
- `.env` file with your configuration

### Setup
1. **Create `.env` file**:
```bash
cp .env.example .env
# Edit .env with your actual values
```

2. **Build and run locally**:
```bash
docker-compose up --build -d
```

3. **Access the application**:
- Frontend: http://localhost:4321
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## ☁️ Google Cloud Deployment

### Prerequisites
- Google Cloud SDK installed and authenticated
- Google Cloud project created
- Required environment variables set

### Deployment Options

#### Option 1: Automated Deployment (Recommended)

1. **Set environment variables**:
```bash
export PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
export JWT_SECRET_KEY="$(openssl rand -hex 32)"
export DATABASE_URL="postgresql://postgres:password@host:5432/database"
```

2. **Run deployment script**:
```bash
chmod +x deploy-cloud.sh
./deploy-cloud.sh your-project-id us-central1
```

#### Option 2: Manual Cloud Build

1. **Submit build**:
```bash
gcloud builds submit . --config cloudbuild.yaml \
  --substitutions=\
_PUBLIC_SUPABASE_URL="$PUBLIC_SUPABASE_URL",\
_PUBLIC_SUPABASE_ANON_KEY="$PUBLIC_SUPABASE_ANON_KEY",\
_PUBLIC_USE_LOCAL_BACKEND="false"
```

2. **Deploy to Cloud Run**:
```bash
gcloud run deploy nawinie \
  --image gcr.io/YOUR_PROJECT_ID/nawinie:latest \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 4Gi \
  --cpu 2 \
  --set-env-vars "JWT_SECRET_KEY=$JWT_SECRET_KEY,PUBLIC_SUPABASE_URL=$PUBLIC_SUPABASE_URL"
```

#### Option 3: Cloud Run Service YAML

1. **Update `cloudrun-service.yaml`** with your values
2. **Deploy**:
```bash
gcloud run services replace cloudrun-service.yaml --region us-central1
```

## 🔧 Configuration

### Environment Variables

| Variable | Local (.env) | Cloud (Required) | Description |
|----------|--------------|------------------|-------------|
| `PUBLIC_SUPABASE_URL` | ✅ | ✅ | Supabase project URL |
| `PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | Supabase anonymous key |
| `JWT_SECRET_KEY` | ✅ | ✅ | Secret for JWT tokens |
| `DATABASE_URL` | ✅ | ✅ | Database connection string |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ | Supabase service role key |
| `ENVIRONMENT` | ✅ | ✅ | Application environment |
| `CORS_ORIGINS` | ✅ | ✅ | Allowed CORS origins |
| `PUBLIC_USE_LOCAL_BACKEND` | ✅ | ❌ | Use local backend (false for cloud) |

### Dockerfile Architecture

The improved Dockerfile supports both scenarios:

**Local Development**:
- Uses `.env` file during build and runtime
- Automatic environment variable loading
- Full development experience

**Cloud Deployment**:
- Uses build arguments for frontend compilation
- Runtime environment variables from cloud platform
- No dependency on `.env` file
- Production-optimized configuration

### Build Process

1. **Frontend Build Stage**: 
   - Copies `.env` if available (local)
   - Uses build arguments if `.env` not present (cloud)
   - Compiles Astro with proper environment variables

2. **Backend Build Stage**:
   - Installs Python dependencies
   - Platform-independent

3. **Production Runtime**:
   - Combines frontend and backend
   - Smart startup script that detects environment
   - Loads configuration from `.env` or environment variables

## 🚀 Deployment Strategies

### Development → Staging → Production

1. **Development**: Local Docker with `.env`
2. **Staging**: Cloud Run with test environment variables
3. **Production**: Cloud Run with production environment variables

### Environment-Specific Configurations

```bash
# Development
export ENVIRONMENT=development
export DATABASE_URL=sqlite:///./backend/nawinie.db

# Staging
export ENVIRONMENT=staging
export DATABASE_URL=postgresql://staging-db-url

# Production
export ENVIRONMENT=production
export DATABASE_URL=postgresql://production-db-url
```

## 🔒 Security Best Practices

### For Google Cloud:

1. **Use Secret Manager**:
```bash
# Store secrets in Secret Manager
gcloud secrets create jwt-secret-key --data-file=jwt-secret.txt

# Use in Cloud Run
gcloud run deploy nawinie \
  --set-secrets="JWT_SECRET_KEY=jwt-secret-key:latest"
```

2. **Use IAM for authentication**:
```bash
# Remove public access
gcloud run services remove-iam-policy-binding nawinie \
  --member="allUsers" \
  --role="roles/run.invoker"
```

3. **Use Cloud SQL for database**:
```bash
gcloud sql instances create nawinie-db \
  --database-version=POSTGRES_13 \
  --region=us-central1
```

## 📊 Monitoring and Logging

### Cloud Run Monitoring:
- **Metrics**: CPU, Memory, Request count, Latency
- **Logs**: Structured logging via Cloud Logging
- **Alerts**: Set up alerts for errors and high latency

### Health Checks:
- **Startup Probe**: Checks backend health on startup
- **Liveness Probe**: Continuous health monitoring
- **Custom Health Endpoint**: `/health` endpoint for detailed checks

## 🛠️ Troubleshooting

### Common Issues:

1. **Environment variables not loaded**:
   - Check build logs for environment variable loading
   - Verify Cloud Run environment variables
   - Test with: `gcloud run services describe nawinie`

2. **Frontend 500 errors**:
   - Check if `PUBLIC_SUPABASE_*` variables are set during build
   - Verify Astro build logs
   - Test locally first

3. **Database connection issues**:
   - Verify `DATABASE_URL` format
   - Check network connectivity from Cloud Run
   - Use Cloud SQL Proxy if needed

### Debugging Commands:

```bash
# Check Cloud Run logs
gcloud run services logs read nawinie --region us-central1

# Debug container locally
docker run -it --env-file .env gcr.io/PROJECT_ID/nawinie:latest /bin/bash

# Test health endpoints
curl https://your-service-url/health
```

## 🔄 CI/CD Pipeline

### GitHub Actions Integration:

```yaml
name: Deploy to Cloud Run
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - uses: google-github-actions/setup-gcloud@v0
      with:
        service_account_key: ${{ secrets.GCP_SA_KEY }}
        project_id: ${{ secrets.GCP_PROJECT_ID }}
    - run: gcloud builds submit . --config cloudbuild.yaml
```

This deployment setup gives you maximum flexibility while maintaining security and performance across all environments. 