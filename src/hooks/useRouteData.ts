import { useState, useEffect, useCallback } from 'react'
import type { RoutesGeoJSON, StopsGeoJSON, RouteStopsData, StopRoutesData } from '../types'
import { loadStopsFromSupabase, loadVerifiedRoutes } from '../lib/adminApi'
import { useRouteEditorStore } from '../store/routeEditorStore'

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  return res.json() as Promise<T>
}

interface RouteData {
  routes: RoutesGeoJSON | null
  allRoutes: RoutesGeoJSON | null
  stops: StopsGeoJSON | null
  routeStops: RouteStopsData | null
  stopRoutes: StopRoutesData | null
  verifiedRouteKeys: Set<string> | null
  loading: boolean
  error: string | null
  retry: () => void
}

const cache: Partial<RouteData> = {}

export function useRouteData(): RouteData {
  const customRoutes = useRouteEditorStore(s => s.customRoutes)
  const [data, setData] = useState<Omit<RouteData, 'retry'>>({
    routes: (cache.routes as RoutesGeoJSON) ?? null,
    allRoutes: (cache.allRoutes as RoutesGeoJSON) ?? null,
    stops: (cache.stops as StopsGeoJSON) ?? null,
    routeStops: (cache.routeStops as RouteStopsData) ?? null,
    stopRoutes: (cache.stopRoutes as StopRoutesData) ?? null,
    verifiedRouteKeys: (cache.verifiedRouteKeys as Set<string>) ?? null,
    loading: !cache.routes,
    error: null,
  })

  const load = useCallback(async () => {
    setData(prev => ({ ...prev, loading: true, error: null }))
    try {
      // Always load routes from static (not edited via admin)
      const allRoutes = await fetchJSON<RoutesGeoJSON>('/data/routes.geojson')
      let routes = allRoutes

      // Load static files (always needed as fallback for route associations)
      const [staticStops, staticRouteStops, staticStopRoutes, supabaseData, verifiedRouteKeys] = await Promise.all([
        fetchJSON<StopsGeoJSON>('/data/stops.geojson'),
        fetchJSON<RouteStopsData>('/data/route_stops.json'),
        fetchJSON<StopRoutesData>('/data/stop_routes.json'),
        loadStopsFromSupabase(),
        loadVerifiedRoutes(),
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

      // Filter to verified routes only (when at least one route is verified)
      if (verifiedRouteKeys.size > 0) {
        routes = { ...routes, features: routes.features.filter(f => verifiedRouteKeys.has(f.properties.route_key)) }
      }

      cache.routes = routes
      cache.allRoutes = allRoutes
      cache.stops = stops
      cache.routeStops = routeStops
      cache.stopRoutes = stopRoutes
      cache.verifiedRouteKeys = verifiedRouteKeys

      setData({ routes, allRoutes, stops, routeStops, stopRoutes, verifiedRouteKeys, loading: false, error: null })
    } catch (err) {
      setData(prev => ({ ...prev, loading: false, error: (err as Error).message }))
    }
  }, [])

  const retry = useCallback(() => {
    cache.routes = undefined
    cache.allRoutes = undefined
    cache.stops = undefined
    cache.routeStops = undefined
    cache.stopRoutes = undefined
    cache.verifiedRouteKeys = undefined
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
