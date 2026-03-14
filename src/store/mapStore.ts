import { create } from 'zustand'

export interface SelectedStopInfo {
  stopId: number
  lat: number
  lng: number
  routeKeys: string[]
}

interface MapState {
  selectedStop: SelectedStopInfo | null
  selectedRouteKey: string | null
  destination: { lat: number; lng: number } | null
  setSelectedStop: (stop: SelectedStopInfo | null) => void
  setSelectedRoute: (routeKey: string | null) => void
  setDestination: (destination: { lat: number; lng: number } | null) => void
}

export const useMapStore = create<MapState>((set) => ({
  selectedStop: null,
  selectedRouteKey: null,
  destination: null,
  setSelectedStop: (stop) => set({ selectedStop: stop }),
  setSelectedRoute: (routeKey) => set({ selectedRouteKey: routeKey }),
  setDestination: (destination) => set({ destination }),
}))
