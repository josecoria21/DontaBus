-- Verified routes: tracks which routes have been field-verified
CREATE TABLE verified_routes (
  route_key TEXT PRIMARY KEY,
  verified_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE verified_routes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON verified_routes FOR SELECT USING (true);

-- Returns TEXT[] of verified route keys
CREATE OR REPLACE FUNCTION get_verified_routes()
RETURNS TEXT[] LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COALESCE(array_agg(route_key), ARRAY[]::TEXT[]) FROM verified_routes;
$$;

-- Toggle verification (admin-secret gated)
CREATE OR REPLACE FUNCTION set_route_verified(secret TEXT, p_route_key TEXT, p_verified BOOLEAN)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE stored TEXT;
BEGIN
  SELECT value INTO stored FROM app_config WHERE key = 'admin_secret';
  IF stored IS NULL OR stored != secret THEN
    RETURN '{"success":false,"error":"Invalid secret"}'::jsonb;
  END IF;
  IF p_verified THEN
    INSERT INTO verified_routes(route_key) VALUES (p_route_key) ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM verified_routes WHERE route_key = p_route_key;
  END IF;
  RETURN '{"success":true}'::jsonb;
END;
$$;
