# Setup script for Na Winie project
# This script will set up the development environment

Write-Host "🚀 Setting up Na Winie development environment..." -ForegroundColor Green

# Check if Python is installed
try {
    $pythonVersion = python --version 2>$null
    Write-Host "✅ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python not found. Please install Python 3.8+ first." -ForegroundColor Red
    exit 1
}

# Create virtual environment if it doesn't exist
if (-not (Test-Path "venv")) {
    Write-Host "📦 Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to create virtual environment" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Virtual environment created" -ForegroundColor Green
} else {
    Write-Host "✅ Virtual environment already exists" -ForegroundColor Green
}

# Activate virtual environment
Write-Host "🔌 Activating virtual environment..." -ForegroundColor Yellow
& "venv\Scripts\Activate.ps1"

# Install dependencies
Write-Host "📚 Installing Python dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host "🔧 Creating .env file..." -ForegroundColor Yellow
    @"
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
"@ | Out-File -FilePath ".env" -Encoding UTF8
    Write-Host "✅ .env file created" -ForegroundColor Green
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Test JWT helper
Write-Host "🧪 Testing JWT helper..." -ForegroundColor Yellow
try {
    $testOutput = python backend/utils/jwt_helper.py 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ JWT helper working correctly" -ForegroundColor Green
        Write-Host "Sample JWT token generated:" -ForegroundColor Cyan
        Write-Host $testOutput -ForegroundColor Gray
    } else {
        Write-Host "⚠️  JWT helper test failed but continuing..." -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  Could not test JWT helper but continuing..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Setup completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "To start development:" -ForegroundColor Cyan
Write-Host "1. Make sure virtual environment is activated: venv\Scripts\Activate.ps1" -ForegroundColor White
Write-Host "2. Start the FastAPI server: uvicorn backend.main:app --reload" -ForegroundColor White
Write-Host "3. API will be available at: http://localhost:8000" -ForegroundColor White
Write-Host "4. API docs will be available at: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "To generate test JWT tokens, run: python backend/utils/jwt_helper.py" -ForegroundColor Gray 