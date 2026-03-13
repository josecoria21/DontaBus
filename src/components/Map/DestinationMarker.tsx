import { Marker } from 'react-leaflet'
import L from 'leaflet'

const destinationIcon = L.divIcon({
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  html: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28">
    <path d="M12 0C7.6 0 4 3.6 4 8c0 5.4 8 16 8 16s8-10.6 8-16c0-4.4-3.6-8-8-8zm0 12c-2.2 0-4-1.8-4-4s1.8-4 4-4 4 1.8 4 4-1.8 4-4 4z" fill="#dc2626" stroke="#fff" stroke-width="1"/>
  </svg>`,
})

interface Props {
  position: { lat: number; lng: number }
}

export function DestinationMarker({ position }: Props) {
  return (
    <Marker
      position={[position.lat, position.lng]}
      icon={destinationIcon}
      interactive={false}
    />
  )
}
