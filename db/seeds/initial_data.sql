-- Sample data for Na Winie (Grab & Cook) application
-- Assumes users with these UUIDs exist in auth.users
-- Replace with actual user UUIDs from your auth setup if needed
-- User 1: user1@example.com (UUID: 00000000-0000-0000-0000-000000000001)
-- User 2: user2@example.com (UUID: 00000000-0000-0000-0000-000000000002)
-- User 3: user3@example.com (UUID: 00000000-0000-0000-0000-000000000003)

-- Insert Users (assuming corresponding entries in auth.users)
insert into users (id, email) values 
('00000000-0000-0000-0000-000000000001', 'user1@example.com'),
('00000000-0000-0000-0000-000000000002', 'user2@example.com'),
('00000000-0000-0000-0000-000000000003', 'user3@example.com')
on conflict (id) do nothing; -- Avoid error if users already exist

-- Insert Ingredients
insert into ingredients (id, name, unit_type) values 
('10000000-0000-0000-0000-000000000001', 'Flour', 'g'),
('10000000-0000-0000-0000-000000000002', 'Sugar', 'g'),
('10000000-0000-0000-0000-000000000003', 'Eggs', 'szt'),
('10000000-0000-0000-0000-000000000004', 'Milk', 'ml'),
('10000000-0000-0000-0000-000000000005', 'Butter', 'g'),
('10000000-0000-0000-0000-000000000006', 'Salt', 'g'),
('10000000-0000-0000-0000-000000000007', 'Pepper', 'g'),
('10000000-0000-0000-0000-000000000008', 'Chicken Breast', 'g'),
('10000000-0000-0000-0000-000000000009', 'Onion', 'szt'),
('10000000-0000-0000-0000-000000000010', 'Garlic', 'szt'),
('10000000-0000-0000-0000-000000000011', 'Olive Oil', 'ml'),
('10000000-0000-0000-0000-000000000012', 'Tomatoes', 'g'),
('10000000-0000-0000-0000-000000000013', 'Pasta', 'g'),
('10000000-0000-0000-0000-000000000014', 'Water', 'ml') -- Added water
on conflict (name) do nothing; -- Avoid errors if ingredients exist

-- Insert Default Ingredients
insert into default_ingredients (ingredient_id) values 
('10000000-0000-0000-0000-000000000006'), -- Salt
('10000000-0000-0000-0000-000000000007'), -- Pepper
('10000000-0000-0000-0000-000000000014')  -- Water
on conflict (ingredient_id) do nothing;

-- Insert User Default Ingredients (User 1 has Salt and Pepper, User 2 has Salt)
insert into user_default_ingredients (user_id, ingredient_id) values 
('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006'), -- User 1, Salt
('00000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000007'), -- User 1, Pepper
('00000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000006')  -- User 2, Salt
on conflict (user_id, ingredient_id) do nothing;

-- Insert Recipes
insert into recipes (id, name, preparation_time_minutes, complexity_level, steps, author_id, average_rating, total_votes) values 
('20000000-0000-0000-0000-000000000001', 'Simple Pancakes', 20, 'EASY', '[
    {"step": 1, "description": "Mix flour, sugar, and a pinch of salt in a bowl."},
    {"step": 2, "description": "Whisk in egg and milk until smooth."},
    {"step": 3, "description": "Melt butter in a pan over MEDIUM heat."},
    {"step": 4, "description": "Pour batter onto the pan and cook until bubbles form, then flip and cook the other side."},
    {"step": 5, "description": "Serve warm."}
]', '00000000-0000-0000-0000-000000000001', 4.5, 15),
('20000000-0000-0000-0000-000000000002', 'Chicken Stir-Fry', 35, 'MEDIUM', '[
    {"step": 1, "description": "Cut chicken breast into strips."},
    {"step": 2, "description": "Chop onion and garlic."},
    {"step": 3, "description": "Heat olive oil in a wok or large pan."},
    {"step": 4, "description": "Stir-fry chicken until cooked through."},
    {"step": 5, "description": "Add onion and garlic, cook until softened."},
    {"step": 6, "description": "Add desired vegetables (e.g., chopped tomatoes) and stir-fry sauce."},
    {"step": 7, "description": "Serve immediately, optionally over rice."}
]', '00000000-0000-0000-0000-000000000002', 4.2, 25),
('20000000-0000-0000-0000-000000000003', 'Basic Tomato Pasta', 25, 'EASY', '[
    {"step": 1, "description": "Cook pasta according to package directions."},
    {"step": 2, "description": "While pasta cooks, heat olive oil in a pan."},
    {"step": 3, "description": "Sauté chopped garlic until fragrant."},
    {"step": 4, "description": "Add chopped tomatoes (or canned tomatoes), salt, and pepper. Simmer for 10-15 minutes."},
    {"step": 5, "description": "Drain pasta and toss with the tomato sauce."},
    {"step": 6, "description": "Serve topped with optional cheese."}
]', '00000000-0000-0000-0000-000000000001', 3.8, 10)
on conflict (id) do nothing;

