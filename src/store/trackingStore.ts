import { create } from 'zustand'

interface TrackingState {
  isTracking: boolean
  sessionId: string | null
  routeKey: string | null
  startTracking: (routeKey: string, sessionId: string) => void
  stopTracking: () => void
}

export const useTrackingStore = create<TrackingState>((set) => ({
  isTracking: false,
  sessionId: null,
  routeKey: null,
  startTracking: (routeKey, sessionId) =>
    set({ isTracking: true, routeKey, sessionId }),
  stopTracking: () =>
    set({ isTracking: false, routeKey: null, sessionId: null }),
}))
