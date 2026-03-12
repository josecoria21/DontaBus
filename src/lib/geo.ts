export function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371000 // meters
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

/**
 * Returns the closest point on segment AB to point P, as a parameter t in [0,1].
 * Works in flat (lat/lng) space — accurate enough for short distances.
 */
function closestPointOnSegment(
  pLat: number, pLng: number,
  aLat: number, aLng: number,
  bLat: number, bLng: number
): { lat: number; lng: number } {
  const dx = bLng - aLng
  const dy = bLat - aLat
  if (dx === 0 && dy === 0) return { lat: aLat, lng: aLng }
  const t = Math.max(0, Math.min(1, ((pLng - aLng) * dx + (pLat - aLat) * dy) / (dx * dx + dy * dy)))
  return { lat: aLat + t * dy, lng: aLng + t * dx }
}

/**
 * Returns the Set of stop_ids whose position is within `radiusMeters` of any
 * segment of the given polyline coordinates ([lng, lat] pairs — GeoJSON order).
 */
export function stopsNearPolyline(
  stops: { features: { properties: { stop_id: number }; geometry: { coordinates: [number, number] } }[] },
  coords: [number, number][],
  radiusMeters: number
): Set<number> {
  const ids = new Set<number>()
  for (const stop of stops.features) {
    const [sLng, sLat] = stop.geometry.coordinates
    for (let i = 0; i < coords.length - 1; i++) {
      const [aLng, aLat] = coords[i]
      const [bLng, bLat] = coords[i + 1]
      const closest = closestPointOnSegment(sLat, sLng, aLat, aLng, bLat, bLng)
      if (haversineDistance(sLat, sLng, closest.lat, closest.lng) <= radiusMeters) {
        ids.add(stop.properties.stop_id)
        break
      }
    }
  }
  return ids
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}
