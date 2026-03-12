-- Get live bus positions: median lat/lng grouped by route_key
CREATE OR REPLACE FUNCTION get_live_buses()
RETURNS TABLE (
  route_key TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  heading REAL,
  speed REAL,
  reporter_count BIGINT,
  last_update TIMESTAMPTZ
) AS $$
  SELECT
    ts.route_key,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ST_Y(ts.location)) AS lat,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY ST_X(ts.location)) AS lng,
    AVG(ts.heading)::REAL AS heading,
    AVG(ts.speed)::REAL AS speed,
    COUNT(*) AS reporter_count,
    MAX(ts.last_update) AS last_update
  FROM tracking_sessions ts
  WHERE ts.is_active = TRUE
    AND ts.last_update > NOW() - INTERVAL '2 minutes'
    AND ts.location IS NOT NULL
  GROUP BY ts.route_key;
$$ LANGUAGE sql STABLE;

-- Cleanup stale sessions (not updated in 2+ minutes)
CREATE OR REPLACE FUNCTION cleanup_stale_sessions()
RETURNS void AS $$
  UPDATE tracking_sessions
  SET is_active = FALSE
  WHERE is_active = TRUE
    AND last_update < NOW() - INTERVAL '2 minutes';
$$ LANGUAGE sql;
