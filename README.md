# Na Winie (Grab & Cook)

A full-stack web application that helps you turn your leftover ingredients into delicious meals. Built with modern technologies including Astro, React, TypeScript, FastAPI, and SQLAlchemy.

## 🌟 Features

### Core Functionality
- **Smart Recipe Discovery**: Find recipes based on available ingredients with intelligent relevance scoring
- **Comprehensive Recipe Management**: Create, edit, update, and delete recipes with detailed steps and ingredients
- **User Authentication & Authorization**: Secure JWT-based authentication with user profiles
- **Interactive Ingredient Management**: Search, select, and manage ingredient lists
- **Recipe Rating System**: Rate and review recipes with community feedback
- **User Default Ingredients**: Save your commonly used ingredients for quick recipe searches
- **Image Upload**: Upload and manage recipe images

### Advanced Features
- **Intelligent Search**: Fuzzy search for ingredients and recipes
- **Pagination & Filtering**: Sort and filter recipes by complexity, rating, preparation time
- **Responsive Design**: Modern UI with Tailwind CSS and shadcn/ui components
- **Performance Optimized**: Background tasks, caching, and optimized database queries
- **Error Handling**: Comprehensive error boundaries and validation
- **Testing Suite**: Full test coverage for frontend and backend components

## 🛠️ Tech Stack

### Frontend
- **Framework**: Astro 4.4.0 (Static Site Generation)
- **UI Library**: React 18.2.0 with TypeScript 5.3.3
- **Styling**: Tailwind CSS 3.4.1 with tailwindcss-animate
- **Components**: Radix UI components (@radix-ui/react-*)
- **State Management**: React hooks and context
- **HTTP Client**: Fetch API with Supabase integration
- **Icons**: Lucide React
- **Testing**: Vitest, Testing Library, MSW for mocking

### Backend
- **Framework**: FastAPI 0.109.2 with Uvicorn 0.27.1
- **Database**: SQLAlchemy 2.0.27 with SQLite (development) / PostgreSQL (production)
- **Authentication**: JWT with python-jose and passlib
- **Validation**: Pydantic 2.6.1 with email validation
- **Database Migrations**: Alembic 1.13.1
- **Testing**: Pytest 8.0.0 with httpx
- **Environment**: python-dotenv for configuration

### Database & Infrastructure
- **Primary Database**: SQLite (development), PostgreSQL (production)
- **Authentication Provider**: Supabase (optional fallback)
- **ORM**: SQLAlchemy with relationship mapping
- **Migration System**: Alembic for database versioning

## 🚀 Getting Started

### Prerequisites

- **Node.js** 22+ (for frontend)
- **Python** 3.8+ (for backend)
- **Git** (for version control)
- **npm** (comes with Node.js)

### Quick Setup (Automated)

For Windows users, use the automated setup scripts:

```powershell
# PowerShell (Recommended)
.\setup.ps1

# Or Batch Script
setup.bat
```

### Manual Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/nawinie.git
cd nawinie
```

#### 2. Frontend Setup
```bash
# Install frontend dependencies
npm install
```

#### 3. Backend Setup
```bash
# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt
```

#### 4. Environment Configuration
Create a `.env` file in the project root:

```env
# JWT Configuration
JWT_SECRET_KEY=your-super-secret-jwt-key-change-in-production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# Database Configuration
DATABASE_URL=sqlite:///./backend/nawinie.db

# CORS Settings
CORS_ORIGINS=http://localhost:3000,http://localhost:4321

# Environment
ENVIRONMENT=development

# Optional: Supabase Configuration (fallback)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 🔧 Development

### Starting the Development Servers

#### Backend (FastAPI)
```bash
# Make sure virtual environment is activated
cd backend
uvicorn main:app --reload
```

The backend will be available at:
- **API**: http://localhost:8000
- **Interactive API Documentation**: http://localhost:8000/docs
- **ReDoc Documentation**: http://localhost:8000/redoc

#### Frontend (Astro)
```bash
# In a new terminal
npm run dev
```

The frontend will be available at:
- **Application**: http://localhost:4321

### Available Scripts

#### Frontend Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run tests
npm run test:verbose # Run tests with detailed output
npm run coverage     # Generate test coverage report
```

#### Backend Scripts
```bash
uvicorn backend.main:app --reload    # Development server
python -m pytest                    # Run tests
python backend/manage_recipes.py    # Recipe management CLI
python backend/populate_recipes.py  # Populate database with sample data
```

## 🧪 Testing

### Frontend Testing
```bash
# Run all tests
npm test

# Run tests with coverage
npm run coverage

# Run tests in verbose mode
npm run test:verbose
```

### Backend Testing
```bash
# Activate virtual environment first
venv\Scripts\activate  # Windows
source venv/bin/activate  # macOS/Linux

# Run all tests
pytest

# Run specific test file
pytest backend/tests/test_recipes_endpoint.py

# Run with coverage
pytest --cov=backend
```

### Test Authentication
```bash
# Test JWT authentication functionality
python test_auth.py
```

## 📁 Project Structure

```
Na Winie/
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── layouts/            # Astro layouts
│   │   ├── pages/              # Astro pages and API routes
│   │   ├── lib/                # Utilities and API clients
│   │   └── styles/             # CSS files
│   ├── public/                 # Static assets
│   └── package.json           # Frontend dependencies
├── backend/
│   ├── models/                # SQLAlchemy models
│   ├── routers/               # FastAPI route handlers
│   ├── services/              # Business logic layer
│   ├── dependencies/          # FastAPI dependencies
│   ├── utils/                 # Utility functions
│   ├── tests/                 # Backend tests
│   └── main.py               # FastAPI application entry point
├── db/                       # Database migrations and schemas
├── docs/                     # Project documentation
├── .env                      # Environment variables
├── requirements.txt          # Python dependencies
└── README.md                # This file
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/users/me` - Get current user profile

### Ingredients
- `GET /api/ingredients` - Search and list ingredients
- `GET /api/ingredients/{id}` - Get ingredient details

### Recipes
- `GET /api/recipes` - List recipes with filtering and pagination
- `GET /api/recipes/{id}` - Get recipe details
- `POST /api/recipes` - Create new recipe (authenticated)
- `PUT /api/recipes/{id}` - Update recipe (owner only)
- `DELETE /api/recipes/{id}` - Delete recipe (owner only)
- `GET /api/recipes/find-by-ingredients` - Find recipes by ingredient IDs
- `POST /api/recipes/{id}/rate` - Rate a recipe

### User Preferences
- `GET /api/users/me/default-ingredients` - Get user's default ingredients
- `POST /api/users/me/default-ingredients` - Add default ingredient
- `DELETE /api/users/me/default-ingredients/{id}` - Remove default ingredient


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Development Roadmap

- [ ] Mobile app development (React Native)
- [ ] Social features (recipe sharing, following users)
- [ ] Meal planning and grocery lists
- [ ] Nutritional information integration
- [ ] Recipe import from external sources
- [ ] Advanced search filters
- [ ] Recipe collections and cookbooks
