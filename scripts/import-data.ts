/**
 * Seed Supabase database from clean_data/ files.
 * Usage: npx tsx scripts/import-data.ts
 *
 * Requires VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

const dataDir = resolve(__dirname, '..', 'public', 'data')

async function main() {
  // 1. Import routes
  console.log('Importing routes...')
  const routesGeoJSON = JSON.parse(readFileSync(resolve(dataDir, 'routes.geojson'), 'utf-8'))
  const routes = routesGeoJSON.features.map((f: any) => ({
    route_key: f.properties.route_key,
    route_num: f.properties.route_num,
    route_type: f.properties.route_type,
    direction: f.properties.direction,
    name: f.properties.name,
    description: f.properties.description,
    notes: f.properties.notes,
    peak_am: f.properties.peak_am,
    midday: f.properties.midday,
    peak_pm: f.properties.peak_pm,
    night: f.properties.night,
    geometry: `SRID=4326;LINESTRING(${f.geometry.coordinates.map((c: number[]) => `${c[0]} ${c[1]}`).join(',')})`,
  }))

  for (let i = 0; i < routes.length; i += 50) {
    const batch = routes.slice(i, i + 50)
    const { error } = await supabase.from('routes').upsert(batch, { onConflict: 'route_key' })
    if (error) throw new Error(`Routes batch ${i}: ${error.message}`)
  }
  console.log(`  ${routes.length} routes imported`)

  // 2. Import stops
  console.log('Importing stops...')
  const stopsGeoJSON = JSON.parse(readFileSync(resolve(dataDir, 'stops.geojson'), 'utf-8'))
  const stops = stopsGeoJSON.features.map((f: any) => ({
    stop_id: f.properties.stop_id,
    original_count: f.properties.original_count,
    num_routes: f.properties.num_routes,
    location: `SRID=4326;POINT(${f.geometry.coordinates[0]} ${f.geometry.coordinates[1]})`,
  }))

  for (let i = 0; i < stops.length; i += 100) {
    const batch = stops.slice(i, i + 100)
    const { error } = await supabase.from('stops').upsert(batch, { onConflict: 'stop_id' })
    if (error) throw new Error(`Stops batch ${i}: ${error.message}`)
  }
  console.log(`  ${stops.length} stops imported`)

  // 3. Import route_stops
  console.log('Importing route_stops...')
  const routeStops = JSON.parse(readFileSync(resolve(dataDir, 'route_stops.json'), 'utf-8'))
  const routeStopRows: any[] = []
  for (const [routeKey, entries] of Object.entries(routeStops)) {
    for (const entry of entries as any[]) {
      routeStopRows.push({
        route_key: routeKey,
        stop_id: entry.stop_id,
        sequence: entry.sequence,
        travel_time: entry.travel_time,
        dwell_time: entry.dwell_time,
      })
    }
  }

  for (let i = 0; i < routeStopRows.length; i += 100) {
    const batch = routeStopRows.slice(i, i + 100)
    const { error } = await supabase.from('route_stops').upsert(batch, { onConflict: 'route_key,sequence' })
    if (error) throw new Error(`Route stops batch ${i}: ${error.message}`)
  }
  console.log(`  ${routeStopRows.length} route_stops imported`)

  // 4. Import stop_routes
  console.log('Importing stop_routes...')
  const stopRoutes = JSON.parse(readFileSync(resolve(dataDir, 'stop_routes.json'), 'utf-8'))
  const stopRouteRows: any[] = []
  for (const [stopId, routeKeys] of Object.entries(stopRoutes)) {
    for (const routeKey of routeKeys as string[]) {
      stopRouteRows.push({
        stop_id: parseInt(stopId),
        route_key: routeKey,
      })
    }
  }

  for (let i = 0; i < stopRouteRows.length; i += 100) {
    const batch = stopRouteRows.slice(i, i + 100)
    const { error } = await supabase.from('stop_routes').upsert(batch, { onConflict: 'stop_id,route_key' })
    if (error) throw new Error(`Stop routes batch ${i}: ${error.message}`)
  }
  console.log(`  ${stopRouteRows.length} stop_routes imported`)

  console.log('Done!')
}

main().catch(console.error)
