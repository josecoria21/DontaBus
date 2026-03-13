-- Add vehicle_type and image_url columns to routes table
ALTER TABLE routes ADD COLUMN vehicle_type TEXT DEFAULT NULL;
ALTER TABLE routes ADD COLUMN image_url TEXT DEFAULT NULL;
