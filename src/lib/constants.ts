export const XALAPA_CENTER: [number, number] = [19.518, -96.911]
export const DEFAULT_ZOOM = 13
export const MIN_ZOOM = 11
export const MAX_ZOOM = 18

// Zoom level at which stops become visible
export const STOPS_VISIBLE_ZOOM = 14

// Radius in meters for "nearby" stop highlighting
export const NEARBY_RADIUS = 200

// Broadcast interval in ms
export const BROADCAST_INTERVAL = 5000

// DB persist interval in ms
export const PERSIST_INTERVAL = 30000

// Stale threshold in ms (2 minutes)
export const STALE_THRESHOLD = 120000

// Fade threshold in ms (30 seconds)
export const FADE_THRESHOLD = 30000

// Route colors by type
export const ROUTE_COLORS: Record<string, string> = {
  circuito: '#2563eb',
  ruta: '#16a34a',
  circuito_alterno: '#d97706',
}

