import { useState, useMemo, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { MapView } from '../components/Map/MapView'
import { LocateButton } from '../components/Map/LocateButton'
import { RouteSelector } from '../components/Map/RouteSelector'
import { NearestStopCard } from '../components/Map/NearestStopCard'
import { useGeolocation } from '../hooks/useGeolocation'
import { useRouteData } from '../hooks/useRouteData'
import { useNearestStop } from '../hooks/useNearestStop'
import { useMapStore } from '../store/mapStore'
import { stopsNearPolyline } from '../lib/geo'

export function MapPage() {
  const { t } = useTranslation()
  const { position, accuracy, loading: geoLoading, error: geoError, locate } = useGeolocation()
  const [flyToUser, setFlyToUser] = useState(false)
  const { stops, routes, routeStops } = useRouteData()
  const selectedRouteKey = useMapStore((s) => s.selectedRouteKey)

  const routeStopIds = useMemo(() => {
    if (!selectedRouteKey) return null
    if (routeStops) {
      const entries = routeStops[selectedRouteKey]
      if (entries) return new Set(entries.map((e) => e.stop_id))
    }
    if (!routes || !stops) return null
    const feature = routes.features.find(f => f.properties.route_key === selectedRouteKey)
    if (!feature) return null
    return stopsNearPolyline(stops, feature.geometry.coordinates, 50)
  }, [selectedRouteKey, routeStops, routes, stops])

  const nearestStop = useNearestStop(stops, routeStopIds, position)

  // Fly to user once on first position (auto-locate on reload)
  const hasAutoFlown = useRef(false)
  useEffect(() => {
    if (position && !hasAutoFlown.current) {
      hasAutoFlown.current = true
      setFlyToUser(true)
      setTimeout(() => setFlyToUser(false), 100)
    }
  }, [position])

  const handleLocate = () => {
    locate()
    setFlyToUser(true)
    setTimeout(() => setFlyToUser(false), 100)
  }

  return (
    <div className="h-full relative">
      <MapView
        userPosition={position}
        userAccuracy={accuracy}
        flyToUser={flyToUser}
        nearestStopId={nearestStop?.stopId ?? null}
        routeStopIds={routeStopIds}
      />

      <RouteSelector />

      {/* Geolocation error toast */}
      {geoError && (
        <div className="absolute top-16 left-3 right-3 z-[1000] transition-all duration-200">
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700 animate-slide-up">
            {t(geoError)}
          </div>
        </div>
      )}

      {/* Nearest stop card */}
      {nearestStop && position && (
        <NearestStopCard
          stopId={nearestStop.stopId}
          lat={nearestStop.lat}
          lng={nearestStop.lng}
          distance={nearestStop.distance}
          userPosition={position}
        />
      )}

      {/* Locate me button */}
      <LocateButton
        onClick={handleLocate}
        loading={geoLoading}
        active={!!position}
      />
    </div>
  )
}
