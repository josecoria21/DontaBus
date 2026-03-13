import { supabase } from './supabase'
import type { StopFeature, StopRoutesData, RouteStopsData, RouteStopEntry, RouteFeature } from '../types'

const adminSecret = import.meta.env.VITE_ADMIN_SECRET || ''

export function isAdminConfigured(): boolean {
  return !!supabase && !!adminSecret
}

/** Flatten editor state into the flat arrays the RPC expects */
export async function saveStopsToSupabase(
  features: StopFeature[],
  stopRoutes: StopRoutesData,
  routeStops: RouteStopsData
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase not configured' }

  // Stops: flat array with stop_id, original_count, num_routes, lng, lat
  const stopsJson = features.map(f => ({
    stop_id: f.properties.stop_id,
    original_count: f.properties.original_count,
    num_routes: f.properties.num_routes,
    lng: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
  }))

  // Stop routes: flat array of {stop_id, route_key}
  const stopRoutesJson: { stop_id: number; route_key: string }[] = []
  for (const [stopId, routeKeys] of Object.entries(stopRoutes)) {
    for (const routeKey of routeKeys) {
      stopRoutesJson.push({ stop_id: Number(stopId), route_key: routeKey })
    }
  }

  // Route stops: flat array of {route_key, stop_id, sequence, travel_time, dwell_time}
  const routeStopsJson: { route_key: string; stop_id: number; sequence: number; travel_time: number; dwell_time: number }[] = []
  for (const [routeKey, entries] of Object.entries(routeStops)) {
    for (const entry of entries) {
      routeStopsJson.push({
        route_key: routeKey,
        stop_id: entry.stop_id,
        sequence: entry.sequence,
        travel_time: entry.travel_time,
        dwell_time: entry.dwell_time,
      })
    }
  }

  const { data, error } = await supabase.rpc('save_stops_data', {
    secret: adminSecret,
    stops_json: stopsJson,
    stop_routes_json: stopRoutesJson,
    route_stops_json: routeStopsJson,
  })

  if (error) return { success: false, error: error.message }
  if (data && !data.success) return { success: false, error: data.error }
  return { success: true }
}

export async function loadVerifiedRoutes(): Promise<Set<string>> {
  if (!supabase) return new Set()
  const { data, error } = await supabase.rpc('get_verified_routes')
  if (error || !data) return new Set()
  return new Set(data as string[])
}

export async function setRouteVerified(
  routeKey: string, isVerified: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase not configured' }
  const { data, error } = await supabase.rpc('set_route_verified', {
    secret: adminSecret, p_route_key: routeKey, p_is_verified: isVerified,
  })
  if (error) return { success: false, error: error.message }
  if (data && !data.success) return { success: false, error: data.error }
  return { success: true }
}

/** Load routes from Supabase */
export async function loadRoutesFromSupabase(): Promise<RouteFeature[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('routes').select('route_key, route_num, route_type, direction, name')
  if (error || !data) return []
  return data.map(r => ({
    type: 'Feature' as const,
    properties: {
      route_key: r.route_key,
      route_num: r.route_num,
      route_type: r.route_type,
      direction: r.direction,
      name: r.name,
      description: null,
      notes: null,
      peak_am: null,
      midday: null,
      peak_pm: null,
      night: null,
    },
    geometry: { type: 'LineString' as const, coordinates: [] as [number, number][] },
  }))
}

/** Sync custom routes to Supabase (upsert) */
export async function syncRoutesToSupabase(
  routes: RouteFeature[]
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) return { success: false, error: 'Supabase not configured' }

  const routesJson = routes.map(r => ({
    route_key: r.properties.route_key,
    route_num: r.properties.route_num,
    route_type: r.properties.route_type,
    direction: r.properties.direction,
    name: r.properties.name,
  }))

  const { data, error } = await supabase.rpc('save_routes_data', {
    secret: adminSecret,
    routes_json: routesJson,
  })

  if (error) return { success: false, error: error.message }
  if (data && !data.success) return { success: false, error: data.error }
  return { success: true }
}

/** Load all stops data from Supabase in one round-trip, or null on failure/empty */
export async function loadStopsFromSupabase(): Promise<{
  features: StopFeature[]
  stopRoutes: StopRoutesData
  routeStops: RouteStopsData
} | null> {
  if (!supabase) return null

  const { data, error } = await supabase.rpc('get_stops_data')
  if (error || !data) return null

  const raw = data as {
    stops_features: { stop_id: number; original_count: number; num_routes: number; lng: number; lat: number }[]
    stop_routes: { stop_id: number; route_key: string }[]
    route_stops: { route_key: string; stop_id: number; sequence: number; travel_time: number; dwell_time: number }[]
  }

  if (!raw.stops_features || raw.stops_features.length === 0) return null

  // Rebuild StopFeature[]
  const features: StopFeature[] = raw.stops_features.map(s => ({
    type: 'Feature' as const,
    properties: { stop_id: s.stop_id, original_count: s.original_count, num_routes: s.num_routes },
    geometry: { type: 'Point' as const, coordinates: [s.lng, s.lat] as [number, number] },
  }))

  // Rebuild StopRoutesData
  const stopRoutes: StopRoutesData = {}
  for (const row of raw.stop_routes) {
    const key = String(row.stop_id)
    if (!stopRoutes[key]) stopRoutes[key] = []
    stopRoutes[key].push(row.route_key)
  }

  // Rebuild RouteStopsData
  const routeStops: RouteStopsData = {}
  for (const row of raw.route_stops) {
    if (!routeStops[row.route_key]) routeStops[row.route_key] = []
    const entry: RouteStopEntry = {
      stop_id: row.stop_id,
      sequence: row.sequence,
      travel_time: row.travel_time,
      dwell_time: row.dwell_time,
    }
    routeStops[row.route_key].push(entry)
  }

  return { features, stopRoutes, routeStops }
}
