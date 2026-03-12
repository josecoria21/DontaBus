import { useMemo } from 'react'
import { haversineDistance } from '../lib/geo'
import type { StopsGeoJSON } from '../types'

interface NearestStop {
  stopId: number
  lat: number
  lng: number
  distance: number
}

export function useNearestStopAll(
  stops: StopsGeoJSON | null,
  userPosition: { lat: number; lng: number } | null,
  maxDistance = 50,
): NearestStop | null {
  return useMemo(() => {
    if (!stops || !userPosition) return null

    let best: NearestStop | null = null

    for (const stop of stops.features) {
      const [lng, lat] = stop.geometry.coordinates
      const distance = haversineDistance(userPosition.lat, userPosition.lng, lat, lng)

      if (distance > maxDistance) continue
      if (!best || distance < best.distance) {
        best = { stopId: stop.properties.stop_id, lat, lng, distance }
      }
    }

    return best
  }, [stops, userPosition?.lat, userPosition?.lng, maxDistance])
}
