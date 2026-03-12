import { useState, useEffect, useCallback, useRef } from 'react'

interface GeolocationState {
  position: { lat: number; lng: number } | null
  accuracy: number | null
  loading: boolean
  error: string | null
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    accuracy: null,
    loading: false,
    error: null,
  })
  const watchIdRef = useRef<number | null>(null)

  const locate = useCallback(() => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, error: 'geo_unavailable' }))
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))

    // Get a quick initial position
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          accuracy: pos.coords.accuracy,
          loading: false,
          error: null,
        })
      },
      (err) => {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err.code === 1
            ? 'geo_permission_denied'
            : 'geo_position_error',
        }))
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    )
  }, [])

  const startWatching = useCallback(() => {
    if (!navigator.geolocation || watchIdRef.current !== null) return

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setState({
          position: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          accuracy: pos.coords.accuracy,
          loading: false,
          error: null,
        })
      },
      (err) => {
        setState(prev => ({
          ...prev,
          loading: false,
          error: err.code === 1
            ? 'geo_permission_denied'
            : 'geo_position_error',
        }))
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    )
  }, [])

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }, [])

  // Auto-locate on mount if permission was already granted (no prompt shown)
  useEffect(() => {
    navigator.permissions?.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'granted') {
        locate()
      }
    })
  }, [locate])

  useEffect(() => {
    return () => stopWatching()
  }, [stopWatching])

  return { ...state, locate, startWatching, stopWatching }
}
