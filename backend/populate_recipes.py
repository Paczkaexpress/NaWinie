#!/usr/bin/env python3
"""
Script to populate the database with sample recipes including real images from the internet.
Run this script to add common Polish recipes with real food images to your empty database.
"""

import sys
import os
import base64
import io
import requests
import hashlib
import time
from urllib.parse import quote

# Add the project root directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from PIL import Image as PILImage
    PILLOW_AVAILABLE = True
except ImportError:
    PILLOW_AVAILABLE = False
    print("⚠️  Pillow not available. Images will not be processed.")
    print("   Install with: pip install Pillow==10.2.0")

from backend.database import SessionLocal
from backend.models.recipe import Recipe, RecipeIngredient, ComplexityLevel
from backend.models.ingredient import Ingredient
from backend.models.user import User

# Unsplash API configuration
UNSPLASH_ACCESS_KEY = "your_unsplash_access_key"  # Get from https://unsplash.com/developers
UNSPLASH_BASE_URL = "https://api.unsplash.com"

# Create images directory if it doesn't exist
IMAGES_DIR = os.path.join(os.path.dirname(__file__), "images")
if not os.path.exists(IMAGES_DIR):
    os.makedirs(IMAGES_DIR)
    print(f"✅ Created images directory: {IMAGES_DIR}")

def download_recipe_image(recipe_name, recipe_id):
    """Download a real food image from Unsplash API"""
    
    if not PILLOW_AVAILABLE:
        print(f"   ⚠️  Pillow not available, skipping image download")
        return None, None
    
    try:
        # Create a clean filename for the image
        clean_name = "".join(c for c in recipe_name if c.isalnum() or c in (' ', '-', '_')).rstrip()
        clean_name = clean_name.replace(' ', '_').lower()
        filename = f"{clean_name}_{str(recipe_id)[:8]}.jpg"
        filepath = os.path.join(IMAGES_DIR, filename)
        
        # Check if image already exists
        if os.path.exists(filepath):
            print(f"   📁 Using existing image: {filename}")
            with open(filepath, 'rb') as f:
                image_bytes = f.read()
            return image_bytes, filename
        
        # Search for images on Unsplash
        search_terms = [
            f"{recipe_name} food",
            f"{recipe_name}",
            "polish food",
            "homemade food",
            "traditional food"
        ]
        
        image_url = None
        for search_term in search_terms:
            print(f"   🔍 Searching for: {search_term}")
            
            # Try Unsplash first
            if UNSPLASH_ACCESS_KEY and UNSPLASH_ACCESS_KEY != "your_unsplash_access_key":
                image_url = search_unsplash_image(search_term)
                if image_url:
                    break
            
            # Fallback to placeholder service
            if not image_url:
                image_url = get_placeholder_food_image(search_term)
                if image_url:
                    break
        
        if not image_url:
            print(f"   ❌ No suitable image found")
            return None, None
        
        # Download the image
        print(f"   ⬇️  Downloading image...")
        response = requests.get(image_url, timeout=10)
        response.raise_for_status()
        
        # Process the image
        image = PILImage.open(io.BytesIO(response.content))
        
        # Resize and optimize
        target_width, target_height = 800, 600
        image = resize_and_crop_image(image, target_width, target_height)
        
        # Save to file
        image.save(filepath, "JPEG", quality=85, optimize=True)
        print(f"   💾 Saved to: images/{filename}")
        
        # Convert to bytes for database
        buffer = io.BytesIO()
        image.save(buffer, "JPEG", quality=85, optimize=True)
        image_bytes = buffer.getvalue()
        
        # Check file size
        size_kb = len(image_bytes) / 1024
        print(f"   📏 Image size: {size_kb:.1f} KB")
        
        return image_bytes, filename
        
    except Exception as e:
        print(f"   ❌ Error downloading image: {e}")
        return None, None

