-- Clear all route data from the database (keeps stops intact)
-- Run this in the Supabase SQL editor

-- Delete in FK-safe order
DELETE FROM tracking_sessions;
DELETE FROM route_stops;
DELETE FROM stop_routes;
DELETE FROM verified_routes;
DELETE FROM routes;
