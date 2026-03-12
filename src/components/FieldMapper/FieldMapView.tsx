import { useMemo } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polyline } from 'react-leaflet'
import { UserLocationMarker } from '../Map/UserLocationMarker'
import { XALAPA_CENTER } from '../../lib/constants'
import type { StopsGeoJSON, RoutesGeoJSON, FieldCollectionEntry } from '../../types'
import 'leaflet/dist/leaflet.css'

const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'

interface Props {
  stops: StopsGeoJSON | null
  routes: RoutesGeoJSON | null
  userPosition: { lat: number; lng: number } | null
  accuracy: number | null
  sessionEntries: FieldCollectionEntry[]
  selectedRouteKey: string | null
  detectedStopId: number | null
}

export function FieldMapView({
  stops,
  routes,
  userPosition,
  accuracy,
  sessionEntries,
  selectedRouteKey,
  detectedStopId,
}: Props) {
  const collectedStopIds = useMemo(
    () => new Set(sessionEntries.map(e => e.stop_id)),
    [sessionEntries]
  )

  const routeLine = useMemo(() => {
    if (!selectedRouteKey || !routes) return null
    const feature = routes.features.find(r => r.properties.route_key === selectedRouteKey)
    if (!feature) return null
    return feature.geometry.coordinates.map(([lng, lat]) => [lat, lng] as [number, number])
  }, [selectedRouteKey, routes])

  return (
    <MapContainer
      center={userPosition ? [userPosition.lat, userPosition.lng] : XALAPA_CENTER}
      zoom={15}
      minZoom={11}
      maxZoom={19}
      className="h-full w-full"
      zoomControl={false}
    >
      <TileLayer
        url={OSM_URL}
        attribution="&copy; OpenStreetMap"
        maxZoom={19}
      />

      {/* Selected route line */}
      {routeLine && (
        <Polyline
          positions={routeLine}
          pathOptions={{ color: '#22c55e', weight: 4, opacity: 0.7 }}
        />
      )}

      {/* All stops */}
      {stops?.features.map(stop => {
        const [lng, lat] = stop.geometry.coordinates
        const stopId = stop.properties.stop_id
        const isCollected = collectedStopIds.has(stopId)
        const isDetected = stopId === detectedStopId

        return (
          <CircleMarker
            key={stopId}
            center={[lat, lng]}
            radius={isDetected ? 9 : isCollected ? 7 : 4}
            pathOptions={
              isDetected
                ? { fillColor: '#f59e0b', fillOpacity: 0.9, color: '#b45309', weight: 2.5 }
                : isCollected
                  ? { fillColor: '#22c55e', fillOpacity: 0.9, color: '#15803d', weight: 2 }
                  : { fillColor: '#94a3b8', fillOpacity: 0.5, color: '#64748b', weight: 1 }
            }
          />
        )
      })}

      {/* User position */}
      {userPosition && (
        <UserLocationMarker position={userPosition} accuracy={accuracy} flyTo />
      )}
    </MapContainer>
  )
}
