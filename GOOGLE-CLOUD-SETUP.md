# Google Cloud Setup Guide

This guide explains how to set up your Na Winie application in Google Cloud without complex deployment scripts. You will manage all environment variables directly in the Google Cloud Console.

## 🚀 Deployment Steps

### 1. Build and Deploy the Container

```bash
# Set only the frontend build variables
export PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Build and deploy using Cloud Build
gcloud builds submit . --config cloudbuild.cloud.yaml \
    --substitutions=\
_PUBLIC_SUPABASE_URL="$PUBLIC_SUPABASE_URL",\
_PUBLIC_SUPABASE_ANON_KEY="$PUBLIC_SUPABASE_ANON_KEY"
```

### 2. Set Environment Variables in Google Cloud Console

#### Go to Cloud Run Console
1. Open Google Cloud Console
2. Navigate to **Cloud Run**
3. Click on your `nawinie` service
4. Click **EDIT & DEPLOY NEW REVISION**
5. Go to **Variables and Secrets** tab

#### Set Environment Variables

**Basic Configuration:**
```
PORT=8080
ENVIRONMENT=production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
PUBLIC_USE_LOCAL_BACKEND=false
```

**Your Supabase Configuration:**
```
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_URL=https://your-project.supabase.co
```

**Your Database Configuration:**
```
DATABASE_URL=postgresql://username:password@host:5432/database
```

**Your CORS Configuration:**
```
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

#### Set Secret Variables (Recommended)

Instead of setting sensitive values as environment variables, use **Secret Manager**:

1. **Create Secrets in Secret Manager:**
```bash
# Create JWT secret
echo -n "$(openssl rand -hex 32)" | gcloud secrets create jwt-secret-key --data-file=-

# Create Supabase keys
echo -n "your_supabase_anon_key_here" | gcloud secrets create supabase-anon-key --data-file=-
echo -n "your_supabase_service_role_key_here" | gcloud secrets create supabase-service-role-key --data-file=-
```

2. **Reference Secrets in Cloud Run:**
   - In the **Variables and Secrets** tab
   - Click **REFERENCE A SECRET**
   - Add these mappings:

```
JWT_SECRET_KEY → jwt-secret-key:latest
PUBLIC_SUPABASE_ANON_KEY → supabase-anon-key:latest  
SUPABASE_ANON_KEY → supabase-anon-key:latest
SUPABASE_SERVICE_ROLE_KEY → supabase-service-role-key:latest
```

### 3. Deploy the New Revision

Click **DEPLOY** to apply your configuration.

## 🔧 Manual Cloud Build (Alternative)

If you prefer manual deployment:

```bash
# Build only
gcloud builds submit . --config cloudbuild.cloud.yaml \
    --substitutions=\
_PUBLIC_SUPABASE_URL="https://your-project.supabase.co",\
_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Then deploy manually in Cloud Run Console
```

## 📋 Complete Environment Variables Checklist

### Required Environment Variables
- [ ] `PORT=8080`
- [ ] `ENVIRONMENT=production`
- [ ] `PUBLIC_SUPABASE_URL=https://your-project.supabase.co`
- [ ] `SUPABASE_URL=https://your-project.supabase.co`
- [ ] `DATABASE_URL=postgresql://...`
- [ ] `CORS_ORIGINS=https://yourdomain.com`

### Required Secret Variables (via Secret Manager)
- [ ] `JWT_SECRET_KEY` → secret: `jwt-secret-key`
- [ ] `PUBLIC_SUPABASE_ANON_KEY` → secret: `supabase-anon-key`
- [ ] `SUPABASE_ANON_KEY` → secret: `supabase-anon-key`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` → secret: `supabase-service-role-key`

### Optional Environment Variables
- [ ] `JWT_ALGORITHM=HS256`
- [ ] `JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30`
- [ ] `PUBLIC_USE_LOCAL_BACKEND=false`

## 🎯 Key Benefits of This Approach

✅ **No deployment scripts** - Simple Cloud Build  
✅ **Google Cloud manages secrets** - Secure secret handling  
✅ **Environment variables in UI** - Easy to update via console  
✅ **Direct container execution** - No custom startup scripts  
✅ **Supervisor manages processes** - Reliable service management  

## 🔍 Troubleshooting

### Check Service Logs
```bash
gcloud run services logs read nawinie --region us-central1
```

### Verify Environment Variables
```bash
gcloud run services describe nawinie --region us-central1
```

### Update Environment Variables
1. Go to Cloud Run Console
2. Select your service
3. Click **EDIT & DEPLOY NEW REVISION**
4. Update variables in **Variables and Secrets** tab
5. Click **DEPLOY**

### Check Secret Manager Access
```bash
gcloud secrets versions access latest --secret="jwt-secret-key"
```

## 🛡️ Security Best Practices

1. **Use Secret Manager** for all sensitive values
2. **Limit Secret Access** to your Cloud Run service account
3. **Enable Audit Logs** for secret access
4. **Rotate secrets regularly**

## 📖 Next Steps

1. Deploy your container with Cloud Build
2. Set environment variables in Cloud Run Console  
3. Configure secrets in Secret Manager
4. Test your deployed application
5. Set up custom domain and SSL certificate

This approach gives you full control over environment variables through the Google Cloud Console interface! 