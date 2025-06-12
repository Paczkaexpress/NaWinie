#!/usr/bin/env python3
"""
Script to populate the database with sample ingredients.
Run this script to add common ingredients to your empty database.
"""

import sys
import os

# Add the project root directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.database import SessionLocal
from backend.models import Ingredient

# Common Polish ingredients with their unit types
SAMPLE_INGREDIENTS = [
    # Vegetables
    ("Pomidor", "unit"),
    ("Cebula", "unit"),
    ("Czosnek", "unit"),
    ("Marchew", "unit"),
    ("Ziemniak", "unit"),
    ("Papryka", "unit"),
    ("Ogórek", "unit"),
    ("Sałata", "unit"),
    ("Kapusta", "unit"),
    ("Brokuły", "unit"),
    ("Kalafior", "unit"),
    ("Szpinak", "unit"),
    ("Pieczarka", "unit"),
    ("Bakłażan", "unit"),
    ("Cukinia", "unit"),
    
    # Fruits
    ("Jabłko", "unit"),
    ("Banan", "unit"),
    ("Pomarańcza", "unit"),
    ("Cytryna", "unit"),
    ("Truskawka", "unit"),
    ("Malina", "unit"),
    ("Borówka", "unit"),
    
    # Meat & Fish
    ("Kurczak", "gram"),
    ("Wołowina", "gram"),
    ("Wieprzowina", "gram"),
    ("Łosoś", "gram"),
    ("Tuńczyk", "gram"),
    ("Jajko", "unit"),
    
    # Dairy
    ("Mleko", "milliliter"),
    ("Masło", "gram"),
    ("Ser żółty", "gram"),
    ("Jogurt", "gram"),
    ("Śmietana", "milliliter"),
    ("Twaróg", "gram"),
    
    # Grains & Pasta  
    ("Ryż", "gram"),
    ("Makaron", "gram"),
    ("Chleb", "gram"),
    ("Mąka", "gram"),
    ("Płatki owsiane", "gram"),
    
    # Spices & Herbs
    ("Sól", "gram"),
    ("Pieprz", "gram"),
    ("Bazylia", "gram"),
    ("Oregano", "gram"),
    ("Tymianek", "gram"),
    ("Rozmaryn", "gram"),
    ("Pietruszka", "gram"),
    ("Koperek", "gram"),
    
    # Other
    ("Olej", "milliliter"),
    ("Ocet", "milliliter"),
    ("Cukier", "gram"),
    ("Miód", "gram"),
    ("Oliwa z oliwek", "milliliter"),
]

def populate_ingredients():
    """Add sample ingredients to the database."""
    db = SessionLocal()
    try:
        print("🌱 Starting to populate ingredients database...")
        
        # Check if ingredients already exist
        existing_count = db.query(Ingredient).count()
        if existing_count > 0:
            print(f"⚠️  Database already contains {existing_count} ingredients.")
            response = input("Do you want to add more ingredients anyway? (y/N): ")
            if response.lower() != 'y':
                print("❌ Operation cancelled.")
                return
        
        added_count = 0
        skipped_count = 0
        
        for name, unit_type in SAMPLE_INGREDIENTS:
            # Check if ingredient already exists
            existing = db.query(Ingredient).filter(Ingredient.name == name).first()
            if existing:
                print(f"⏭️  Skipping '{name}' - already exists")
                skipped_count += 1
                continue
            
            # Create new ingredient
            ingredient = Ingredient(
                name=name,
                unit_type=unit_type
            )
            db.add(ingredient)
            print(f"✅ Added: {name} ({unit_type})")
            added_count += 1
        
        # Commit all changes
        db.commit()
        
        print(f"\n🎉 Successfully populated database!")
        print(f"   - Added: {added_count} new ingredients")
        print(f"   - Skipped: {skipped_count} existing ingredients")
        print(f"   - Total ingredients in database: {db.query(Ingredient).count()}")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error populating database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    populate_ingredients() 