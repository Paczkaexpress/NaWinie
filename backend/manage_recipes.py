#!/usr/bin/env python3
"""
Script to manage recipes in the database - list, delete, or update recipes.
"""

import sys
import os

# Add the project root directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal
from backend.models.recipe import Recipe, RecipeIngredient, RecipeRating

def list_recipes():
    """List all recipes in the database"""
    db = SessionLocal()
    try:
        recipes = db.query(Recipe).all()
        
        if not recipes:
            print("❌ No recipes found in database")
            return
        
        print(f"📋 Found {len(recipes)} recipes:")
        print("-" * 80)
        
        for i, recipe in enumerate(recipes, 1):
            ingredients_count = db.query(RecipeIngredient).filter(RecipeIngredient.recipe_id == recipe.id).count()
            ratings_count = db.query(RecipeRating).filter(RecipeRating.recipe_id == recipe.id).count()
            
            print(f"{i}. {recipe.name}")
            print(f"   ID: {recipe.id} | Time: {recipe.preparation_time_minutes}min | Complexity: {recipe.complexity_level}")
            print(f"   Ingredients: {ingredients_count} | Ratings: {ratings_count} | Has image: {'Yes' if recipe.image_data else 'No'}")
            print()
            
    except Exception as e:
        print(f"❌ Error listing recipes: {e}")
    finally:
        db.close()

def search_recipes(search_term):
    """Search for recipes by name"""
    db = SessionLocal()
    try:
        recipes = db.query(Recipe).filter(Recipe.name.ilike(f"%{search_term}%")).all()
        
        if not recipes:
            print(f"❌ No recipes found matching '{search_term}'")
            return []
        
        print(f"🔍 Found {len(recipes)} recipe(s) matching '{search_term}':")
        print("-" * 60)
        
        for i, recipe in enumerate(recipes, 1):
            ingredients_count = db.query(RecipeIngredient).filter(RecipeIngredient.recipe_id == recipe.id).count()
            print(f"{i}. {recipe.name}")
            print(f"   ID: {recipe.id} | Ingredients: {ingredients_count} | Has image: {'Yes' if recipe.image_data else 'No'}")
            print()
        
        return recipes
        
    except Exception as e:
        print(f"❌ Error searching recipes: {e}")
        return []
    finally:
        db.close()

def delete_recipe_by_id(recipe_id):
    """Delete a recipe by ID"""
    db = SessionLocal()
    try:
        recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
        
        if not recipe:
            print(f"❌ Recipe with ID {recipe_id} not found")
            return False
        
        print(f"✅ Found recipe: {recipe.name}")
        
        # Count related data
        ingredients_count = db.query(RecipeIngredient).filter(RecipeIngredient.recipe_id == recipe.id).count()
        ratings_count = db.query(RecipeRating).filter(RecipeRating.recipe_id == recipe.id).count()
        
        print(f"   - Ingredients: {ingredients_count}")
        print(f"   - Ratings: {ratings_count}")
        
        confirm = input(f"\nDelete '{recipe.name}'? (yes/no): ").strip().lower()
        if confirm != 'yes':
            print("❌ Deletion cancelled")
            return False
        
        # Delete related data
        db.query(RecipeIngredient).filter(RecipeIngredient.recipe_id == recipe.id).delete()
        db.query(RecipeRating).filter(RecipeRating.recipe_id == recipe.id).delete()
        
        # Delete recipe
        recipe_name = recipe.name
        db.delete(recipe)
        db.commit()
        
        print(f"✅ Deleted recipe: '{recipe_name}'")
        return True
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error deleting recipe: {e}")
        return False
    finally:
        db.close()

def main():
    """Main interactive menu"""
    
    if len(sys.argv) > 1:
        # Command line mode
        command = sys.argv[1].lower()
        
        if command == "list":
            list_recipes()
        elif command == "search" and len(sys.argv) > 2:
            search_term = " ".join(sys.argv[2:])
            search_recipes(search_term)
        elif command == "delete" and len(sys.argv) > 2:
            if sys.argv[2].isdigit():
                delete_recipe_by_id(int(sys.argv[2]))
            else:
                # Search and delete by name
                search_term = " ".join(sys.argv[2:])
                recipes = search_recipes(search_term)
                if len(recipes) == 1:
                    delete_recipe_by_id(recipes[0].id)
                elif len(recipes) > 1:
                    print("Multiple recipes found. Please specify recipe ID:")
                    for i, recipe in enumerate(recipes, 1):
                        print(f"{i}. ID: {recipe.id} - {recipe.name}")
        else:
            print("Usage:")
            print("  python backend/manage_recipes.py list")
            print("  python backend/manage_recipes.py search <term>")
            print("  python backend/manage_recipes.py delete <id_or_name>")
        return
    
    # Interactive mode
    while True:
        print("\n🍽️  Recipe Management")
        print("=" * 30)
        print("1. List all recipes")
        print("2. Search recipes")
        print("3. Delete recipe")
        print("4. Exit")
        
        choice = input("\nChoose option (1-4): ").strip()
        
        if choice == '1':
            list_recipes()
        
        elif choice == '2':
            search_term = input("Enter search term: ").strip()
            if search_term:
                search_recipes(search_term)
        
        elif choice == '3':
            search_term = input("Enter recipe name or ID to delete: ").strip()
            if search_term:
                if search_term.isdigit():
                    delete_recipe_by_id(int(search_term))
                else:
                    recipes = search_recipes(search_term)
                    if len(recipes) == 1:
                        delete_recipe_by_id(recipes[0].id)
                    elif len(recipes) > 1:
                        print("Multiple recipes found. Enter recipe ID:")
                        recipe_id = input("Recipe ID: ").strip()
                        if recipe_id.isdigit():
                            delete_recipe_by_id(int(recipe_id))
        
        elif choice == '4':
            print("👋 Goodbye!")
            break
        
        else:
            print("❌ Invalid choice")

if __name__ == "__main__":
    main() 