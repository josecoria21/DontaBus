import { CircleMarker, Circle, useMap } from 'react-leaflet'
import { useEffect, useRef } from 'react'

interface Props {
  position: { lat: number; lng: number }
  accuracy: number | null
  flyTo?: boolean
}

export function UserLocationMarker({ position, accuracy, flyTo }: Props) {
  const map = useMap()
  const hasFlewRef = useRef(false)

  useEffect(() => {
    if (flyTo && !hasFlewRef.current) {
      map.flyTo([position.lat, position.lng], 15, { duration: 1 })
      hasFlewRef.current = true
    }
  }, [flyTo, position, map])

  // Reset fly flag when flyTo turns off so next activation flies again
  useEffect(() => {
    if (!flyTo) hasFlewRef.current = false
  }, [flyTo])

  return (
    <>
      {/* Accuracy circle */}
      {accuracy && accuracy < 500 && (
        <Circle
          center={[position.lat, position.lng]}
          radius={accuracy}
          pathOptions={{
            fillColor: '#3b82f6',
            fillOpacity: 0.1,
            color: '#3b82f6',
            weight: 1,
            opacity: 0.3,
          }}
        />
      )}
      {/* Blue dot */}
      <CircleMarker
        center={[position.lat, position.lng]}
        radius={8}
        pathOptions={{
          fillColor: '#3b82f6',
          fillOpacity: 1,
          color: '#ffffff',
          weight: 3,
        }}
      />
    </>
  )
}