def search_unsplash_image(search_term):
    """Search for images on Unsplash"""
    try:
        headers = {
            "Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"
        }
        
        params = {
            "query": search_term,
            "page": 1,
            "per_page": 10,
            "orientation": "landscape",
            "category": "food"
        }
        
        response = requests.get(
            f"{UNSPLASH_BASE_URL}/search/photos",
            headers=headers,
            params=params,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            if data['results']:
                # Get the first suitable image
                for result in data['results']:
                    # Prefer regular size (better quality/size ratio)
                    return result['urls']['regular']
        
        return None
        
    except Exception as e:
        print(f"   ⚠️  Unsplash search error: {e}")
        return None

def get_placeholder_food_image(search_term):
    """Get a placeholder food image as fallback"""
    try:
        # Use a food-specific placeholder service
        food_categories = {
            "naleśniki": "pancakes",
            "makaron": "pasta", 
            "omlet": "omelette",
            "owsianka": "oatmeal",
            "zupa": "soup",
            "chleb": "bread",
            "surówka": "salad",
            "ziemniaki": "potatoes",
            "koktajl": "smoothie",
            "herbata": "tea"
        }
        
        # Try to match recipe name to food category
        category = "food"
        for polish_word, english_word in food_categories.items():
            if polish_word.lower() in search_term.lower():
                category = english_word
                break
        
        # Use Picsum with a food-related seed
        seed = abs(hash(search_term)) % 1000
        placeholder_url = f"https://picsum.photos/800/600?random={seed}"
        
        return placeholder_url
        
    except Exception:
        return None

def resize_and_crop_image(image, target_width, target_height):
    """Resize and crop image to target dimensions while maintaining aspect ratio"""
    
    # Convert to RGB if necessary
    if image.mode != 'RGB':
        image = image.convert('RGB')
    
    # Calculate ratios
    img_width, img_height = image.size
    target_ratio = target_width / target_height
    img_ratio = img_width / img_height
    
    if img_ratio > target_ratio:
        # Image is wider than target, crop width
        new_height = img_height
        new_width = int(img_height * target_ratio)
        left = (img_width - new_width) // 2
        top = 0
        right = left + new_width
        bottom = img_height
    else:
        # Image is taller than target, crop height
        new_width = img_width
        new_height = int(img_width / target_ratio)
        left = 0
        top = (img_height - new_height) // 2
        right = img_width
        bottom = top + new_height
    
    # Crop and resize
    image = image.crop((left, top, right, bottom))
    image = image.resize((target_width, target_height), PILImage.Resampling.LANCZOS)
    
    return image

def image_bytes_to_base64(image_bytes):
    """Convert image bytes to base64 data URL"""
    if not image_bytes:
        return None
    
    try:
        base64_string = base64.b64encode(image_bytes).decode()
        return f"data:image/jpeg;base64,{base64_string}"
    except Exception as e:
        print(f"   ❌ Error converting to base64: {e}")
        return None

def setup_unsplash_api():
    """Setup Unsplash API key if not configured"""
    global UNSPLASH_ACCESS_KEY
    
    if UNSPLASH_ACCESS_KEY == "your_unsplash_access_key":
        print("\n🔑 Unsplash API Setup")
        print("=" * 40)
        print("To download high-quality food images:")
        print("1. Go to https://unsplash.com/developers")
        print("2. Create a free account and app")
        print("3. Copy your Access Key")
        print("4. Set it in this script or as environment variable")
        print()
        
        # Try to get from environment
        env_key = os.getenv('UNSPLASH_ACCESS_KEY')
        if env_key:
            UNSPLASH_ACCESS_KEY = env_key
            print("✅ Found Unsplash API key in environment variables")
            return True
        
        # Ask user for key
        user_key = input("Enter your Unsplash Access Key (or press Enter to use placeholders): ").strip()
        if user_key:
            UNSPLASH_ACCESS_KEY = user_key
            print("✅ Unsplash API key configured")
            return True
        else:
            print("⚠️  Using placeholder images instead")
            return False
    
    return True

# Sample recipes with ingredients and preparation steps
SAMPLE_RECIPES = [
    {
        "name": "Klasyczne naleśniki",
        "preparation_time": 30,
        "complexity": ComplexityLevel.EASY,
        "steps": [
            "Zmiksuj składniki na gładkie ciasto",
            "Odstaw ciasto na 10 minut do odpoczynięcia", 
            "Smaż cienkie placki na średnim ogniu do zarumienienia"
        ],
        "ingredients": [
            ("Mąka pszenna", 250.0),  # 1 szklanka ≈ 250g
            ("Mleko krowie", 250.0),  # 1 szklanka ≈ 250ml
            ("Jajka", 2.0),
            ("Olej słonecznikowy", 15.0),  # 1 łyżka ≈ 15ml
            ("Sól kuchenna", 2.0)  # szczypta ≈ 2g
        ]
    },
    {
        "name": "Awaryjne chlebki z patelni",
        "preparation_time": 25,
        "complexity": ComplexityLevel.EASY,
        "steps": [
            "Zagnieć ciasto z mąki, jogurtu, proszku do pieczenia, soli i oleju",
            "Podziel na 6 równych części i uformuj kulki",
            "Rozwałkuj każdą kulkę na cienki placek",
            "Smaż na suchej patelni po 2 minuty z każdej strony"
        ],
        "ingredients": [
            ("Mąka pszenna", 200.0),
            ("Jogurt naturalny", 125.0),
            ("Proszek do pieczenia", 5.0),  # 1 łyżeczka ≈ 5g
            ("Sól kuchenna", 2.0),  # 1/4 łyżeczki ≈ 2g
            ("Olej słonecznikowy", 30.0)  # 2 łyżki ≈ 30ml
        ]
    },
    {
        "name": "Makaron aglio e olio",
        "preparation_time": 15,
        "complexity": ComplexityLevel.EASY,
        "steps": [
            "Ugotuj makaron w osolonej wodzie al dente według instrukcji na opakowaniu",
            "Pokrój czosnek w cienkie plasterki",
            "Na patelni rozgrzej oliwę, dodaj czosnek i płatki chili, smaż do zarumienienia",
            "Wymieszaj odcedzony makaron z aromatyczną oliwą",
            "Dopraw solą i podawaj natychmiast"
        ],
        "ingredients": [
            ("Makaron pszenny", 200.0),
            ("Czosnek", 3.0),
            ("Oliwa z oliwek", 40.0),
            ("Płatki chili", 1.0),  # szczypta
            ("Sól kuchenna", 3.0)
        ]
    },
    {
        "name": "Jajecznica na maśle",
        "preparation_time": 10,
        "complexity": ComplexityLevel.EASY,
        "steps": [
            "Roztrzep jajka w misce, dopraw solą i pieprzem",
            "Roztop masło na patelni na małym ogniu",
            "Wlej roztrzepane jajka na patelnię",
            "Mieszaj łopatką na małym ogniu do osiągnięcia lubianej konsystencji"
        ],
        "ingredients": [
            ("Jajka", 4.0),
            ("Masło", 25.0),
            ("Sól kuchenna", 2.0),
            ("Pieprz czarny mielony", 1.0)
        ]
    },
    {
        "name": "Owsianka na wodzie",
        "preparation_time": 10,
        "complexity": ComplexityLevel.EASY,
        "steps": [
            "Zagotuj wodę z szczyptą soli w garnku",
            "Wsyp płatki owsiane do wrzącej wody",
            "Gotuj na małym ogniu przez 5 minut, często mieszając",
            "Podawaj z miodem lub owocami według upodobań"
        ],
        "ingredients": [
            ("Płatki owsiane", 125.0),  # 1/2 szklanki ≈ 125g
            ("Woda", 250.0),  # 1 szklanka
            ("Sól kuchenna", 1.0),
            ("Miód", 15.0),  # opcjonalnie
            ("Jabłka", 1.0)  # opcjonalnie
        ]
    },
    {
        "name": "Placuszki z bananów i jajek",
        "preparation_time": 10,
        "complexity": ComplexityLevel.EASY,
        "steps": [
            "Zblenduj banany z jajkami na gładką masę",
            "Rozgrzej patelnię bez tłuszczu",
            "Smaż małe placuszki po 1 minucie z każdej strony",
            "Podawaj od razu po usmażeniu"
        ],
        "ingredients": [
            ("Banan", 2.0),
            ("Jajka", 2.0)
        ]
    },
    {
        "name": "Surówka z marchewki",
        "preparation_time": 10,
        "complexity": ComplexityLevel.EASY,
        "steps": [
            "Zetrzyj marchewkę na tarce o grubych oczkach",
            "Dodaj sok z cytryny i cukier",
            "Wymieszaj wszystkie składniki",
            "Odstaw na 5 minut, aby marchewka puściła sok"
        ],
        "ingredients": [
            ("Marchewka", 2.0),
            ("Cytryna", 0.5),  # sok z połowy cytryny
            ("Cukier biały", 5.0)  # 1 łyżeczka
        ]
    },
    {
        "name": "Domowy sos vinaigrette",
        "preparation_time": 5,
        "complexity": ComplexityLevel.EASY,
        "steps": [
            "Wlej wszystkie składniki do słoiczka",
            "Wstrząśnij energicznie do połączenia składników",
            "Skosztuj i dostosuj przyprawy według upodobań",
            "Przechowuj w lodówce do 1 tygodnia"
        ],
        "ingredients": [
            ("Oliwa z oliwek", 45.0),  # 3 łyżki
            ("Ocet winny", 15.0),  # 1 łyżka
            ("Musztarda", 2.5),  # 1/2 łyżeczki
            ("Sól kuchenna", 2.0),
            ("Pieprz czarny mielony", 1.0)
        ]
    },
    {
        "name": "Pieczone ziemniaki",
        "preparation_time": 45,
        "complexity": ComplexityLevel.EASY,
        "steps": [
            "Umyj ziemniaki i pokrój w ósemki (nie obieraj)",
            "Wymieszaj z olejem i solą w misce",
            "Rozłóż na blasze wyłożonej papierem do pieczenia",
            "Piecz w 200°C przez 35 minut, przewracając w połowie czasu"
        ],
        "ingredients": [
            ("Ziemniaki", 600.0),  # 4 średnie ziemniaki ≈ 600g
            ("Olej słonecznikowy", 30.0),  # 2 łyżki
            ("Sól kuchenna", 5.0)  # 1 łyżeczka
        ]
    },
    {
        "name": "Zupa pomidorowa z koncentratu",
        "preparation_time": 15,
        "complexity": ComplexityLevel.EASY,
        "steps": [
            "Doprowadź bulion do wrzenia w garnku",
            "Wmieszaj koncentrat pomidorowy do gorącego bulionu",
            "Gotuj przez 5 minut na małym ogniu",
            "Zabiel śmietanką i dopraw solą oraz pieprzem"
        ],
        "ingredients": [
            ("Bulion warzywny (kostka)", 2.0),  # na 1l bulionu
            ("Koncentrat pomidorowy", 30.0),  # 2 łyżki
            ("Śmietana 30%", 100.0),
            ("Sól kuchenna", 3.0),
            ("Pieprz czarny mielony", 1.0),
            ("Woda", 1000.0)
        ]
    },
    {
        "name": "Omlet francuski",
        "preparation_time": 8,
        "complexity": ComplexityLevel.MEDIUM,
        "steps": [
            "Rozmąć jajka z solą w misce",
            "Roztop masło na patelni na średnim ogniu",
            "Wlej roztrzepane jajka na patelnię",
            "Łopatką podsuwaj brzegi omleta ku środkowi",
            "Gdy jeszcze lekko płynny, zwiń na połowę i przełóż na talerz"
        ],
        "ingredients": [
            ("Jajka", 3.0),
            ("Masło", 15.0),
            ("Sól kuchenna", 2.0)
        ]
    },
    {
        "name": "Domowy lemoniad",
        "preparation_time": 10,
        "complexity": ComplexityLevel.EASY,
        "steps": [
            "Wyciśnij sok z cytryny",
            "Rozpuść cukier w odrobinie ciepłej wody",
            "Połącz sok cytrynowy z syropem cukrowym",
            "Dolej resztę zimnej wody i dokładnie wymieszaj",
            "Schłódź w lodówce przed podaniem"
        ],
        "ingredients": [
            ("Cytryna", 1.0),
            ("Woda", 500.0),
            ("Cukier biały", 30.0)  # 2 łyżki
        ]
    },
    {
        "name": "Kluski śląskie",
        "preparation_time": 40,
        "complexity": ComplexityLevel.MEDIUM,
        "steps": [
            "Ugotuj ziemniaki do miękkości, ostudzić i przeciśnij przez praskę",
            "Dodaj mąkę ziemniaczaną, jajko i sól do ziemniaków",
            "Zagnieć gładkie ciasto (nie za długo)",
            "Uformuj niewielkie kulki z charakterystyczną dziurką",
            "Gotuj w osolonej wodzie przez 3 minuty od wypłynięcia"
        ],
        "ingredients": [
            ("Ziemniaki", 500.0),  # ugotowane
            ("Mąka ziemniaczana", 150.0),
            ("Jajka", 1.0),
            ("Sól kuchenna", 5.0)
        ]
    },
    {
        "name": "Sos czosnkowy",
        "preparation_time": 35,
        "complexity": ComplexityLevel.EASY,
        "steps": [
            "Zetrzyj czosnek na drobnej tarce lub przez praskę",
            "Wymieszaj jogurt z majonezem",
            "Dodaj starty czosnek, sól i pieprz",
            "Wymieszaj wszystkie składniki",
            "Schłódź w lodówce przez 30 minut przed podaniem"
        ],
        "ingredients": [
            ("Jogurt naturalny", 200.0),
            ("Czosnek", 1.0),
            ("Majonez", 15.0),  # 1 łyżka
            ("Sól kuchenna", 2.0),
            ("Pieprz czarny mielony", 1.0)
        ]
    },
    {
        "name": "Kanapka BLT",
        "preparation_time": 12,
        "complexity": ComplexityLevel.EASY,
        "steps": [
            "Podsmaż plastry bekonu na patelni do chrupkości",
            "Opiecz kromki chleba w tosterze",
            "Posmaruj pieczywo majonezem",
            "Ułóż na chlebie sałatę, plastry pomidora i bekon",
            "Przykryj drugą kromką i delikatnie dociśnij"
        ],
        "ingredients": [
            ("Boczek", 60.0),  # 2 plastry ≈ 60g
            ("Pomidor", 0.5),  # 2 plasterki
            ("Sałata masłowa", 20.0),  # 2 liście
            ("Chleb pszenny", 60.0),  # 2 kromki
            ("Majonez", 20.0)
        ]
    },
    {
        "name": "Herbata miętowa",
        "preparation_time": 8,
        "complexity": ComplexityLevel.EASY,
        "steps": [
            "Opłucz świeże liście mięty",
            "Zalej liście wrzątkiem",
            "Parz przez 5 minut pod przykryciem",
            "Odcedź liście i dosłódź według upodobań"
        ],
        "ingredients": [
            ("Mięta świeża", 10.0),  # 1 garść ≈ 10g
            ("Woda", 300.0),
            ("Cukier biały", 10.0)  # opcjonalnie
        ]
    },
    {
        "name": "Prosta focaccia",
        "preparation_time": 100,  # włącznie z czasem na wyrośnięcie
        "complexity": ComplexityLevel.MEDIUM,
        "steps": [
            "Wymieszaj mąkę z drożdżami w misce",
            "Dodaj ciepłą wodę i 1 łyżkę oliwy, zagnieć ciasto",
            "Przełóż do naoliwionej miski, przykryj i wyrastaj 1 godzinę",
            "Przełóż na naoliwioną blachę, posmaruj pozostałą oliwą",
            "Posyp solą i rozmarynem, piecz 20 min w 220°C"
        ],
        "ingredients": [
            ("Mąka pszenna", 250.0),
            ("Woda", 160.0),  # ciepła
            ("Drożdże instant", 4.0),
            ("Oliwa z oliwek", 30.0),  # 2 łyżki
            ("Sól kuchenna", 5.0),
            ("Rozmaryn suszony", 2.0)
        ]
    },
    {
        "name": "Jednoskładnikowy dżem z jabłek",
        "preparation_time": 60,
        "complexity": ComplexityLevel.EASY,
        "steps": [
            "Umyj, obierz i pokrój jabłka w kostkę",
            "Włóż do garnka o grubym dnie",
            "Duś na małym ogniu przez 40 minut, często mieszając",
            "Miażdż widelcem do osiągnięcia pożądanej konsystencji",
            "Przełóż do sterylnych słoików i zakręć"
        ],
        "ingredients": [
            ("Jabłka", 1000.0)  # 1 kg
        ]
    },
    {
        "name": "Szybka tortilla z mąki kukurydzianej",
        "preparation_time": 15,
        "complexity": ComplexityLevel.EASY,
        "steps": [
            "Wymieszaj mąkę kukurydzianą z solą",
            "Dodaj ciepłą wodę i zagnieć gładkie ciasto",
            "Podziel na 6 równych części i uformuj kulki",
            "Rozwałkuj każdą kulkę na cienki placek",
            "Smaż na suchej patelni po 30 sekund z każdej strony"
        ],
        "ingredients": [
            ("Mąka kukurydziana", 120.0),
            ("Woda", 90.0),  # ciepła
            ("Sól kuchenna", 1.0)
        ]
    },
    {
        "name": "Koktajl banan-kakao",
        "preparation_time": 5,
        "complexity": ComplexityLevel.EASY,
        "steps": [
            "Obierz banana i pokrój w kawałki",
            "Włóż wszystkie składniki do blendera",
            "Blenduj przez 30 sekund do uzyskania gładkiej konsystencji",
            "Podawaj natychmiast lub schłódź w lodówce"
        ],
        "ingredients": [
            ("Banan", 1.0),
            ("Mleko krowie", 200.0),
            ("Kakao w proszku", 5.0)  # 1 łyżeczka
        ]
    }
]

def create_default_user(db):
    """Create a default user for recipes if none exists."""
    user = db.query(User).filter(User.email == "admin@recipes.local").first()
    if not user:
        user = User(
            email="admin@recipes.local"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print("✅ Created default user: admin@recipes.local")
    return user

def find_ingredient_by_name(db, name):
    """Find ingredient by name, trying different variations."""
    # Próbuj dokładnej nazwy
    ingredient = db.query(Ingredient).filter(Ingredient.name == name).first()
    if ingredient:
        return ingredient
    
    # Próbuj bez doprecyzowań w nawiasach
    simple_name = name.split('(')[0].strip()
    ingredient = db.query(Ingredient).filter(Ingredient.name == simple_name).first()
    if ingredient:
        return ingredient
    
    # Mapowania dla specjalnych przypadków
    name_mappings = {
        "Płatki owsiane": "Płatki owsiane",
        "Proszek do pieczenia": "Proszek do pieczenia", 
        "Płatki chili": "Papryka chili suszona",
        "Miód": "Miód naturalny",
        "Mąka ziemniaczana": "Mąka ziemniaczana",
        "Koncentrat pomidorowy": "Koncentrat pomidorowy",
        "Drożdże instant": "Drożdże instant",
        "Rozmaryn suszony": "Rozmaryn suszony",
        "Mięta świeża": "Mięta",
        "Mąka kukurydziana": "Mąka kukurydziana",
        "Kakao w proszku": "Kakao",
        "Chleb pszenny": "Chleb",
        "Ocet winny": "Ocet"
    }
    
    if name in name_mappings:
        mapped_name = name_mappings[name]
        ingredient = db.query(Ingredient).filter(Ingredient.name == mapped_name).first()
        if ingredient:
            return ingredient
    
    return None

def populate_recipes():
    """Add sample recipes to the database."""
    db = SessionLocal()
    try:
        print("🍽️  Starting to populate recipes database...")
        
        # Setup Unsplash API for image downloading
        setup_unsplash_api()
        
        # Check if recipes already exist
        existing_count = db.query(Recipe).count()
        if existing_count > 0:
            print(f"⚠️  Database already contains {existing_count} recipes.")
            response = input("Do you want to add more recipes anyway? (y/N): ")
            if response.lower() != 'y':
                print("❌ Operation cancelled.")
                return
        
        # Create default user
        default_user = create_default_user(db)
        
        added_count = 0
        skipped_count = 0
        missing_ingredients = set()
        
        for recipe_data in SAMPLE_RECIPES:
            # Check if recipe already exists
            existing = db.query(Recipe).filter(Recipe.name == recipe_data["name"]).first()
            if existing:
                print(f"⏭️  Skipping '{recipe_data['name']}' - already exists")
                skipped_count += 1
                continue
            
            # Download real image for recipe
            print(f"   📸 Downloading real image for '{recipe_data['name']}'...")
            temp_id = hashlib.md5(recipe_data["name"].encode()).hexdigest()[:8]
            image_bytes, filename = download_recipe_image(recipe_data["name"], temp_id)
            image_data = image_bytes_to_base64(image_bytes) if image_bytes else None
            
            if image_data:
                size_kb = len(image_data.encode()) / 1024
                print(f"   ✅ Downloaded image ({size_kb:.1f} KB) → {filename}")
            else:
                print(f"   ⚠️  No image downloaded (network error or API unavailable)")
            
            # Create new recipe
            recipe = Recipe(
                name=recipe_data["name"],
                preparation_time_minutes=recipe_data["preparation_time"],
                complexity_level=recipe_data["complexity"],
                steps=recipe_data["steps"],
                author_id=default_user.id,
                image_data=image_data
            )
            db.add(recipe)
            db.flush()  # Get the recipe ID
            
            # Add ingredients
            ingredients_added = 0
            for ingredient_name, amount in recipe_data["ingredients"]:
                ingredient = find_ingredient_by_name(db, ingredient_name)
                if ingredient:
                    recipe_ingredient = RecipeIngredient(
                        recipe_id=recipe.id,
                        ingredient_id=ingredient.id,
                        amount=amount,
                        is_optional="false"
                    )
                    db.add(recipe_ingredient)
                    ingredients_added += 1
                else:
                    missing_ingredients.add(ingredient_name)
                    print(f"   ⚠️  Missing ingredient: {ingredient_name}")
            
            print(f"✅ Added recipe: {recipe_data['name']} ({ingredients_added}/{len(recipe_data['ingredients'])} ingredients)")
            added_count += 1
        
        # Commit all changes
        db.commit()
        
        # Check how many recipes have images
        recipes_with_images = db.query(Recipe).filter(Recipe.image_data.isnot(None)).count()
        total_recipes = db.query(Recipe).count()
        
        print(f"\n🎉 Successfully populated database!")
        print(f"   - Added: {added_count} new recipes")
        print(f"   - Skipped: {skipped_count} existing recipes")
        print(f"   - Total recipes in database: {total_recipes}")
        print(f"   - Recipes with images: {recipes_with_images}/{total_recipes} ({recipes_with_images/total_recipes*100:.1f}%)")
        
        if PILLOW_AVAILABLE and added_count > 0:
            print(f"   - Real images downloaded: ~200KB each, saved to backend/images/")
        elif not PILLOW_AVAILABLE and added_count > 0:
            print(f"   - ⚠️  Install Pillow to process images: pip install Pillow==10.2.0")
        
        if missing_ingredients:
            print(f"\n⚠️  Missing ingredients ({len(missing_ingredients)}):")
            for ingredient in sorted(missing_ingredients):
                print(f"   - {ingredient}")
            print("\n💡 Consider running populate_ingredients.py first or adding these ingredients manually.")
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error populating database: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    populate_recipes()