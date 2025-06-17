# Cloud-Only Deployment Guide

This guide covers the **cloud-only** Docker configuration for Na Winie, optimized exclusively for Google Cloud deployment without any local development support.

## 🎯 Overview

The cloud-only version provides:
- ✅ **Simplified Configuration**: No `.env` file handling complexity
- ✅ **Cloud-Optimized**: Built specifically for Google Cloud Run
- ✅ **Production Ready**: Hardened security and performance settings
- ✅ **Environment Validation**: Built-in checks for required variables
- ✅ **Automated Deployment**: Streamlined CI/CD integration

## 📁 Cloud-Only Files

```
├── Dockerfile.cloud           # Cloud-only container definition
├── docker-compose.cloud.yml   # Cloud-only compose (testing only)
├── cloudbuild.cloud.yaml      # Cloud Build configuration
├── cloudrun-service.cloud.yaml # Cloud Run service definition
├── deploy-cloud-only.sh       # Automated deployment script
├── .dockerignore.cloud        # Cloud-optimized ignore file
└── DEPLOYMENT-CLOUD.md        # This guide
```

## 🚀 Quick Deployment

### 1. Set Required Environment Variables

```bash
# Required - Supabase Configuration
export PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
export SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# Required - Security
export JWT_SECRET_KEY="$(openssl rand -hex 32)"

# Required - Database
export DATABASE_URL="postgresql://username:password@host:5432/database"

# Optional - CORS (defaults to https://your-domain.com)
export CORS_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
```

### 2. Deploy to Google Cloud

```bash
chmod +x deploy-cloud-only.sh
./deploy-cloud-only.sh your-project-id us-central1
```

That's it! 🎉

## 🔧 Deployment Methods

### Method 1: Automated Script (Recommended)

```bash
./deploy-cloud-only.sh YOUR_PROJECT_ID REGION
```

**Features:**
- ✅ Environment variable validation
- ✅ Automatic API enablement
- ✅ Cloud Build + Cloud Run deployment
- ✅ Service URL retrieval
- ✅ Post-deployment instructions

### Method 2: Manual Cloud Build

```bash
gcloud builds submit . --config cloudbuild.cloud.yaml \
  --substitutions=\
_PUBLIC_SUPABASE_URL="$PUBLIC_SUPABASE_URL",\
_PUBLIC_SUPABASE_ANON_KEY="$PUBLIC_SUPABASE_ANON_KEY",\
_JWT_SECRET_KEY="$JWT_SECRET_KEY",\
_DATABASE_URL="$DATABASE_URL",\
_SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY"
```

### Method 3: Cloud Run Service YAML

```bash
# Update cloudrun-service.cloud.yaml with your values
gcloud run services replace cloudrun-service.cloud.yaml --region us-central1
```

## 📋 Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PUBLIC_SUPABASE_URL` | Supabase project URL | `https://abc123.supabase.co` |
| `PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGciOiJIUzI1NiIs...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGciOiJIUzI1NiIs...` |
| `JWT_SECRET_KEY` | JWT signing secret | `32-character-hex-string` |
| `DATABASE_URL` | Database connection string | `postgresql://user:pass@host:5432/db` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ORIGINS` | `https://your-domain.com` | Allowed CORS origins |
| `PORT` | `8080` | Cloud Run port (auto-set) |
| `ENVIRONMENT` | `production` | Application environment |

## 🏗️ Architecture

### Build Process
1. **Frontend Build**: Astro compiled with build arguments
2. **Backend Build**: Python dependencies installed
3. **Production Image**: Combined runtime with validation

### Runtime Flow
```mermaid
graph TD
    A[Cloud Run Start] --> B[Validate Environment]
    B --> C[Start FastAPI Backend :8000]
    C --> D[Start Astro Frontend :8080]
    D --> E[Health Checks]
    E --> F[Service Ready]
```

