-- Migration to add image_data column to recipes table in Supabase
-- This should be run in the Supabase SQL Editor

-- Add image_data column to recipes table
ALTER TABLE recipes 
ADD COLUMN image_data TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN recipes.image_data IS 'Base64 encoded image data for recipe thumbnails (~200KB each)';

-- Optional: Create an index if you plan to filter by recipes with/without images
CREATE INDEX recipes_has_image_idx ON recipes 
((CASE WHEN image_data IS NOT NULL AND image_data != '' THEN 1 ELSE 0 END));

-- Verify the migration
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'recipes' 
AND table_schema = 'public'
ORDER BY ordinal_position; 