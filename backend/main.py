from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# from .routers import auth, recipes, ingredients  # Commented out until routers are implemented
from .routers import users  # Import users router
from .database import engine, Base
from .models import User, Ingredient  # Import implemented models
# from .models import Recipe, RecipeIngredient, Rating  # Commented out until implemented

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Na Winie API",
    description="API for Na Winie - Grab & Cook application",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router, prefix="/api/users", tags=["Users"])
# app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])  # To be implemented
# app.include_router(recipes.router, prefix="/api/recipes", tags=["Recipes"])  # To be implemented  
# app.include_router(ingredients.router, prefix="/api/ingredients", tags=["Ingredients"])  # To be implemented

@app.get("/")
async def root():
    return {"message": "Welcome to Na Winie API"} 