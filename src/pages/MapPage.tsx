import { useState, useMemo, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { MapView } from '../components/Map/MapView'
import { LocateButton } from '../components/Map/LocateButton'
import { RouteSelector } from '../components/Map/RouteSelector'
import { NearestStopCard } from '../components/Map/NearestStopCard'
import { DirectionCard } from '../components/Map/DirectionCard'
import { useGeolocation } from '../hooks/useGeolocation'
import { useRouteData } from '../hooks/useRouteData'
import { useNearestStop } from '../hooks/useNearestStop'
import { useDirectionRecommendation } from '../hooks/useDirectionRecommendation'
import { useMapStore } from '../store/mapStore'
import { stopsNearPolyline } from '../lib/geo'
import { LongPressHint } from '../components/Map/LongPressHint'
import { StopBottomSheet } from '../components/Map/StopBottomSheet'

export function MapPage() {
  const { t } = useTranslation()
  const { position, accuracy, loading: geoLoading, error: geoError, locate } = useGeolocation()
  const [flyToUser, setFlyToUser] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])
  const { stops, routes, allRoutes, routeStops, stopRoutes, verifiedRouteKeys } = useRouteData()
  const selectedRouteKey = useMapStore((s) => s.selectedRouteKey)
  const destination = useMapStore((s) => s.destination)
  const setSelectedRoute = useMapStore((s) => s.setSelectedRoute)

  const routeStopIds = useMemo(() => {
    if (selectedRouteKey) {
      if (routeStops) {
        const entries = routeStops[selectedRouteKey]
        if (entries) return new Set(entries.map((e) => e.stop_id))
      }
      if (!routes || !stops) return null
      const feature = routes.features.find(f => f.properties.route_key === selectedRouteKey)
      if (!feature) return null
      return stopsNearPolyline(stops, feature.geometry.coordinates, 50)
    }
    // No route selected: filter to verified stops (if any routes verified)
    if (verifiedRouteKeys && verifiedRouteKeys.size > 0 && stopRoutes) {
      const ids = new Set<number>()
      for (const [stopId, routeKeys] of Object.entries(stopRoutes)) {
        if (routeKeys.some(rk => verifiedRouteKeys.has(rk))) ids.add(Number(stopId))
      }
      return ids
    }
    return null // no verified routes yet → show all
  }, [selectedRouteKey, routeStops, routes, stops, verifiedRouteKeys, stopRoutes])

  const nearestStop = useNearestStop(stops, routeStopIds, position)

  const recommendation = useDirectionRecommendation(
    position,
    destination,
    selectedRouteKey,
    allRoutes?.features ?? null,
    routeStops,
    stops,
  )

  // Auto-switch direction when recommendation changes
  const prevRecommendedKey = useRef<string | null>(null)
  useEffect(() => {
    if (recommendation && recommendation.routeKey !== prevRecommendedKey.current) {
      prevRecommendedKey.current = recommendation.routeKey
      if (recommendation.routeKey !== selectedRouteKey) {
        setSelectedRoute(recommendation.routeKey)
      }
    }
    if (!recommendation) {
      prevRecommendedKey.current = null
    }
  }, [recommendation, selectedRouteKey, setSelectedRoute])

  // Fly to user once on first position (auto-locate on reload)
  const hasAutoFlown = useRef(false)
  const flyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const triggerFlyToUser = () => {
    if (flyTimerRef.current) clearTimeout(flyTimerRef.current)
    setFlyToUser(true)
    flyTimerRef.current = setTimeout(() => {
      setFlyToUser(false)
      flyTimerRef.current = null
    }, 100)
  }

  useEffect(() => {
    return () => {
      if (flyTimerRef.current) clearTimeout(flyTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (position && !hasAutoFlown.current) {
      hasAutoFlown.current = true
      triggerFlyToUser()
    }
  }, [position])

  const handleLocate = () => {
    locate()
    triggerFlyToUser()
  }

  return (
    <div className="h-full relative">
      <MapView
        userPosition={position}
        userAccuracy={accuracy}
        flyToUser={flyToUser}
        nearestStopId={nearestStop?.stopId ?? null}
        routeStopIds={routeStopIds}
        recommendation={recommendation}
      />

      <RouteSelector />

      {/* Offline banner */}
      {!isOnline && (
        <div className="absolute top-16 left-3 right-3 z-[1001]" aria-live="assertive">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 text-sm text-amber-800 animate-slide-up">
            {t('offline_notice')}
          </div>
        </div>
      )}

      {/* Geolocation error toast */}
      {geoError && (
        <div className="absolute top-16 left-3 right-3 z-[1000] transition-all duration-200" aria-live="assertive">
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm text-red-700 animate-slide-up">
            {t(geoError)}
          </div>
        </div>
      )}

      {/* Direction card (replaces nearest stop card when active) */}
      <div aria-live="polite">
      {recommendation && position ? (
        <DirectionCard
          recommendation={recommendation}
          userPosition={position}
        />
      ) : (
        /* Nearest stop card */
        nearestStop && position && (
          <NearestStopCard
            stopId={nearestStop.stopId}
            lat={nearestStop.lat}
            lng={nearestStop.lng}
            distance={nearestStop.distance}
            userPosition={position}
          />
        )
      )}
      </div>

      {/* Destination hint when destination set but no route */}
      {destination && !selectedRouteKey && (
        <div className="absolute bottom-24 left-3 right-3 z-[1000] max-w-sm mx-auto bg-white rounded-lg shadow-lg px-4 py-3 animate-slide-up">
          <div className="text-sm text-gray-600 text-center">
            {t('select_route_for_direction')}
          </div>
        </div>
      )}

      {/* Long-press hint for first-time users */}
      {!destination && !selectedRouteKey && <LongPressHint />}

      {/* Stop bottom sheet (mobile) */}
      <StopBottomSheet />

      {/* Locate me button */}
      <LocateButton
        onClick={handleLocate}
        loading={geoLoading}
        active={!!position}
      />
    </div>
  )
}
