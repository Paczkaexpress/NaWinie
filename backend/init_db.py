from sqlalchemy.orm import Session
from backend.database import SessionLocal, engine, Base
from backend.models import User, Recipe, RecipeIngredient, Ingredient, Rating
from passlib.context import CryptContext

# Create password context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def init_db():
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        # Check if we already have data
        if db.query(User).first():
            print("Database already initialized!")
            return
        
        # Create test user
        test_user = User(
            email="test@example.com",
            username="testuser",
            hashed_password=pwd_context.hash("testpassword123")
        )
        db.add(test_user)
        db.commit()
        db.refresh(test_user)
        
        # Create some common ingredients
        common_ingredients = [
            Ingredient(name="Salt", category="Spices", is_common=True),
            Ingredient(name="Pepper", category="Spices", is_common=True),
            Ingredient(name="Olive Oil", category="Oils", is_common=True),
            Ingredient(name="Garlic", category="Vegetables", is_common=True),
            Ingredient(name="Onion", category="Vegetables", is_common=True),
            # Add more ingredients
            Ingredient(name="Tomato", category="Vegetables", is_common=False),
            Ingredient(name="Pasta", category="Grains", is_common=False),
            Ingredient(name="Chicken Breast", category="Meat", is_common=False),
            Ingredient(name="Cheese", category="Dairy", is_common=False),
        ]
        
        for ingredient in common_ingredients:
            db.add(ingredient)
        db.commit()
        
        # Create a sample recipe
        sample_recipe = Recipe(
            title="Simple Pasta",
            description="A quick and easy pasta dish",
            instructions="1. Boil pasta\n2. Sauté garlic and onions\n3. Add tomatoes\n4. Mix with pasta",
            difficulty=2,
            preparation_time=30,
            author_id=test_user.id
        )
        db.add(sample_recipe)
        db.commit()
        db.refresh(sample_recipe)
        
        # Add ingredients to recipe
        recipe_ingredients = [
            RecipeIngredient(
                recipe_id=sample_recipe.id,
                ingredient_id=db.query(Ingredient).filter(Ingredient.name == "Pasta").first().id,
                amount=500,
                unit="g"
            ),
            RecipeIngredient(
                recipe_id=sample_recipe.id,
                ingredient_id=db.query(Ingredient).filter(Ingredient.name == "Garlic").first().id,
                amount=2,
                unit="cloves"
            ),
            RecipeIngredient(
                recipe_id=sample_recipe.id,
                ingredient_id=db.query(Ingredient).filter(Ingredient.name == "Tomato").first().id,
                amount=3,
                unit="pieces"
            ),
        ]
        
        for recipe_ingredient in recipe_ingredients:
            db.add(recipe_ingredient)
        
        # Add a sample rating
        sample_rating = Rating(
            user_id=test_user.id,
            recipe_id=sample_recipe.id,
            rating=4.5
        )
        db.add(sample_rating)
        
        db.commit()
        print("Database initialized successfully!")
        
    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    init_db() 