import { useState, useEffect, useCallback } from 'react'
import type { RoutesGeoJSON, StopsGeoJSON, RouteStopsData, StopRoutesData } from '../types'
import { loadStopsFromSupabase } from '../lib/adminApi'
import { useRouteEditorStore } from '../store/routeEditorStore'

// Temporary: hide all route lines while we clean the data. Stops are shown unfiltered.
const HIDE_ALL_ROUTES = true

interface RouteData {
  routes: RoutesGeoJSON | null
  stops: StopsGeoJSON | null
  routeStops: RouteStopsData | null
  stopRoutes: StopRoutesData | null
  loading: boolean
  error: string | null
  retry: () => void
}

const cache: Partial<RouteData> = {}

export function useRouteData(): RouteData {
  const customRoutes = useRouteEditorStore(s => s.customRoutes)
  const [data, setData] = useState<Omit<RouteData, 'retry'>>({
    routes: (cache.routes as RoutesGeoJSON) ?? null,
    stops: (cache.stops as StopsGeoJSON) ?? null,
    routeStops: (cache.routeStops as RouteStopsData) ?? null,
    stopRoutes: (cache.stopRoutes as StopRoutesData) ?? null,
    loading: !cache.routes,
    error: null,
  })

  const load = useCallback(async () => {
    setData(prev => ({ ...prev, loading: true, error: null }))
    try {
      // Always load routes from static (not edited via admin)
      const routesRes = await fetch('/data/routes.geojson')
      let routes = await routesRes.json() as RoutesGeoJSON

      // Load static files (always needed as fallback for route associations)
      const [stopsRes, routeStopsRes, stopRoutesRes, supabaseData] = await Promise.all([
        fetch('/data/stops.geojson'),
        fetch('/data/route_stops.json'),
        fetch('/data/stop_routes.json'),
        loadStopsFromSupabase(),
      ])

      const [staticStops, staticRouteStops, staticStopRoutes] = await Promise.all([
        stopsRes.json() as Promise<StopsGeoJSON>,
        routeStopsRes.json() as Promise<RouteStopsData>,
        stopRoutesRes.json() as Promise<StopRoutesData>,
      ])

      // Use Supabase stop positions when available (admin may have moved/merged stops)
      // but fall back to static route associations when Supabase has none
      let stops = staticStops
      let routeStops = staticRouteStops
      let stopRoutes = staticStopRoutes

      if (supabaseData) {
        stops = { type: 'FeatureCollection', features: supabaseData.features }

        const hasRouteData = Object.keys(supabaseData.stopRoutes).length > 0
        if (hasRouteData) {
          routeStops = supabaseData.routeStops
          stopRoutes = supabaseData.stopRoutes
        }
      }

      // Hide all route lines while cleaning data; stops remain unfiltered
      if (HIDE_ALL_ROUTES) {
        routes = { ...routes, features: [] }
      }

      cache.routes = routes
      cache.stops = stops
      cache.routeStops = routeStops
      cache.stopRoutes = stopRoutes

      setData({ routes, stops, routeStops, stopRoutes, loading: false, error: null })
    } catch (err) {
      setData(prev => ({ ...prev, loading: false, error: (err as Error).message }))
    }
  }, [])

  const retry = useCallback(() => {
    cache.routes = undefined
    cache.stops = undefined
    cache.routeStops = undefined
    cache.stopRoutes = undefined
    load()
  }, [load])

  useEffect(() => {
    if (cache.routes && cache.stops && cache.routeStops && cache.stopRoutes) {
      return
    }
    load()
  }, [load])

  // Merge custom routes created via the route editor
  const mergedRoutes = data.routes && customRoutes.length > 0
    ? {
        ...data.routes,
        features: [
          ...data.routes.features,
          ...customRoutes.filter(cr =>
            !data.routes!.features.some(r => r.properties.route_key === cr.properties.route_key)
          ),
        ],
      }
    : data.routes

  return { ...data, routes: mergedRoutes, retry }
}
