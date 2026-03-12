declare module 'leaflet-control-geocoder' {
  import * as L from 'leaflet'

  interface GeocoderControl extends L.Control, L.Evented {}

  namespace Geocoder {
    function nominatim(options?: Record<string, unknown>): unknown
  }

  function geocoder(options?: {
    defaultMarkGeocode?: boolean
    geocoder?: unknown
    position?: string
    placeholder?: string
    errorMessage?: string
    collapsed?: boolean
  }): GeocoderControl

  export { geocoder, Geocoder }
}

declare module 'leaflet-control-geocoder/dist/Control.Geocoder.css'
