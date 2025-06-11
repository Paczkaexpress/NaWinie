@echo off
echo 🚀 Setting up Na Winie development environment...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found. Please install Python 3.8+ first.
    pause
    exit /b 1
)
echo ✅ Python found

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo 📦 Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo ❌ Failed to create virtual environment
        pause
        exit /b 1
    )
    echo ✅ Virtual environment created
) else (
    echo ✅ Virtual environment already exists
)

REM Activate virtual environment
echo 🔌 Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo 📚 Installing Python dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)
echo ✅ Dependencies installed

REM Create .env file if it doesn't exist
if not exist ".env" (
    echo 🔧 Creating .env file...
    (
        echo # Development configuration - CHANGE IN PRODUCTION!
        echo JWT_SECRET_KEY=dev-secret-key-change-this-in-production-12345678901234567890
        echo JWT_ALGORITHM=HS256
        echo JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
        echo.
        echo # Database configuration
        echo DATABASE_URL=sqlite:///./backend/nawinie.db
        echo.
        echo # CORS settings
        echo CORS_ORIGINS=http://localhost:3000,http://localhost:4321
        echo.
        echo # Environment
        echo ENVIRONMENT=development
    ) > .env
    echo ✅ .env file created
) else (
    echo ✅ .env file already exists
)

REM Test JWT helper
echo 🧪 Testing JWT helper...
python backend/utils/jwt_helper.py
if errorlevel 1 (
    echo ⚠️  JWT helper test failed but continuing...
) else (
    echo ✅ JWT helper working correctly
)

echo.
echo 🎉 Setup completed successfully!
echo.
echo To start development:
echo 1. Activate virtual environment: venv\Scripts\activate.bat
echo 2. Start the FastAPI server: uvicorn backend.main:app --reload
echo 3. API will be available at: http://localhost:8000
echo 4. API docs will be available at: http://localhost:8000/docs
echo.
echo To generate test JWT tokens, run: python backend/utils/jwt_helper.py
pause 