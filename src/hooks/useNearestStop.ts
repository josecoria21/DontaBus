import { useMemo } from 'react'
import { haversineDistance } from '../lib/geo'
import type { StopsGeoJSON } from '../types'

interface NearestStop {
  stopId: number
  lat: number
  lng: number
  distance: number
}

export function useNearestStop(
  stops: StopsGeoJSON | null,
  routeStopIds: Set<number> | null,
  userPosition: { lat: number; lng: number } | null,
): NearestStop | null {
  return useMemo(() => {
    if (!stops || !routeStopIds || !userPosition) return null

    let best: NearestStop | null = null

    for (const stop of stops.features) {
      const stopId = stop.properties.stop_id
      if (!routeStopIds.has(stopId)) continue

      const [lng, lat] = stop.geometry.coordinates
      const distance = haversineDistance(userPosition.lat, userPosition.lng, lat, lng)

      if (!best || distance < best.distance) {
        best = { stopId, lat, lng, distance }
      }
    }

    return best
  }, [stops, routeStopIds, userPosition?.lat, userPosition?.lng])
}
