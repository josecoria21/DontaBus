-- Incremental route-stop linking for field mapper
-- Unlike save_stops_data which deletes-and-replaces everything,
-- this function UPSERTs individual links collected in the field.
CREATE OR REPLACE FUNCTION add_route_stop_links(
  secret TEXT,
  links  JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stored_secret TEXT;
  link          JSONB;
  cnt_inserted  INT := 0;
  cnt_skipped   INT := 0;
  v_route_key   TEXT;
  v_stop_id     INT;
  v_sequence    INT;
BEGIN
  -- Verify admin secret
  SELECT value INTO stored_secret FROM app_config WHERE key = 'admin_secret';
  IF stored_secret IS NULL OR stored_secret != secret THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid admin secret');
  END IF;

  -- Process each link in the array
  FOR link IN SELECT * FROM jsonb_array_elements(links)
  LOOP
    v_route_key := link->>'route_key';
    v_stop_id   := (link->>'stop_id')::INT;
    v_sequence  := (link->>'sequence')::INT;

    -- Validate FK existence
    IF NOT EXISTS (SELECT 1 FROM routes WHERE route_key = v_route_key) THEN
      cnt_skipped := cnt_skipped + 1;
      CONTINUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM stops WHERE stop_id = v_stop_id) THEN
      cnt_skipped := cnt_skipped + 1;
      CONTINUE;
    END IF;

    -- UPSERT into route_stops
    INSERT INTO route_stops (route_key, stop_id, sequence, travel_time, dwell_time)
    VALUES (v_route_key, v_stop_id, v_sequence, 0, 0)
    ON CONFLICT (route_key, sequence) DO UPDATE
      SET stop_id = EXCLUDED.stop_id;

    -- UPSERT into stop_routes
    INSERT INTO stop_routes (stop_id, route_key)
    VALUES (v_stop_id, v_route_key)
    ON CONFLICT (stop_id, route_key) DO NOTHING;

    cnt_inserted := cnt_inserted + 1;
  END LOOP;

  -- Update num_routes on all affected stops
  UPDATE stops s
  SET num_routes = (
    SELECT COUNT(*) FROM stop_routes sr WHERE sr.stop_id = s.stop_id
  )
  WHERE s.stop_id IN (
    SELECT (l->>'stop_id')::INT FROM jsonb_array_elements(links) l
  );

  RETURN jsonb_build_object(
    'success', true,
    'inserted', cnt_inserted,
    'skipped', cnt_skipped
  );
END;
$$;
