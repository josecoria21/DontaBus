import { CircleMarker, Popup, useMap } from 'react-leaflet'
import { useState, useEffect, useMemo } from 'react'
import { STOPS_VISIBLE_ZOOM, NEARBY_RADIUS } from '../../lib/constants'
import { haversineDistance } from '../../lib/geo'
import { useMapStore } from '../../store/mapStore'
import type { StopsGeoJSON, StopRoutesData, RoutesGeoJSON } from '../../types'
import { StopPopupContent } from './StopPopupContent'

interface Props {
  stops: StopsGeoJSON
  stopRoutes: StopRoutesData
  routes: RoutesGeoJSON | null
  userPosition?: { lat: number; lng: number } | null
  nearestStopId: number | null
  routeStopIds: Set<number> | null
  verifiedRouteKeys: Set<string> | null
}

export function StopMarkers({ stops, stopRoutes, routes, userPosition, nearestStopId, routeStopIds, verifiedRouteKeys }: Props) {
  const map = useMap()
  const [visible, setVisible] = useState(map.getZoom() >= STOPS_VISIBLE_ZOOM)
  const setSelectedRoute = useMapStore((s) => s.setSelectedRoute)

  useEffect(() => {
    const onZoom = () => {
      setVisible(map.getZoom() >= STOPS_VISIBLE_ZOOM)
    }
    map.on('zoomend', onZoom)
    return () => { map.off('zoomend', onZoom) }
  }, [map])

  const nearbyStopIds = useMemo(() => {
    if (!userPosition) return new Set<number>()
    const ids = new Set<number>()
    for (const stop of stops.features) {
      const [lng, lat] = stop.geometry.coordinates
      if (haversineDistance(userPosition.lat, userPosition.lng, lat, lng) <= NEARBY_RADIUS) {
        ids.add(stop.properties.stop_id)
      }
    }
    return ids
  }, [userPosition?.lat, userPosition?.lng, stops])

  const hasNearby = nearbyStopIds.size > 0

  // Zoomed out and no nearby stops → render nothing
  if (!visible && !hasNearby) return null

  const renderMarker = (stop: StopsGeoJSON['features'][number]) => {
    const [lng, lat] = stop.geometry.coordinates
    const stopId = stop.properties.stop_id
    const isNearby = nearbyStopIds.has(stopId)
    const isNearest = stopId === nearestStopId

    // Route selected → only show stops on that route
    if (routeStopIds && !routeStopIds.has(stopId)) return null

    // Zoomed out → only show nearby (green) stops
    if (!visible && !isNearby) return null

    // Skip the nearest stop — it's rendered separately on top
    if (isNearest) return null

    const allRouteKeys = stopRoutes[String(stopId)] || []
    const routeKeys = verifiedRouteKeys && verifiedRouteKeys.size > 0
      ? allRouteKeys.filter(rk => verifiedRouteKeys.has(rk))
      : allRouteKeys

    return (
      <CircleMarker
        key={stopId}
        center={[lat, lng]}
        radius={isNearby ? 7 : 5}
        pathOptions={isNearby ? {
          fillColor: '#22c55e',
          fillOpacity: 0.9,
          color: '#15803d',
          weight: 1.5,
        } : {
          fillColor: '#3b82f6',
          fillOpacity: 0.8,
          color: '#1e40af',
          weight: 1.5,
        }}
      >
        <Popup maxWidth={260}>
          <StopPopupContent
            stopId={stopId}
            lat={lat}
            lng={lng}
            routeKeys={routeKeys}
            routes={routes}
            onSelectRoute={setSelectedRoute}
          />
        </Popup>
      </CircleMarker>
    )
  }

  // Find the nearest stop feature for rendering on top
  const nearestStopFeature = nearestStopId
    ? stops.features.find((s) => s.properties.stop_id === nearestStopId)
    : null

  const renderNearestMarker = () => {
    if (!nearestStopFeature) return null
    const [lng, lat] = nearestStopFeature.geometry.coordinates
    const stopId = nearestStopFeature.properties.stop_id
    const allRouteKeys = stopRoutes[String(stopId)] || []
    const routeKeys = verifiedRouteKeys && verifiedRouteKeys.size > 0
      ? allRouteKeys.filter(rk => verifiedRouteKeys.has(rk))
      : allRouteKeys

    return (
      <CircleMarker
        key={`nearest-${stopId}`}
        center={[lat, lng]}
        radius={10}
        pathOptions={{
          fillColor: '#f59e0b',
          fillOpacity: 0.9,
          color: '#b45309',
          weight: 2.5,
        }}
      >
        <Popup maxWidth={260}>
          <StopPopupContent
            stopId={stopId}
            lat={lat}
            lng={lng}
            routeKeys={routeKeys}
            routes={routes}
            onSelectRoute={setSelectedRoute}
          />
        </Popup>
      </CircleMarker>
    )
  }

  return (
    <>
      {stops.features.map(renderMarker)}
      {renderNearestMarker()}
    </>
  )
}