-- Insert Recipe Ingredients
-- Pancakes
insert into recipe_ingredients (recipe_id, ingredient_id, amount, is_optional) values 
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 150, false), -- Flour
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 25, false),  -- Sugar
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 1, false),   -- Egg
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 200, false), -- Milk
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 20, false),  -- Butter
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', 2, true)    -- Salt (Optional pinch)
on conflict (recipe_id, ingredient_id) do nothing;

-- Chicken Stir-Fry
insert into recipe_ingredients (recipe_id, ingredient_id, amount, is_optional, substitute_recommendation) values 
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000008', 300, false, null), -- Chicken Breast
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000009', 1, false, null),   -- Onion
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000010', 2, false, null),   -- Garlic
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000011', 30, false, 'Vegetable Oil'), -- Olive Oil
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000012', 150, true, 'Bell Peppers'), -- Tomatoes (Optional)
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000006', 3, false, null),  -- Salt
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000007', 2, true, null)   -- Pepper (Optional)
on conflict (recipe_id, ingredient_id) do nothing;

-- Basic Tomato Pasta
insert into recipe_ingredients (recipe_id, ingredient_id, amount, is_optional) values 
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000013', 250, false), -- Pasta
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000011', 20, false),  -- Olive Oil
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000010', 2, false),   -- Garlic
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000012', 400, false), -- Tomatoes
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000006', 5, false),  -- Salt
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000007', 2, true)   -- Pepper (Optional)
on conflict (recipe_id, ingredient_id) do nothing;

-- Insert Recipe Views (Simulated)
insert into recipe_views (user_id, recipe_id, view_start, view_end) values 
('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', now() - interval '2 hours', now() - interval '1 hour 55 minutes'),
('00000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', now() - interval '1 day', now() - interval '1 day' + interval '10 minutes'),
('00000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', now() - interval '30 minutes', null), -- Ongoing view
('00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', now() - interval '5 hours', now() - interval '4 hours 50 minutes');

-- Insert Ingredient Popularity (Simulated)
-- Using the increment function would be better in practice, but direct insert for seeding:
insert into ingredient_popularity (ingredient_id, search_count) values 
('10000000-0000-0000-0000-000000000001', 50), -- Flour
('10000000-0000-0000-0000-000000000003', 120),-- Eggs
('10000000-0000-0000-0000-000000000008', 250),-- Chicken Breast
('10000000-0000-0000-0000-000000000009', 80), -- Onion
('10000000-0000-0000-0000-000000000012', 95), -- Tomatoes
('10000000-0000-0000-0000-000000000006', 500),-- Salt (likely default/common)
('10000000-0000-0000-0000-000000000013', 150) -- Pasta
on conflict (ingredient_id) do update set 
    search_count = excluded.search_count,
    last_updated = now();

-- Refresh materialized view after seeding
-- select refresh_popular_ingredients(); 
-- Note: May need appropriate permissions or run as superuser depending on setup.

-- End of sample data 