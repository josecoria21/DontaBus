import { useEffect, useRef, useCallback } from 'react'
import { useMapEvents } from 'react-leaflet'
import { useMapStore } from '../../store/mapStore'

const LONG_PRESS_MS = 500
const MOVE_THRESHOLD = 15

export function DestinationHandler() {
  const setDestination = useMapStore((s) => s.setDestination)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    startPosRef.current = null
  }, [])

  useEffect(() => {
    return () => cancel()
  }, [cancel])

  useMapEvents({
    mousedown(e) {
      startPosRef.current = { x: e.originalEvent.clientX, y: e.originalEvent.clientY }
      timerRef.current = setTimeout(() => {
        const latlng = e.latlng
        setDestination({ lat: latlng.lat, lng: latlng.lng })
        if (navigator.vibrate) navigator.vibrate(50)
        timerRef.current = null
      }, LONG_PRESS_MS)
    },
    mousemove(e) {
      if (!startPosRef.current) return
      const dx = e.originalEvent.clientX - startPosRef.current.x
      const dy = e.originalEvent.clientY - startPosRef.current.y
      if (Math.sqrt(dx * dx + dy * dy) > MOVE_THRESHOLD) cancel()
    },
    mouseup() {
      cancel()
    },
    contextmenu(e) {
      e.originalEvent.preventDefault()
      setDestination({ lat: e.latlng.lat, lng: e.latlng.lng })
    },
    // Touch events for mobile
    // react-leaflet maps touchstart to mousedown etc, but we need explicit touch handling
    // for proper mobile long-press detection
  })

  // Touch event handling directly on map container
  const map = useMapEvents({})

  useEffect(() => {
    const container = map.getContainer()

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      const touch = e.touches[0]
      startPosRef.current = { x: touch.clientX, y: touch.clientY }
      timerRef.current = setTimeout(() => {
        const point = map.containerPointToLatLng([touch.clientX - container.getBoundingClientRect().left, touch.clientY - container.getBoundingClientRect().top])
        setDestination({ lat: point.lat, lng: point.lng })
        if (navigator.vibrate) navigator.vibrate(50)
        timerRef.current = null
      }, LONG_PRESS_MS)
    }

    const onTouchMove = (e: TouchEvent) => {
      if (!startPosRef.current || e.touches.length !== 1) { cancel(); return }
      const touch = e.touches[0]
      const dx = touch.clientX - startPosRef.current.x
      const dy = touch.clientY - startPosRef.current.y
      if (Math.sqrt(dx * dx + dy * dy) > MOVE_THRESHOLD) cancel()
    }

    const onTouchEnd = () => cancel()

    container.addEventListener('touchstart', onTouchStart, { passive: true })
    container.addEventListener('touchmove', onTouchMove, { passive: true })
    container.addEventListener('touchend', onTouchEnd)
    container.addEventListener('touchcancel', onTouchEnd)

    return () => {
      container.removeEventListener('touchstart', onTouchStart)
      container.removeEventListener('touchmove', onTouchMove)
      container.removeEventListener('touchend', onTouchEnd)
      container.removeEventListener('touchcancel', onTouchEnd)
    }
  }, [map, setDestination, cancel])

  return null
}