### Container Specifications
- **CPU**: 2 vCPU (configurable)
- **Memory**: 4 GiB (configurable)
- **Concurrency**: 100 requests per instance
- **Timeout**: 300 seconds
- **Port**: 8080 (Cloud Run standard)

## 🔒 Security Features

### Built-in Security
- ✅ **Non-root container**: Runs as `appuser`
- ✅ **Environment validation**: Required variables checked at startup
- ✅ **No .env files**: Eliminates local file exposure risk
- ✅ **Minimal attack surface**: Cloud-optimized base images
- ✅ **Health checks**: Automated service monitoring

### Recommended Enhancements
```bash
# Use Secret Manager for sensitive values
gcloud secrets create jwt-secret --data-file=-

# Enable private Google Cloud services
gcloud run services update nawinie --ingress=internal

# Set up custom domains with SSL
gcloud run domain-mappings create --service=nawinie --domain=api.yourdomain.com
```

## 📊 Monitoring & Observability

### Built-in Features
- **Startup Probe**: Validates service initialization
- **Liveness Probe**: Continuous health monitoring  
- **Readiness Probe**: Traffic routing control
- **Structured Logging**: Cloud Logging integration

### Monitoring Commands
```bash
# View logs
gcloud run services logs read nawinie --region us-central1

# Monitor metrics
gcloud run services describe nawinie --region us-central1

# Check service status
gcloud run services list --filter="metadata.name=nawinie"
```

## 🚀 Scaling & Performance

### Auto-scaling Configuration
```yaml
autoscaling.knative.dev/maxScale: "10"    # Max instances
autoscaling.knative.dev/minScale: "0"     # Scale to zero
```

### Performance Optimizations
- **CPU Boost**: Enabled during startup
- **Generation 2**: Latest Cloud Run execution environment
- **Multi-stage Build**: Optimized image layers
- **Health Checks**: Fast failure detection

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy to Cloud Run
on:
  push:
    branches: [main]
    
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: google-github-actions/setup-gcloud@v1
      with:
        service_account_key: ${{ secrets.GCP_SA_KEY }}
        project_id: ${{ secrets.GCP_PROJECT_ID }}
    - run: |
        gcloud builds submit . --config cloudbuild.cloud.yaml \
          --substitutions=_PUBLIC_SUPABASE_URL="${{ secrets.PUBLIC_SUPABASE_URL }}"
```

### Cloud Build Triggers
```bash
# Create trigger for automatic deployment
gcloud builds triggers create github \
  --repo-name=your-repo \
  --repo-owner=your-username \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.cloud.yaml
```

## 🛠️ Troubleshooting

### Common Issues

**Environment Variables Not Set**
```bash
# Check current environment
gcloud run services describe nawinie --region us-central1 --format="export"

# Update environment variables
gcloud run services update nawinie --region us-central1 \
  --set-env-vars KEY=VALUE
```

**Build Failures**
```bash
# Check build logs
gcloud builds log [BUILD_ID]

# Test build locally (requires Docker)
docker build -f Dockerfile.cloud \
  --build-arg PUBLIC_SUPABASE_URL=test \
  --build-arg PUBLIC_SUPABASE_ANON_KEY=test .
```

**Service Not Responding**
```bash
# Check service health
curl -f https://your-service-url/

# View detailed logs
gcloud run services logs read nawinie --region us-central1 --limit=50
```

## 🎯 Production Checklist

- [ ] **Environment Variables**: All required vars set
- [ ] **Domain Setup**: Custom domain configured
- [ ] **SSL Certificate**: HTTPS enabled
- [ ] **Secret Manager**: Sensitive data in Secret Manager
- [ ] **IAM Permissions**: Proper service account setup
- [ ] **Monitoring**: Alerts configured
- [ ] **Backup Strategy**: Database backup in place
- [ ] **CORS Configuration**: Frontend domains whitelisted

## 🔗 Related Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud Build Documentation](https://cloud.google.com/build/docs)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
- [Supabase Documentation](https://supabase.com/docs)

---

**💡 Tip**: Use the automated deployment script for the fastest path to production! 