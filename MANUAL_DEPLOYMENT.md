# Manual Deployment Guide (No CLI Required)

## Option 1: Google Cloud Console Upload

### Step 1: Create a ZIP file
1. **Zip your entire project folder** (excluding `node_modules`, `dist`, `.git`, `venv`)
2. **Include these files in the ZIP:**
   - `Dockerfile`
   - `cloudbuild.yaml`
   - `start.sh`
   - All `src/` files
   - `package.json`
   - `astro.config.mjs`
   - `tailwind.config.mjs`
   - `tsconfig.json`
   - All other config files

### Step 2: Upload to Cloud Build
1. **Go to**: https://console.cloud.google.com/cloud-build/builds?project=civic-radio-463020-i9
2. **Click "Submit a Build"**
3. **Choose "Cloud Build configuration file (yaml or json)"**
4. **Upload your ZIP file**
5. **Cloud Build configuration file**: `cloudbuild.yaml`
6. **Substitution variables:**
   - Add variable: `_SERVICE_NAME` = `nawinienew`
   - Add variable: `_REGION` = `europe-west1`
7. **Click "Submit"**

---

## Option 2: Cloud Shell (Browser-based Terminal)

### Step 1: Open Cloud Shell
1. **Go to**: https://console.cloud.google.com/
2. **Click the Cloud Shell icon** (>_) in the top toolbar
3. **Wait for the shell to initialize**

### Step 2: Upload Your Code
1. **In Cloud Shell, click the "Upload files" button**
2. **Upload your entire project as a ZIP file**
3. **Extract it:**
   ```bash
   unzip your-project.zip
   cd your-project-folder
   ```

### Step 3: Deploy
```bash
gcloud builds submit \
  --config=cloudbuild.yaml \
  --project=civic-radio-463020-i9 \
  --region=europe-west1 \
  --substitutions=_SERVICE_NAME=nawinienew,_REGION=europe-west1
```

---

## Option 3: GitHub Integration (Recommended)

### Step 1: Push to GitHub
1. **Commit all your changes to your GitHub repository**
2. **Make sure these files are included:**
   - Updated `Dockerfile`
   - Updated `start.sh`
   - New `src/pages/404.astro`
   - New `src/pages/runtime-config.js.ts`
   - Updated `src/layouts/Layout.astro`

### Step 2: Connect to Cloud Build
1. **Go to**: https://console.cloud.google.com/cloud-build/triggers?project=civic-radio-463020-i9
2. **Click "Create Trigger"**
3. **Connect to your GitHub repository**
4. **Set trigger to run on pushes to your main branch**
5. **Configuration**: Cloud Build configuration file
6. **Location**: `cloudbuild.yaml`
7. **Substitution variables:**
   - `_SERVICE_NAME`: `nawinienew`
   - `_REGION`: `europe-west1`

### Step 3: Trigger Build
1. **Push a new commit to trigger the build**
2. **Or manually trigger from Cloud Build console**

---

## After Any Deployment Method

### Set Environment Variables (CRITICAL!)

1. **Go to**: https://console.cloud.google.com/run?project=civic-radio-463020-i9
2. **Click on service**: `nawinienew`
3. **Click "Edit & Deploy New Revision"**
4. **Variables & Secrets tab**
5. **Add these variables:**

```
PUBLIC_SUPABASE_URL = https://upqxcctfqgdbllfkkyie.supabase.co
PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwcXhjY3RmcWdkYmxsZmtreWllIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI4MDcyNjIsImV4cCI6MjA0ODM4MzI2Mn0.5mHKu6kTlF6wT4VmJqIB1WTBpT8A89O--k3SWLGjGjQ
JWT_SECRET_KEY = your-super-secret-jwt-key-here-change-this
PUBLIC_USE_LOCAL_BACKEND = false
```

6. **Click "Deploy"**

### Test the Deployment
1. **Visit your app**: https://nawinienew-508925890147.europe-west1.run.app/
2. **Test runtime config**: https://nawinienew-508925890147.europe-west1.run.app/runtime-config.js
3. **Test recipe page**: https://nawinienew-508925890147.europe-west1.run.app/recipes/123e4567-e89b-12d3-a456-426614174000
4. **Check browser console** for "Runtime config loaded" message

---

## Quick Checklist

✅ **Files to include in deployment:**
- [ ] Updated `Dockerfile`
- [ ] Updated `start.sh` 
- [ ] New `src/pages/404.astro`
- [ ] New `src/pages/runtime-config.js.ts`
- [ ] Updated `src/layouts/Layout.astro`
- [ ] `cloudbuild.yaml`

✅ **After deployment:**
- [ ] Set environment variables in Cloud Run
- [ ] Deploy new revision with variables
- [ ] Test app URL
- [ ] Test runtime-config.js URL
- [ ] Check browser console logs

✅ **Expected results:**
- [ ] No more 404 errors on recipe pages
- [ ] "Runtime config loaded" message in console
- [ ] "Supabase Configuration: {urlSet: true}" in console
- [ ] Real data from Supabase (no "using mock data" messages) 