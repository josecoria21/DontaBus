-- Admin config table (RLS enabled, no policies = no anon access)
CREATE TABLE app_config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Insert a placeholder admin secret (change this in production!)
INSERT INTO app_config (key, value) VALUES ('admin_secret', 'change-me-in-production');

-- Save stops data: verify secret, delete-and-replace all stop-related tables
CREATE OR REPLACE FUNCTION save_stops_data(
  secret        TEXT,
  stops_json    JSONB,
  stop_routes_json JSONB,
  route_stops_json JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stored_secret TEXT;
  cnt_stops     INT;
  cnt_stop_routes INT;
  cnt_route_stops INT;
BEGIN
  -- Verify admin secret
  SELECT value INTO stored_secret FROM app_config WHERE key = 'admin_secret';
  IF stored_secret IS NULL OR stored_secret != secret THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid admin secret');
  END IF;

  -- Delete in FK-safe order
  DELETE FROM route_stops WHERE true;
  DELETE FROM stop_routes WHERE true;
  DELETE FROM stops WHERE true;

  -- Insert stops from GeoJSON features array
  INSERT INTO stops (stop_id, original_count, num_routes, location)
  SELECT
    (f->>'stop_id')::INT,
    COALESCE((f->>'original_count')::INT, 1),
    COALESCE((f->>'num_routes')::INT, 0),
    ST_SetSRID(ST_MakePoint(
      (f->>'lng')::DOUBLE PRECISION,
      (f->>'lat')::DOUBLE PRECISION
    ), 4326)
  FROM jsonb_array_elements(stops_json) AS f;

  GET DIAGNOSTICS cnt_stops = ROW_COUNT;

  -- Insert stop_routes from array of {stop_id, route_key}
  -- Filter out route_keys that don't exist in routes table to avoid FK violations
  INSERT INTO stop_routes (stop_id, route_key)
  SELECT
    (r->>'stop_id')::INT,
    r->>'route_key'
  FROM jsonb_array_elements(stop_routes_json) AS r
  WHERE EXISTS (SELECT 1 FROM routes WHERE route_key = r->>'route_key');

  GET DIAGNOSTICS cnt_stop_routes = ROW_COUNT;

  -- Insert route_stops from array of {route_key, stop_id, sequence, travel_time, dwell_time}
  -- Filter out route_keys that don't exist in routes table to avoid FK violations
  INSERT INTO route_stops (route_key, stop_id, sequence, travel_time, dwell_time)
  SELECT
    r->>'route_key',
    (r->>'stop_id')::INT,
    (r->>'sequence')::INT,
    (r->>'travel_time')::INT,
    (r->>'dwell_time')::INT
  FROM jsonb_array_elements(route_stops_json) AS r
  WHERE EXISTS (SELECT 1 FROM routes WHERE route_key = r->>'route_key');

  GET DIAGNOSTICS cnt_route_stops = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'stops', cnt_stops,
    'stop_routes', cnt_stop_routes,
    'route_stops', cnt_route_stops
  );
END;
$$;

-- Load all stop data in a single round-trip
CREATE OR REPLACE FUNCTION get_stops_data()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'stops_features', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'stop_id', s.stop_id,
          'original_count', s.original_count,
          'num_routes', s.num_routes,
          'lng', ST_X(s.location),
          'lat', ST_Y(s.location)
        )
      ), '[]'::jsonb)
      FROM stops s
    ),
    'stop_routes', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'stop_id', sr.stop_id,
          'route_key', sr.route_key
        )
      ), '[]'::jsonb)
      FROM stop_routes sr
    ),
    'route_stops', (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'route_key', rs.route_key,
          'stop_id', rs.stop_id,
          'sequence', rs.sequence,
          'travel_time', rs.travel_time,
          'dwell_time', rs.dwell_time
        )
      ), '[]'::jsonb)
      FROM route_stops rs
    )
  ) INTO result;

  RETURN result;
END;
$$;
