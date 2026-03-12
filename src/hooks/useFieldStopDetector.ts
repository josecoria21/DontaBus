import { useEffect, useRef } from 'react'
import { haversineDistance } from '../lib/geo'
import type { StopsGeoJSON, FieldCollectionEntry } from '../types'

const DETECTION_RADIUS = 50 // meters
const COOLDOWN_MS = 3000

interface DetectorParams {
  stops: StopsGeoJSON | null
  userPosition: { lat: number; lng: number } | null
  routeKey: string | null
  dismissedStopIds: Set<number>
  sessionEntries: FieldCollectionEntry[]
  onStopDetected: (stopId: number, distance: number) => void
  enabled: boolean
}

export function useFieldStopDetector({
  stops,
  userPosition,
  routeKey,
  dismissedStopIds,
  sessionEntries,
  onStopDetected,
  enabled,
}: DetectorParams) {
  const cooldownRef = useRef(false)

  useEffect(() => {
    if (!enabled || !stops || !userPosition || !routeKey || cooldownRef.current) return

    // Build set of stop_ids already linked this session for this route
    const linkedStopIds = new Set(
      sessionEntries
        .filter(e => e.route_key === routeKey)
        .map(e => e.stop_id)
    )

    let bestId: number | null = null
    let bestDist = Infinity

    for (const stop of stops.features) {
      const stopId = stop.properties.stop_id
      if (dismissedStopIds.has(stopId)) continue
      if (linkedStopIds.has(stopId)) continue

      const [lng, lat] = stop.geometry.coordinates
      const dist = haversineDistance(userPosition.lat, userPosition.lng, lat, lng)

      if (dist <= DETECTION_RADIUS && dist < bestDist) {
        bestId = stopId
        bestDist = dist
      }
    }

    if (bestId !== null) {
      onStopDetected(bestId, bestDist)
      cooldownRef.current = true
      setTimeout(() => { cooldownRef.current = false }, COOLDOWN_MS)
    }
  }, [enabled, stops, userPosition?.lat, userPosition?.lng, routeKey, dismissedStopIds, sessionEntries, onStopDetected])
}
