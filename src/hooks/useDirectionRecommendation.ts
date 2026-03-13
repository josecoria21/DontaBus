import { useMemo } from 'react'
import { recommendDirection, type DirectionRecommendation } from '../lib/directionRecommender'
import type { RouteFeature, StopsGeoJSON, RouteStopsData } from '../types'

export function useDirectionRecommendation(
  userPosition: { lat: number; lng: number } | null | undefined,
  destination: { lat: number; lng: number } | null,
  selectedRouteKey: string | null,
  allFeatures: RouteFeature[] | null,
  routeStops: RouteStopsData | null,
  stops: StopsGeoJSON | null,
): DirectionRecommendation | null {
  return useMemo(() => {
    if (!userPosition || !destination || !selectedRouteKey || !allFeatures || !routeStops || !stops) {
      return null
    }
    return recommendDirection(userPosition, destination, selectedRouteKey, allFeatures, routeStops, stops)
  }, [
    userPosition?.lat, userPosition?.lng,
    destination?.lat, destination?.lng,
    selectedRouteKey,
    allFeatures,
    routeStops,
    stops,
  ])
}
