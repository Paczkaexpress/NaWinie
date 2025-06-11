# 🚀 Na Winie Development Setup

This guide will help you set up the development environment for the Na Winie project.

## 📋 Prerequisites

- Python 3.8 or higher
- Git (for cloning the repository)

## 🎯 Quick Setup (Automated)

### Option 1: PowerShell (Recommended for Windows)
```powershell
.\setup.ps1
```

### Option 2: Batch Script (Alternative for Windows)
```cmd
setup.bat
```

### Option 3: Manual Setup (Any platform)
Follow the manual steps below if automated scripts don't work.

## 🔧 Manual Setup

### 1. Create Virtual Environment
```bash
python -m venv venv
```

### 2. Activate Virtual Environment

**Windows:**
```cmd
venv\Scripts\activate
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Create Environment Variables
Create a `.env` file in the project root:

```env
# Development configuration - CHANGE IN PRODUCTION!
JWT_SECRET_KEY=dev-secret-key-change-this-in-production-12345678901234567890
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database configuration
DATABASE_URL=sqlite:///./backend/nawinie.db

# CORS settings
CORS_ORIGINS=http://localhost:3000,http://localhost:4321

# Environment
ENVIRONMENT=development
```

## 🧪 Testing the Setup

### Test JWT Authentication Module
```bash
python test_auth.py
```

This will test:
- JWT token generation
- Token validation
- Auth dependency functionality
- Provide usage examples

### Test Individual Components

**Test JWT Helper:**
```bash
python backend/utils/jwt_helper.py
```

## 🚀 Running the Application

### Start the FastAPI Server
```bash
uvicorn backend.main:app --reload
```

The API will be available at:
- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🔐 Testing Authentication

### Generate Test Tokens

The setup creates a JWT helper that can generate test tokens:

```python
from backend.utils.jwt_helper import create_test_token

# Generate token for specific user
token = create_test_token("123e4567-e89b-12d3-a456-426614174000")
print(f"Bearer {token}")
```

### Test with curl
```bash
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://localhost:8000/api/users/me
```

### Test with Swagger UI
1. Go to http://localhost:8000/docs
2. Click the "Authorize" button
3. Enter: `Bearer YOUR_TOKEN_HERE`
4. Try the `/api/users/me` endpoint

## 📁 Project Structure

```
Na Winie/
├── backend/
│   ├── dependencies/
│   │   └── auth.py          # JWT authentication dependency
│   ├── models/
│   │   ├── user.py          # User SQLAlchemy model
│   │   └── responses.py     # Pydantic response models
│   ├── routers/
│   │   └── users.py         # User-related endpoints (to be created)
│   ├── services/
│   │   └── user_service.py  # User business logic (to be created)
│   ├── utils/
│   │   └── jwt_helper.py    # JWT token utilities
│   └── main.py              # FastAPI application
├── .env                     # Environment variables (created by setup)
├── requirements.txt         # Python dependencies
├── setup.ps1               # Automated setup (PowerShell)
├── setup.bat               # Automated setup (Batch)
└── test_auth.py            # Auth module testing script
```

## 🔧 Development Workflow

1. **Activate virtual environment** (each time you start development)
   ```bash
   venv\Scripts\activate  # Windows
   source venv/bin/activate  # macOS/Linux
   ```

2. **Start the development server**
   ```bash
   uvicorn backend.main:app --reload
   ```

3. **Test your changes**
   - Use the Swagger UI at http://localhost:8000/docs
   - Run `python test_auth.py` to test auth functionality
   - Use curl or Postman for API testing

## 🔍 Troubleshooting

### Common Issues

**"ModuleNotFoundError: No module named 'jose'"**
- Make sure virtual environment is activated
- Run `pip install -r requirements.txt`

**"Authentication required" error**
- Make sure you're using a valid JWT token
- Check that the token hasn't expired (default: 30 minutes)
- Verify the Authorization header format: `Bearer YOUR_TOKEN_HERE`

**PowerShell execution policy error**
- Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
- Then try running `.\setup.ps1` again

### Getting Help

If you encounter issues:
1. Check that all prerequisites are installed
2. Try the manual setup steps
3. Run `python test_auth.py` to diagnose auth issues
4. Check the console output for specific error messages

## 🎯 Next Steps

After successful setup, you can:
1. Implement the `/api/users/me` endpoint
2. Create user service layer
3. Add database integration
4. Write tests for the authentication flow 