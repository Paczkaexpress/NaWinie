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
# Unit types must match the UnitType enum: "ml", "g", "szt"
SAMPLE_INGREDIENTS = [
    # Basic liquids and pantry staples
    ("Woda", "ML"),
    ("Sól kuchenna", "G"),
    ("Cukier biały", "G"),
    ("Pieprz czarny mielony", "G"),
    ("Oliwa z oliwek", "ML"),
    ("Masło", "G"),
    ("Mąka pszenna", "G"),
    ("Jajka", "SZT"),
    ("Mleko krowie", "ML"),
    
    # Vegetables (fresh)
    ("Cebula", "SZT"),
    ("Czosnek", "SZT"),
    ("Papryka czerwona", "SZT"),
    ("Papryka zielona", "SZT"),
    ("Papryka żółta", "SZT"),
    ("Papryka pomarańczowa", "SZT"),
    ("Pomidor", "SZT"),
    ("Pomidory cherry", "G"),
    ("Pomidory koktajlowe", "G"),
    ("Marchewka", "SZT"),
    ("Marchewka mini", "G"),
    ("Pietruszka (korzeń)", "SZT"),
    ("Pietruszka (natka)", "G"),
    ("Seler", "SZT"),
    ("Ziemniaki", "G"),
    ("Cebula dymka", "G"),
    ("Szczypiorek", "G"),
    ("Por", "SZT"),
    ("Rzepa", "SZT"),
    ("Buraki", "SZT"),
    ("Buraki ćwikłowe", "G"),
    ("Dynia", "G"),
    ("Ogórek", "SZT"),
    ("Cukinia", "SZT"),
    ("Bakłażan", "SZT"),
    ("Bakłażan chiński (lilia)", "SZT"),
    ("Kapusta biała", "G"),
    ("Kapusta czerwona", "G"),
    ("Kapusta pekińska", "G"),
    ("Kapusta włoska", "G"),
    ("Brokuł", "SZT"),
    ("Kalafior", "SZT"),
    ("Kalarepa", "SZT"),
    ("Kalarepa fioletowa", "SZT"),
    ("Szpinak", "G"),
    ("Jarmuż", "G"),
    ("Rukola", "G"),
    ("Sałata lodowa", "SZT"),
    ("Sałata masłowa", "SZT"),
    ("Endywia", "G"),
    ("Roszponka", "G"),
    ("Radicchio", "G"),
    ("Cykoria", "G"),
    ("Brukselka", "G"),
    ("Szparagi", "G"),
    ("Zielony groszek", "G"),
    ("Fasolka szparagowa", "G"),
    ("Kukurydza (ziarna)", "G"),
    ("Kukurydza cukrowa", "SZT"),
    ("Batat (słodki ziemniak)", "G"),
    ("Taro", "G"),
    ("Maniok", "G"),
    ("Yuca", "G"),
    ("Pasternak", "SZT"),
    ("Topinambur", "G"),
    ("Rzodkiewka", "G"),
    ("Rzodkiew (długi biały)", "SZT"),
    ("Rzepa chińska (daikon)", "SZT"),
    ("Jicama", "G"),
    
    # Grains and cereals
    ("Ryż biały", "G"),
    ("Ryż brązowy", "G"),
    ("Ryż jaśminowy", "G"),
    ("Ryż basmati", "G"),
    ("Ryż parboiled", "G"),
    ("Ryż dziki", "G"),
    ("Ryż arborio", "G"),
    ("Makaron pszenny", "G"),
    ("Makaron pełnoziarnisty", "G"),
    ("Kasza gryczana", "G"),
    ("Kasza jęczmienna", "G"),
    ("Kasza jaglana", "G"),
    ("Kasza kuskus", "G"),
    ("Kasza manna", "G"),
    ("Kasza bulgur", "G"),
    ("Quinoa", "G"),
    ("Amarantus", "G"),
    ("Teff", "G"),
    ("Einkorn (starożytna pszenica)", "G"),
    ("Emmer (starożytna pszenica)", "G"),
    ("Orkisz", "G"),
    ("Pszenica durum", "G"),
    ("Gryka ekologiczna", "G"),
    ("Couscous perłowy (izraelski)", "G"),
    ("Bulgur drobny", "G"),
    ("Semolina", "G"),
    ("Polenta", "G"),
    
    # Legumes
    ("Soczewica czerwona", "G"),
    ("Soczewica zielona", "G"),
    ("Ciecierzyca", "G"),
    ("Fasola biała", "G"),
    ("Fasola czerwona", "G"),
    ("Groch", "G"),
    
    # Meat and poultry
    ("Kurczak (filet)", "G"),
    ("Wołowina (stek)", "G"),
    ("Wieprzowina (schab)", "G"),
    ("Boczek", "G"),
    ("Boczek wędzony", "G"),
    ("Szynka gotowana", "G"),
    ("Szynka parmeńska", "G"),
    ("Szynka serrano", "G"),
    ("Mięso mielone (wołowe)", "G"),
    ("Baranina (udziec)", "G"),
    ("Jagnięcina", "G"),
    ("Dziczyzna (sarnina)", "G"),
    ("Dziczyzna (dzik)", "G"),
    ("Królik", "G"),
    ("Indyk (filet)", "G"),
    ("Kaczka", "G"),
    ("Gęś", "G"),
    ("Kiełbasa wiejska", "G"),
    ("Kiełbasa krakowska", "G"),
    ("Kiełbasa biała", "G"),
    ("Kiełbasa śląska", "G"),
    ("Salami", "G"),
    ("Pepperoni", "G"),
    ("Chorizo", "G"),
    ("Mortadela", "G"),
    ("Pasztet (domowy)", "G"),
    ("Parówki", "G"),
    
    # Fish and seafood
    ("Łosoś", "G"),
    ("Dorsz", "G"),
    ("Tuńczyk (świeży)", "G"),
    ("Tuńczyk w puszce", "G"),
    ("Krewetki", "G"),
    ("Małże", "G"),
    ("Ostrygi", "G"),
    ("Anchovies (anszua)", "G"),
    ("Sardynki w oleju", "G"),
    ("Makrela wędzona", "G"),
    ("Śledź w oleju", "G"),
    
    # Dairy products
    ("Jogurt naturalny", "G"),
    ("Śmietana 30%", "ML"),
    ("Ser żółty", "G"),
    ("Twaróg (biały ser)", "G"),
    ("Mozzarella", "G"),
    ("Parmezan", "G"),
    ("Kefir", "ML"),
    ("Serek homogenizowany", "G"),
    ("Serek wiejski", "G"),
    ("Ricotta", "G"),
    ("Mascarpone", "G"),
    ("Gorgonzola", "G"),
    ("Camembert", "G"),
    ("Brie", "G"),
    ("Feta", "G"),
    ("Halloumi", "G"),
    ("Chèvre (kozi ser)", "G"),
    ("Gouda", "G"),
    ("Edam", "G"),
    ("Emmentaler", "G"),
    ("Gruyère", "G"),
    ("Cheddar", "G"),
    ("Red Leicester", "G"),
    ("Stilton", "G"),
    ("Roquefort", "G"),
    ("Tilsit", "G"),
    ("Jarlsberg", "G"),
    ("Serek mascarpone", "G"),
    ("Serek ricotta", "G"),
    ("Skyr", "G"),
    ("Labneh", "G"),
    ("Clotted cream", "G"),
    ("Cream cheese", "G"),
    
    # Alternative milks
    ("Mleko kokosowe", "ML"),
    ("Mleko migdałowe", "ML"),
    ("Mleko sojowe", "ML"),
    ("Mleko skondensowane", "ML"),
    ("Mleko skondensowane słodzone", "ML"),
    ("Mleko w proszku", "G"),
    
    # Plant-based proteins
    ("Tofu", "G"),
    ("Tempeh", "G"),
    
    # Baking ingredients
    ("Drożdże świeże", "G"),
    ("Drożdże suszone", "G"),
    ("Skrobia kukurydziana", "G"),
    ("Skrobia ziemniaczana", "G"),
    ("Bułka tarta", "G"),
    ("Bułka tarta bezglutenowa", "G"),
    ("Żelatyna", "G"),
    ("Agar-agar", "G"),
    ("Xanthan gum", "G"),
    ("Guar gum", "G"),
    ("Arrowroot powder", "G"),
    
    # Flours
    ("Mąka kukurydziana", "G"),
    ("Mąka ryżowa", "G"),
    ("Mąka migdałowa", "G"),
    ("Mąka kokosowa", "G"),
    ("Mąka z ciecierzycy", "G"),
    ("Mąka ziemniaczana", "G"),
    ("Mąka żytnia", "G"),
    ("Mąka bezglutenowa (mieszanka)", "G"),
    ("Chickpea flour (mąka z ciecierzycy)", "G"),
    ("Gram flour (besan)", "G"),
    
    # Cereals and flakes
    ("Płatki owsiane", "G"),
    ("Płatki kukurydziane", "G"),
    ("Płatki gryczane", "G"),
    ("Płatki ryżowe", "G"),
    ("Płatki amarantusowe", "G"),
    ("Płatki jaglane", "G"),
    ("Płatki quinoi", "G"),
    ("Panko", "G"),
    
    # Breads and wraps
    ("Chleb pszenny", "G"),
    ("Chleb razowy", "G"),
    ("Bułki pszenne", "SZT"),
    ("Tortilla", "SZT"),
    ("Tortilla pszenna", "SZT"),
    ("Tortilla kukurydziana", "SZT"),
    ("Lavash", "SZT"),
    ("Pita", "SZT"),
    ("Naan", "SZT"),
    ("Chapati", "SZT"),
    ("Kulcha", "SZT"),
    ("Wrapy", "SZT"),
    ("Taralli (włoskie krążki)", "G"),
    ("Grissini (paluszki chlebowe)", "G"),
    ("Croutons", "G"),
    ("Nachos", "G"),
    ("Tortilla chips", "G"),
    
    # Ready-made doughs
    ("Kruche ciasto francuskie (gotowe)", "G"),
    ("Ciasto filo", "G"),
    ("Ciasto na pizzę (gotowe)", "G"),
    ("Biszkopt (gotowy)", "G"),
    ("Półkruche ciasto (gotowe)", "G"),
    ("Ciasto drożdżowe (gotowe)", "G"),
    ("Samosa (ciasto)", "G"),
    ("Empanada (ciasto)", "G"),
    
    # Sauces and condiments
    ("Maggi (płynny koncentrat)", "ML"),
    ("Sos sojowy", "ML"),
    ("Sos Worcestershire", "ML"),
    ("Sos słodko-kwaśny", "ML"),
    ("Sos rybny", "ML"),
    ("Ketchup", "ML"),
    ("Musztarda", "G"),
    ("Majonez", "G"),
    ("Mirin", "ML"),
    ("Miso (pasta sojowa)", "G"),
    ("Harissa", "G"),
    ("Bulgogi (marynata koreańska)", "ML"),
    ("Gochujang (pasta chilli)", "G"),
    ("Pasta curry czerwona", "G"),
    ("Pasta curry zielona", "G"),
    ("Pasta curry żółta", "G"),
    ("Laksa paste", "G"),
    ("Tamarin (koncentrat)", "G"),
    
    # Vinegars
    ("Ocet winny", "ML"),
    ("Ocet balsamiczny", "ML"),
    ("Ocet jabłkowy", "ML"),
    ("Ocet ryżowy", "ML"),
    
    # Sweeteners
    ("Miód", "G"),
    ("Syrop klonowy", "ML"),
    ("Syrop kukurydziany", "ML"),
    ("Syrop agawy", "ML"),
    ("Syrop ryżowy", "ML"),
    ("Syrop daktylowy", "ML"),
    ("Syrop buraczany", "ML"),
    ("Dulce de leche", "G"),
    ("Melasa", "ML"),
    ("Cukier puder", "G"),
    ("Cukier brązowy", "G"),
    ("Cukier trzcinowy", "G"),
    ("Cukier kokosowy", "G"),
    ("Cukier muscovado", "G"),
    ("Cukier wintowy", "G"),
    ("Stewia (słodzik)", "G"),
    ("Ksylitol", "G"),
    ("Erytrytol", "G"),
    ("Sorbitol", "G"),
    ("Maltodekstryna", "G"),
    ("Dekstroza", "G"),
    ("Laktoza", "G"),
    ("Galaktoza", "G"),
    ("Fruktoza", "G"),
    
    # Chocolate and cocoa
    ("Czekolada gorzka", "G"),
    ("Czekolada mleczna", "G"),
    ("Czekolada biała", "G"),
    ("Czekolada Ruby", "G"),
    ("Gorzka czekolada 90%", "G"),
    ("Czekolada z nadzieniem owocowym", "G"),
    ("Czekoladowe chipsy", "G"),
    ("Kakao w proszku", "G"),
    ("Surowe kakao (nibs)", "G"),
    
    # Vanilla and extracts
    ("Wanilia (laska)", "SZT"),
    ("Wanilia (ekstrakt)", "ML"),
    
    # Spices - whole
    ("Cynamon (laska)", "SZT"),
    ("Goździki", "G"),
    ("Gałka muszkatołowa", "SZT"),
    ("Imbir świeży", "G"),
    ("Liść laurowy", "SZT"),
    ("Anyż gwiaździsty", "SZT"),
    ("Kardamon", "G"),
    ("Ziarna pieprzu różowego", "G"),
    ("Pieprz czarny w ziarnach", "G"),
    ("Kolendra (nasiona)", "G"),
    ("Koper włoski (nasiona)", "G"),
    ("Nasiona kopru włoskiego", "G"),
    ("Nasiona kminku", "G"),
    ("Nasiona kolendry", "G"),
    ("Nasiona anyżu", "G"),
    ("Nasiona czarnuszki", "G"),
    ("Nasiona fenkułu", "G"),
    ("Nasiona gorczycy", "G"),
    
    # Spices - ground
    ("Cynamon mielony", "G"),
    ("Imbir mielony", "G"),
    ("Kurkuma", "G"),
    ("Curry w proszku", "G"),
    ("Papryka wędzona", "G"),
    ("Papryka słodka mielona", "G"),
    ("Chilli w płatkach", "G"),
    ("Chili con carne (przyprawa)", "G"),
    ("Oregano", "G"),
    ("Majeranek", "G"),
    ("Szałwia", "G"),
    ("Pieprz zielony", "G"),
    ("Pieprz biały", "G"),
    ("Za'atar", "G"),
    ("Sumak", "G"),
    ("Ras el hanout", "G"),
    ("Baharat", "G"),
    ("Szafran", "G"),
    
    # Fresh herbs
    ("Kolendra (świeża)", "G"),
    ("Koperek (świeży)", "G"),
    ("Estragon", "G"),
    ("Tymiankek", "G"),
    ("Rozmaryn", "G"),
    ("Bazylia (świeża)", "G"),
    ("Bazylia (suszona)", "G"),
    ("Fenkuł (koper włoski świeży)", "G"),
    
    # Hot peppers and sauces
    ("Papryczki jalapeño", "G"),
    ("Papryczki habanero", "G"),
    ("Tabasco", "ML"),
    ("Wasabi (korzeń)", "G"),
    
    # Preserved and canned items
    ("Kapary", "G"),
    ("Oliwki czarne", "G"),
    ("Oliwki zielone", "G"),
    ("Oliwki kalamata", "G"),
    ("Oliwki zielone bez pestek", "G"),
    ("Kapusta kiszona", "G"),
    ("Ogórki kiszone", "G"),
    ("Ogórek kiszony japoński", "G"),
    ("Papryka konserwowa", "G"),
    ("Kimchi", "G"),
    ("Przecier pomidorowy", "G"),
    ("Pasta pomidorowa", "G"),
    ("Pomidory suszone", "G"),
    ("Pomidory w puszce", "G"),
    ("Pomidory suszone w oleju", "G"),
    ("Koncentrat pomidorowy 70%", "G"),
    ("Koncentrat pomidorowy 30%", "G"),
    ("Passata pomidorowa", "G"),
    
    # Mushrooms
    ("Grzyby pieczarki", "G"),
    ("Grzyby borowiki", "G"),
    ("Grzyby podgrzybki", "G"),
    ("Grzyby kurki", "G"),
    ("Shitake (suszone)", "G"),
    ("Shitake (świeże)", "G"),
    ("Enoki", "G"),
    ("Maitake", "G"),
    
    # Dried fruits
    ("Śliwki suszone", "G"),
    ("Śliwki suszone węgierki", "G"),
    ("Morele suszone", "G"),
    ("Rodzynki", "G"),
    ("Żurawina suszona", "G"),
    ("Suszone mango", "G"),
    ("Suszone banany", "G"),
    ("Suszone jabłka", "G"),
    ("Suszone gruszki", "G"),
    ("Kandyzowane owoce", "G"),
    ("Kandyzowana skórka pomarańczy", "G"),
    ("Kandyzowana skórka cytrynowa", "G"),
    ("Kandyzowany imbir", "G"),
    ("Daktyle", "G"),
    
    # Fresh fruits
    ("Winogrona (zielone)", "G"),
    ("Winogrona (ciemne)", "G"),
    ("Jabłka", "SZT"),
    ("Gruszki", "SZT"),
    ("Śliwki", "SZT"),
    ("Brzoskwinie", "SZT"),
    ("Brzoskwinie świeże", "SZT"),
    ("Nektarynki", "SZT"),
    ("Necktarynki świeże", "SZT"),
    ("Truskawki", "G"),
    ("Maliny", "G"),
    ("Jagody", "G"),
    ("Borówki amerykańskie", "G"),
    ("Jeżyny", "G"),
    ("Cytryna", "SZT"),
    ("Limetka", "SZT"),
    ("Pomarańcza", "SZT"),
    ("Grejpfrut", "SZT"),
    ("Mandarynka", "SZT"),
    ("Klementynka", "SZT"),
    ("Banan", "SZT"),
    ("Morele świeże", "SZT"),
    ("Figi", "SZT"),
    
    # Tropical fruits
    ("Papaja", "SZT"),
    ("Papaja zielona (na sałatki)", "G"),
    ("Mango", "SZT"),
    ("Ananas", "SZT"),
    ("Kiwi", "SZT"),
    ("Awokado", "SZT"),
    ("Granat", "SZT"),
    ("Kokos (miąższ)", "G"),
    ("Guawa", "SZT"),
    ("Kaktus (opuncja)", "SZT"),
    ("Gujawa", "SZT"),
    ("Liczi", "G"),
    ("Rambutan", "G"),
    ("Karambola (gwiazda)", "SZT"),
    
    # Melons
    ("Melon żółty", "SZT"),
    ("Melon kantalupa", "SZT"),
    ("Arbuz", "SZT"),
    
    # Coconut products
    ("Kokos (woda)", "ML"),
    
    # Oils and fats
    ("Masło klarowane (ghee)", "G"),
    ("Smalec", "G"),
    ("Tłuszcz gęsi", "G"),
    ("Olej rzepakowy", "ML"),
    ("Olej słonecznikowy", "ML"),
    ("Olej z awokado", "ML"),
    ("Olej z pestek winogron", "ML"),
    ("Olej z orzechów włoskich", "ML"),
    ("Olej sezamowy", "ML"),
    ("Olej kokosowy", "ML"),
    
    # Nut and seed butters
    ("Masło orzechowe", "G"),
    ("Masło migdałowe", "G"),
    ("Pasta tahini", "G"),
    ("Pasta z słonecznika", "G"),
    ("Pasta z orzechów nerkowca", "G"),
    
    # Nuts
    ("Orzechy włoskie", "G"),
    ("Orzechy laskowe", "G"),
    ("Orzechy nerkowca", "G"),
    ("Orzechy ziemne", "G"),
    ("Migdały", "G"),
    ("Pistacje", "G"),
    ("Orzechy brazylijskie", "G"),
    ("Orzechy makadamia", "G"),
    ("Orzechy piniowe", "G"),
    
    # Seeds
    ("Nasiona chia", "G"),
    ("Nasiona lnu", "G"),
    ("Siemię lniane", "G"),
    ("Nasiona sezamu", "G"),
    ("Nasiona słonecznika", "G"),
    ("Nasiona dyni", "G"),
    ("Nasiona konopi", "G"),
    ("Nasiona ostropestu", "G"),
    ("Sacha inchi (nasiona)", "G"),
    
    # Stock and bouillon
    ("Bulion warzywny (kostka)", "SZT"),
    ("Bulion mięsny (kostka)", "SZT"),
    
    # Asian noodles and ingredients
    ("Udon", "G"),
    ("Soba", "G"),
    ("Ramen (makaron)", "G"),
    ("Rice paper (papier ryżowy)", "SZT"),
    ("Nori (wodorosty)", "G"),
    ("Wakame", "G"),
    ("Kombu", "G"),
    ("Risotto (gotowa mieszanka)", "G"),
    
    # Beverages and alcohols (for cooking)
    ("Kwas chlebowy", "ML"),
    ("Piwo (do gotowania)", "ML"),
    ("Wino czerwone (do gotowania)", "ML"),
    ("Wino białe (do gotowania)", "ML"),
    ("Likier pomarańczowy (np. Cointreau)", "ML"),
    ("Sherry", "ML"),
    ("Rum (do deserów)", "ML"),
    ("Whisky (do deserów)", "ML"),
    ("Wódka (do ekstraktów)", "ML"),
    
    # Cream and toppings
    ("Kremówka (bita śmietana)", "G"),
    ("Bita śmietana w sprayu", "ML"),
    ("Krem pâtissière", "G"),
    ("Krem ganache", "G"),
    ("Polewa czekoladowa", "G"),
    ("Polewa karmelowa", "G"),
    
    # Snacks and granola
    ("Mieszanka bakalii", "G"),
    ("Granola", "G"),
    ("Musli", "G"),
    ("Trail mix", "G"),
    ("Gachas (owsianka hiszpańska)", "G"),
    ("Mazedon (kasza manna z miodem)", "G"),
    
    # Superfoods and supplements
    ("Acai", "G"),
    ("Spirulina", "G"),
    ("Młody jęczmień (proszek)", "G"),
    ("Młody zielony jęczmień", "G"),
    ("Matcha (proszek)", "G"),
    ("Odżywka białkowa (smak waniliowy)", "G"),
    ("Odżywka białkowa (smak czekoladowy)", "G"),
    
    # Teas and coffees
    ("Yerba mate", "G"),
    ("Herbata czarna", "G"),
    ("Herbata zielona", "G"),
    ("Herbata oolong", "G"),
    ("Herbata biała", "G"),
    ("Herbata rooibos", "G"),
    ("Kawa arabika", "G"),
    ("Kawa robusta", "G"),
    ("Espresso (skondensowane)", "ML"),
    
    # Missing ingredients from recipes
    ("Drożdże instant", "G"),
    ("Koncentrat pomidorowy", "G"),
    ("Mięta świeża", "G"),
    ("Proszek do pieczenia", "G"),
    ("Płatki chili", "G"),
    ("Rozmaryn suszony", "G"),
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