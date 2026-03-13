import { useMemo } from 'react'
import { Polyline, Popup, Marker } from 'react-leaflet'
import L from 'leaflet'
import { ROUTE_COLORS } from '../../lib/constants'
import type { RoutesGeoJSON } from '../../types'

const ARROW_INTERVAL = 20
const HEX_RE = /^#[0-9a-fA-F]{3,8}$/
const DEFAULT_COLOR = '#6366f1'

function safeColor(color: string): string {
  return HEX_RE.test(color) ? color : DEFAULT_COLOR
}

function createArrowIcon(angle: number, color: string) {
  const safe = safeColor(color)
  return L.divIcon({
    className: '',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
    html: `<div style="
      width: 0; height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-bottom: 10px solid ${safe};
      transform: rotate(${angle}deg);
      transform-origin: center center;
      opacity: 0.8;
    "></div>`,
  })
}

function bearing(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLng = lng2 - lng1
  const dLat = lat2 - lat1
  return Math.atan2(dLng, dLat) * (180 / Math.PI)
}

interface Props {
  routes: RoutesGeoJSON
  routeKey: string
  showArrows?: boolean
}

export function RouteLine({ routes, routeKey, showArrows }: Props) {
  const feature = routes.features.find(
    (f) => f.properties.route_key === routeKey
  )

  const arrows = useMemo(() => {
    if (!feature || !showArrows) return []
    const coords = feature.geometry.coordinates
    const color = ROUTE_COLORS[feature.properties.route_type] || '#6366f1'
    const result: { lat: number; lng: number; angle: number; color: string; key: number }[] = []

    for (let i = ARROW_INTERVAL; i < coords.length - 1; i += ARROW_INTERVAL) {
      const [lng1, lat1] = coords[i]
      const [lng2, lat2] = coords[i + 1]
      const angle = bearing(lat1, lng1, lat2, lng2)
      result.push({ lat: lat1, lng: lng1, angle, color, key: i })
    }
    return result
  }, [feature, showArrows])

  if (!feature) return null

  const positions = feature.geometry.coordinates.map(
    ([lng, lat]) => [lat, lng] as [number, number]
  )
  const color = ROUTE_COLORS[feature.properties.route_type] || '#6366f1'
  const p = feature.properties

  return (
    <>
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
      {arrows.map((a) => (
        <Marker
          key={a.key}
          position={[a.lat, a.lng]}
          icon={createArrowIcon(a.angle, a.color)}
          interactive={false}
        />
      ))}
    </>
  )
}
