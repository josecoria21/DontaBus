import { create } from 'zustand'

interface MapState {
  selectedStopId: number | null
  selectedRouteKey: string | null
  setSelectedStop: (stopId: number | null) => void
  setSelectedRoute: (routeKey: string | null) => void
}

export const useMapStore = create<MapState>((set) => ({
  selectedStopId: null,
  selectedRouteKey: null,
  setSelectedStop: (stopId) => set({ selectedStopId: stopId }),
  setSelectedRoute: (routeKey) => set({ selectedRouteKey: routeKey }),
}))
