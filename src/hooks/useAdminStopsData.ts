import { useState, useEffect } from 'react'
import type { RoutesGeoJSON, StopFeature, RouteStopsData, StopRoutesData } from '../types'
import { loadStopsFromSupabase } from '../lib/adminApi'

export type DataSource = 'supabase' | 'static' | null

interface AdminStopsData {
  routes: RoutesGeoJSON | null
  features: StopFeature[] | null
  stopRoutes: StopRoutesData | null
  routeStops: RouteStopsData | null
  loading: boolean
  source: DataSource
}

export function useAdminStopsData(): AdminStopsData {
  const [data, setData] = useState<AdminStopsData>({
    routes: null,
    features: null,
    stopRoutes: null,
    routeStops: null,
    loading: true,
    source: null,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      // Always load routes from static (admin doesn't edit routes)
      const routesRes = await fetch('/data/routes.geojson')
      const routes = (await routesRes.json()) as RoutesGeoJSON

      // Try Supabase first
      const supabaseData = await loadStopsFromSupabase()
      if (!cancelled && supabaseData) {
        setData({
          routes,
          features: supabaseData.features,
          stopRoutes: supabaseData.stopRoutes,
          routeStops: supabaseData.routeStops,
          loading: false,
          source: 'supabase',
        })
        return
      }

      // Fall back to static files
      const [stopsRes, stopRoutesRes, routeStopsRes] = await Promise.all([
        fetch('/data/stops.geojson'),
        fetch('/data/stop_routes.json'),
        fetch('/data/route_stops.json'),
      ])

      const [stopsGeoJSON, stopRoutes, routeStops] = await Promise.all([
        stopsRes.json(),
        stopRoutesRes.json() as Promise<StopRoutesData>,
        routeStopsRes.json() as Promise<RouteStopsData>,
      ])

      if (!cancelled) {
        setData({
          routes,
          features: stopsGeoJSON.features as StopFeature[],
          stopRoutes,
          routeStops,
          loading: false,
          source: 'static',
        })
      }
    }

    load().catch(err => {
      console.error('Failed to load admin stops data:', err)
      if (!cancelled) {
        setData(prev => ({ ...prev, loading: false }))
      }
    })

    return () => { cancelled = true }
  }, [])

  return data
}
