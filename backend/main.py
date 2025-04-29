from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, recipes, ingredients
from .database import engine, Base

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
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(recipes.router, prefix="/api/recipes", tags=["Recipes"])
app.include_router(ingredients.router, prefix="/api/ingredients", tags=["Ingredients"])

@app.get("/")
async def root():
    return {"message": "Welcome to Na Winie API"} 