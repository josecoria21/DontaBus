-- Save custom routes to the database (admin-secret gated)
-- Upserts routes: inserts new ones, updates existing ones by route_key
CREATE OR REPLACE FUNCTION save_routes_data(
  secret       TEXT,
  routes_json  JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stored_secret TEXT;
  cnt INT;
BEGIN
  -- Verify admin secret
  SELECT value INTO stored_secret FROM app_config WHERE key = 'admin_secret';
  IF stored_secret IS NULL OR stored_secret != secret THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid admin secret');
  END IF;

  -- Upsert each route
  INSERT INTO routes (route_key, route_num, route_type, direction, name)
  SELECT
    r->>'route_key',
    r->>'route_num',
    r->>'route_type',
    r->>'direction',
    r->>'name'
  FROM jsonb_array_elements(routes_json) AS r
  ON CONFLICT (route_key) DO UPDATE SET
    route_num  = EXCLUDED.route_num,
    route_type = EXCLUDED.route_type,
    direction  = EXCLUDED.direction,
    name       = EXCLUDED.name;

  GET DIAGNOSTICS cnt = ROW_COUNT;

  RETURN jsonb_build_object('success', true, 'routes_synced', cnt);
END;
$$;
