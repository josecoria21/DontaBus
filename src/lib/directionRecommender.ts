import { haversineDistance } from './geo'
import { getSiblingRoutes } from './routeGrouping'
import type { RouteFeature, StopsGeoJSON, RouteStopsData } from '../types'

export interface DirectionRecommendation {
  routeKey: string
  direction: string
  boardStop: { stopId: number; lat: number; lng: number; sequence: number; distance: number }
  alightStop: { stopId: number; lat: number; lng: number; sequence: number; distance: number }
  rideStops: number
  rideTravelTime: number
}

interface StopLocation {
  lat: number
  lng: number
}

export function recommendDirection(
  userPos: { lat: number; lng: number },
  destPos: { lat: number; lng: number },
  selectedRouteKey: string,
  allFeatures: RouteFeature[],
  routeStops: RouteStopsData,
  stops: StopsGeoJSON,
): DirectionRecommendation | null {
  // Build stop location lookup
  const stopLocations = new Map<number, StopLocation>()
  for (const f of stops.features) {
    const [lng, lat] = f.geometry.coordinates
    stopLocations.set(f.properties.stop_id, { lat, lng })
  }

  const siblings = getSiblingRoutes(selectedRouteKey, allFeatures)
  if (siblings.length === 0) return null

  const candidates: (DirectionRecommendation & { isForward: boolean })[] = []

  for (const sibling of siblings) {
    const entries = routeStops[sibling.properties.route_key]
    if (!entries || entries.length === 0) continue

    // Find board stop (nearest to user) and alight stop (nearest to destination)
    let boardStop: DirectionRecommendation['boardStop'] | null = null
    let alightStop: DirectionRecommendation['alightStop'] | null = null

    for (const entry of entries) {
      const loc = stopLocations.get(entry.stop_id)
      if (!loc) continue

      const distToUser = haversineDistance(userPos.lat, userPos.lng, loc.lat, loc.lng)
      if (!boardStop || distToUser < boardStop.distance) {
        boardStop = { stopId: entry.stop_id, lat: loc.lat, lng: loc.lng, sequence: entry.sequence, distance: distToUser }
      }

      const distToDest = haversineDistance(destPos.lat, destPos.lng, loc.lat, loc.lng)
      if (!alightStop || distToDest < alightStop.distance) {
        alightStop = { stopId: entry.stop_id, lat: loc.lat, lng: loc.lng, sequence: entry.sequence, distance: distToDest }
      }
    }

    if (!boardStop || !alightStop || boardStop.stopId === alightStop.stopId) continue

    const isForward = alightStop.sequence > boardStop.sequence

    // Compute ride time between board and alight sequences
    const sortedEntries = [...entries].sort((a, b) => a.sequence - b.sequence)
    let rideTravelTime = 0
    let rideStops = 0

    if (isForward) {
      for (const e of sortedEntries) {
        if (e.sequence > boardStop.sequence && e.sequence <= alightStop.sequence) {
          rideTravelTime += (e.travel_time || 0) + (e.dwell_time || 0)
          rideStops++
        }
      }
    } else {
      // Backward: wrap around (full loop minus the backward portion)
      for (const e of sortedEntries) {
        if (e.sequence > alightStop.sequence && e.sequence <= boardStop.sequence) {
          rideTravelTime += (e.travel_time || 0) + (e.dwell_time || 0)
        }
      }
      // Total loop time minus backward segment
      const totalTime = sortedEntries.reduce((sum, e) => sum + (e.travel_time || 0) + (e.dwell_time || 0), 0)
      rideTravelTime = totalTime - rideTravelTime
      rideStops = sortedEntries.filter(
        e => e.sequence > boardStop.sequence || e.sequence <= alightStop.sequence
      ).length
    }

    candidates.push({
      routeKey: sibling.properties.route_key,
      direction: sibling.properties.direction,
      boardStop,
      alightStop,
      rideStops,
      rideTravelTime,
      isForward,
    })
  }

  if (candidates.length === 0) return null

  // Prefer forward-direction candidates; among them pick shortest ride time
  const forwardCandidates = candidates.filter(c => c.isForward)
  const pool = forwardCandidates.length > 0 ? forwardCandidates : candidates

  pool.sort((a, b) => a.rideTravelTime - b.rideTravelTime)

  const best = pool[0]
  return {
    routeKey: best.routeKey,
    direction: best.direction,
    boardStop: best.boardStop,
    alightStop: best.alightStop,
    rideStops: best.rideStops,
    rideTravelTime: best.rideTravelTime,
  }
}
