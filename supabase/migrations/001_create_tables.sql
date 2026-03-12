-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Routes: 152 route variants with LineString geometry
CREATE TABLE routes (
  id          SERIAL PRIMARY KEY,
  route_key   TEXT UNIQUE NOT NULL,
  route_num   TEXT NOT NULL,
  route_type  TEXT NOT NULL,
  direction   TEXT NOT NULL,
  name        TEXT NOT NULL,
  description TEXT,
  notes       TEXT,
  peak_am     INTEGER,
  midday      INTEGER,
  peak_pm     INTEGER,
  night       INTEGER,
  geometry    GEOMETRY(LineString, 4326)
);

-- Stops: 966 unique deduplicated bus stops
CREATE TABLE stops (
  id             SERIAL PRIMARY KEY,
  stop_id        INTEGER UNIQUE NOT NULL,
  original_count INTEGER DEFAULT 1,
  num_routes     INTEGER DEFAULT 0,
  location       GEOMETRY(Point, 4326) NOT NULL
);

-- Route-stop sequences with timing
CREATE TABLE route_stops (
  id          SERIAL PRIMARY KEY,
  route_key   TEXT NOT NULL REFERENCES routes(route_key),
  stop_id     INTEGER NOT NULL REFERENCES stops(stop_id),
  sequence    INTEGER NOT NULL,
  travel_time INTEGER,
  dwell_time  INTEGER,
  UNIQUE(route_key, sequence)
);

-- Reverse lookup: which routes serve each stop
CREATE TABLE stop_routes (
  stop_id   INTEGER NOT NULL REFERENCES stops(stop_id),
  route_key TEXT NOT NULL REFERENCES routes(route_key),
  PRIMARY KEY (stop_id, route_key)
);

-- Active tracking sessions
CREATE TABLE tracking_sessions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  route_key   TEXT NOT NULL REFERENCES routes(route_key),
  user_id     UUID NOT NULL,
  location    GEOMETRY(Point, 4326),
  heading     REAL,
  speed       REAL,
  accuracy    REAL,
  last_update TIMESTAMPTZ DEFAULT NOW(),
  started_at  TIMESTAMPTZ DEFAULT NOW(),
  is_active   BOOLEAN DEFAULT TRUE
);

-- Indexes
CREATE INDEX idx_routes_route_key ON routes(route_key);
CREATE INDEX idx_stops_stop_id ON stops(stop_id);
CREATE INDEX idx_route_stops_route_key ON route_stops(route_key);
CREATE INDEX idx_stop_routes_stop_id ON stop_routes(stop_id);
CREATE INDEX idx_tracking_active ON tracking_sessions(is_active, route_key) WHERE is_active = TRUE;
CREATE INDEX idx_tracking_last_update ON tracking_sessions(last_update) WHERE is_active = TRUE;

-- RLS policies
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE stop_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_sessions ENABLE ROW LEVEL SECURITY;

-- Public read for static data
CREATE POLICY "Public read routes" ON routes FOR SELECT USING (true);
CREATE POLICY "Public read stops" ON stops FOR SELECT USING (true);
CREATE POLICY "Public read route_stops" ON route_stops FOR SELECT USING (true);
CREATE POLICY "Public read stop_routes" ON stop_routes FOR SELECT USING (true);

-- Tracking sessions: users can insert/update their own, read all active
CREATE POLICY "Read active sessions" ON tracking_sessions
  FOR SELECT USING (is_active = TRUE);

CREATE POLICY "Insert own session" ON tracking_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Update own session" ON tracking_sessions
  FOR UPDATE USING (auth.uid() = user_id);
