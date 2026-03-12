import { Polyline, Popup } from 'react-leaflet'
import { ROUTE_COLORS } from '../../lib/constants'
import type { RoutesGeoJSON } from '../../types'

interface Props {
  routes: RoutesGeoJSON
  routeKey: string
}

export function RouteLine({ routes, routeKey }: Props) {
  const feature = routes.features.find(
    (f) => f.properties.route_key === routeKey
  )
  if (!feature) return null

  const positions = feature.geometry.coordinates.map(
    ([lng, lat]) => [lat, lng] as [number, number]
  )
  const color = ROUTE_COLORS[feature.properties.route_type] || '#6366f1'
  const p = feature.properties

  return (
    <Polyline
      positions={positions}
      pathOptions={{ color, weight: 4, opacity: 0.85 }}
    >
      <Popup>
        <div className="text-sm">
          <div className="font-bold">{p.route_num} - {p.name}</div>
          <div className="text-xs text-gray-500 capitalize">
            {p.route_type} · {p.direction}
          </div>
        </div>
      </Popup>
    </Polyline>
  )
}
