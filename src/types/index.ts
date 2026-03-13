export interface RouteFeature {
  type: 'Feature'
  properties: RouteProperties
  geometry: {
    type: 'LineString'
    coordinates: [number, number][]
  }
}

export interface RouteProperties {
  route_key: string
  route_num: string
  route_type: 'circuito' | 'ruta' | 'circuito_alterno'
  direction: string
  name: string
  vehicle_type: 'autobus' | 'combi' | null
  image_url: string | null
  description: string | null
  notes: string | null
  peak_am: number | null
  midday: number | null
  peak_pm: number | null
  night: number | null
}

export interface RoutesGeoJSON {
  type: 'FeatureCollection'
  features: RouteFeature[]
}

export interface StopFeature {
  type: 'Feature'
  properties: StopProperties
  geometry: {
    type: 'Point'
    coordinates: [number, number]
  }
}

export interface StopProperties {
  stop_id: number
  original_count: number
  num_routes: number
}

export interface StopsGeoJSON {
  type: 'FeatureCollection'
  features: StopFeature[]
}

export interface RouteStopEntry {
  stop_id: number
  sequence: number
  travel_time: number
  dwell_time: number
}

export type RouteStopsData = Record<string, RouteStopEntry[]>
export type StopRoutesData = Record<string, string[]>

export interface FieldCollectionEntry {
  stop_id: number
  route_key: string
  sequence: number
  timestamp: number
}

export interface LiveBusPosition {
  route_key: string
  lat: number
  lng: number
  heading: number | null
  speed: number | null
  accuracy: number | null
  timestamp: number
  user_id: string
}
