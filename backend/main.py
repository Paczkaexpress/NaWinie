from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from pydantic import ValidationError

# from .routers import auth, recipes  # Commented out until routers are implemented
from .routers import users, ingredients  # Import implemented routers
from .database import engine, Base
from .models import User, Ingredient  # Import implemented models
# from .models import Recipe, RecipeIngredient, Rating  # Commented out until implemented

from .utils.logging_config import setup_logging, get_logger
from .utils.error_handlers import (
    validation_exception_handler,
    http_exception_handler,
    database_exception_handler,
    integrity_exception_handler,
    ingredient_not_found_handler,
    ingredient_exists_handler,
    general_exception_handler,
    IngredientNotFoundError,
    IngredientAlreadyExistsError
)

# Setup logging
setup_logging("INFO", enable_file_logging=False)
logger = get_logger(__name__)

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

# Configure exception handlers
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(ValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, database_exception_handler)
app.add_exception_handler(IntegrityError, integrity_exception_handler)
app.add_exception_handler(IngredientNotFoundError, ingredient_not_found_handler)
app.add_exception_handler(IngredientAlreadyExistsError, ingredient_exists_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Include routers
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(ingredients.router, prefix="/api/ingredients", tags=["Ingredients"])
# app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])  # To be implemented
# app.include_router(recipes.router, prefix="/api/recipes", tags=["Recipes"])  # To be implemented

@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {"message": "Welcome to Na Winie API"} 