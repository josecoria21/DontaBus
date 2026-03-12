import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import { geocoder, Geocoder } from 'leaflet-control-geocoder'
import 'leaflet-control-geocoder/dist/Control.Geocoder.css'

export function GeocoderControl() {
  const map = useMap()

  useEffect(() => {
    const control = geocoder({
      defaultMarkGeocode: false,
      geocoder: Geocoder.nominatim(),
      position: 'topright',
      placeholder: 'Buscar dirección...',
      collapsed: true,
    })

    control.on('markgeocode', (e: unknown) => {
      const result = e as { geocode: { center: { lat: number; lng: number }; bbox: unknown } }
      map.flyTo(result.geocode.center, 17)
    })

    control.addTo(map)
    return () => { control.remove() }
  }, [map])

  return null
}
