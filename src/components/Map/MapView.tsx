import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { XALAPA_CENTER, DEFAULT_ZOOM, MIN_ZOOM, MAX_ZOOM } from '../../lib/constants'
import { StopMarkers } from './StopMarkers'
import { RouteLine } from './RouteLine'
import { UserLocationMarker } from './UserLocationMarker'
import { DestinationHandler } from './DestinationHandler'
import { DestinationMarker } from './DestinationMarker'
import { BoardAlightMarkers } from './BoardAlightMarkers'
import { useRouteData } from '../../hooks/useRouteData'
import { useMapStore } from '../../store/mapStore'
import type { RoutesGeoJSON } from '../../types'
import type { DirectionRecommendation } from '../../lib/directionRecommender'
import 'leaflet/dist/leaflet.css'

function FlyToRoute({ routes }: { routes: RoutesGeoJSON | null }) {
  const map = useMap()
  const selectedRouteKey = useMapStore((s) => s.selectedRouteKey)

  useEffect(() => {
    if (!selectedRouteKey || !routes) return
    const feature = routes.features.find(
      (f) => f.properties.route_key === selectedRouteKey
    )
    if (!feature) return
    const coords = feature.geometry.coordinates
    const lats = coords.map((c) => c[1])
    const lngs = coords.map((c) => c[0])
    map.fitBounds([
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ], { padding: [40, 40] })
  }, [selectedRouteKey, routes, map])

  return null
}

interface MapViewProps {
  userPosition?: { lat: number; lng: number } | null
  userAccuracy?: number | null
  flyToUser?: boolean
  nearestStopId: number | null
  routeStopIds: Set<number> | null
  recommendation?: DirectionRecommendation | null
}

export function MapView({ userPosition, userAccuracy, flyToUser, nearestStopId, routeStopIds, recommendation }: MapViewProps) {
  const { t } = useTranslation()
  const { routes, allRoutes, stops, stopRoutes, verifiedRouteKeys, loading, error, retry } = useRouteData()
  const selectedRouteKey = useMapStore((s) => s.selectedRouteKey)
  const destination = useMapStore((s) => s.destination)

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-100 gap-3">
        <svg className="w-8 h-8 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" />
        </svg>
        <div className="text-slate-500 text-sm">{t('loading_map')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-100 gap-3">
        <div className="text-red-500 text-sm">{error}</div>
        <button
          onClick={retry}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          {t('retry')}
        </button>
      </div>
    )
  }

  // Use allRoutes for rendering the route line when recommendation is active
  // (the recommended route may not be verified yet, but allRoutes always has full data)
  const routesForLine = recommendation && allRoutes ? allRoutes : routes
  const showArrows = !!recommendation

  return (
    <MapContainer
      center={XALAPA_CENTER}
      zoom={DEFAULT_ZOOM}
      minZoom={MIN_ZOOM}
      maxZoom={MAX_ZOOM}
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyToRoute routes={routesForLine} />
      <DestinationHandler />
      {userPosition && (
        <UserLocationMarker
          position={userPosition}
          accuracy={userAccuracy ?? null}
          flyTo={flyToUser}
        />
      )}
      {destination && <DestinationMarker position={destination} />}
      {stops && stopRoutes && (
        <StopMarkers
          stops={stops}
          stopRoutes={stopRoutes}
          routes={routes}
          userPosition={userPosition}
          nearestStopId={nearestStopId}
          routeStopIds={routeStopIds}
          verifiedRouteKeys={verifiedRouteKeys}
        />
      )}
      {selectedRouteKey && routesForLine && (
        <RouteLine routes={routesForLine} routeKey={selectedRouteKey} showArrows={showArrows} />
      )}
      {recommendation && (
        <BoardAlightMarkers
          boardStop={recommendation.boardStop}
          alightStop={recommendation.alightStop}
        />
      )}
    </MapContainer>
  )
}
