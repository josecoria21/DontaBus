import { create } from 'zustand'

interface MapState {
  selectedStopId: number | null
  selectedRouteKey: string | null
  destination: { lat: number; lng: number } | null
  setSelectedStop: (stopId: number | null) => void
  setSelectedRoute: (routeKey: string | null) => void
  setDestination: (destination: { lat: number; lng: number } | null) => void
}

export const useMapStore = create<MapState>((set) => ({
  selectedStopId: null,
  selectedRouteKey: null,
  destination: null,
  setSelectedStop: (stopId) => set({ selectedStopId: stopId }),
  setSelectedRoute: (routeKey) => set({ selectedRouteKey: routeKey }),
  setDestination: (destination) => set({ destination }),
}))
