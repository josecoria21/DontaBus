import { create } from 'zustand'
import type { StopFeature, StopsGeoJSON, StopRoutesData, RouteStopsData } from '../types'

const MAX_HISTORY = 50

interface PendingMove {
  stopId: number
  oldLng: number
  oldLat: number
  newLng: number
  newLat: number
}

interface EditorSnapshot {
  features: StopFeature[]
  stopRoutes: StopRoutesData
  routeStops: RouteStopsData
}

interface StopEditorState {
  features: StopFeature[]
  stopRoutes: StopRoutesData
  routeStops: RouteStopsData
  selectedStopId: number | null
  history: EditorSnapshot[]
  historyIndex: number
  isDirty: boolean
  saving: boolean
  lastSaveError: string | null
  addMode: boolean
  dragMode: boolean
  pendingMove: PendingMove | null
  mergeMode: boolean
  mergeTargetId: number | null
  mergeSourceIds: number[]

  loadEditorData: (features: StopFeature[], stopRoutes: StopRoutesData, routeStops: RouteStopsData) => void
  moveStop: (stopId: number, lng: number, lat: number) => void
  deleteStop: (stopId: number) => void
  addStop: (lng: number, lat: number) => void
  selectStop: (stopId: number | null) => void
  setAddMode: (on: boolean) => void
  setDragMode: (on: boolean) => void
  setPendingMove: (pending: PendingMove | null) => void
  confirmMove: () => void
  cancelMove: () => void
  undo: () => void
  redo: () => void
  toGeoJSON: () => StopsGeoJSON
  toStopRoutesJSON: () => StopRoutesData
  toRouteStopsJSON: () => RouteStopsData
  saveToServer: () => Promise<boolean>
  linkRouteToStop: (stopId: number, routeKey: string) => void
  unlinkRouteFromStop: (stopId: number, routeKey: string) => void
  startMerge: () => void
  toggleMergeSource: (stopId: number) => void
  cancelMerge: () => void
  confirmMerge: () => void
}

function cloneFeatures(features: StopFeature[]): StopFeature[] {
  return features.map(f => ({
    type: 'Feature' as const,
    properties: { ...f.properties },
    geometry: {
      type: 'Point' as const,
      coordinates: [...f.geometry.coordinates] as [number, number],
    },
  }))
}

function cloneStopRoutes(sr: StopRoutesData): StopRoutesData {
  const clone: StopRoutesData = {}
  for (const key in sr) {
    clone[key] = [...sr[key]]
  }
  return clone
}

function cloneRouteStops(rs: RouteStopsData): RouteStopsData {
  const clone: RouteStopsData = {}
  for (const key in rs) {
    clone[key] = rs[key].map(e => ({ ...e }))
  }
  return clone
}

function cloneSnapshot(s: EditorSnapshot): EditorSnapshot {
  return {
    features: cloneFeatures(s.features),
    stopRoutes: cloneStopRoutes(s.stopRoutes),
    routeStops: cloneRouteStops(s.routeStops),
  }
}

function pushHistory(history: EditorSnapshot[], historyIndex: number, snapshot: EditorSnapshot) {
  const newHistory = history.slice(0, historyIndex + 1)
  newHistory.push(cloneSnapshot(snapshot))
  if (newHistory.length > MAX_HISTORY) newHistory.shift()
  return { history: newHistory, historyIndex: newHistory.length - 1 }
}

export const useStopEditorStore = create<StopEditorState>((set, get) => ({
  features: [],
  stopRoutes: {},
  routeStops: {},
  selectedStopId: null,
  history: [],
  historyIndex: -1,
  isDirty: false,
  saving: false,
  lastSaveError: null,
  addMode: false,
  dragMode: false,
  pendingMove: null,
  mergeMode: false,
  mergeTargetId: null,
  mergeSourceIds: [],

  loadEditorData: (features, stopRoutes, routeStops) => {
    const clonedFeatures = cloneFeatures(features)
    const clonedSR = cloneStopRoutes(stopRoutes)
    const clonedRS = cloneRouteStops(routeStops)
    const snapshot: EditorSnapshot = {
      features: clonedFeatures,
      stopRoutes: clonedSR,
      routeStops: clonedRS,
    }
    set({
      features: clonedFeatures,
      stopRoutes: clonedSR,
      routeStops: clonedRS,
      selectedStopId: null,
      history: [cloneSnapshot(snapshot)],
      historyIndex: 0,
      isDirty: false,
      addMode: false,
      dragMode: false,
      pendingMove: null,
      mergeMode: false,
      mergeTargetId: null,
      mergeSourceIds: [],
    })
  },

  moveStop: (stopId, lng, lat) => {
    const { features, stopRoutes, routeStops, history, historyIndex } = get()
    const updated = features.map(f =>
      f.properties.stop_id === stopId
        ? { ...f, geometry: { ...f.geometry, coordinates: [lng, lat] as [number, number] } }
        : f
    )
    const snapshot: EditorSnapshot = { features: updated, stopRoutes, routeStops }
    set({
      features: updated,
      isDirty: true,
      ...pushHistory(history, historyIndex, snapshot),
    })
  },

  deleteStop: (stopId) => {
    const { features, stopRoutes, routeStops, history, historyIndex, selectedStopId } = get()
    const updated = features.filter(f => f.properties.stop_id !== stopId)
    const newSR = cloneStopRoutes(stopRoutes)
    const newRS = cloneRouteStops(routeStops)

    // Clean up route associations
    const routes = newSR[String(stopId)] || []
    for (const routeKey of routes) {
      if (newRS[routeKey]) {
        newRS[routeKey] = newRS[routeKey].filter(e => e.stop_id !== stopId)
      }
    }
    delete newSR[String(stopId)]

    const snapshot: EditorSnapshot = { features: updated, stopRoutes: newSR, routeStops: newRS }
    set({
      features: updated,
      stopRoutes: newSR,
      routeStops: newRS,
      isDirty: true,
      selectedStopId: selectedStopId === stopId ? null : selectedStopId,
      ...pushHistory(history, historyIndex, snapshot),
    })
  },

  addStop: (lng, lat) => {
    const { features, stopRoutes, routeStops, history, historyIndex } = get()
    const maxId = features.reduce((max, f) => Math.max(max, f.properties.stop_id), 0)
    const newId = maxId + 1
    const newFeature: StopFeature = {
      type: 'Feature',
      properties: { stop_id: newId, original_count: 0, num_routes: 0 },
      geometry: { type: 'Point', coordinates: [lng, lat] },
    }
    const updated = [...features, newFeature]
    const newSR = cloneStopRoutes(stopRoutes)
    newSR[String(newId)] = []
    const snapshot: EditorSnapshot = { features: updated, stopRoutes: newSR, routeStops }
    set({
      features: updated,
      stopRoutes: newSR,
      isDirty: true,
      selectedStopId: newId,
      ...pushHistory(history, historyIndex, snapshot),
    })
  },

  selectStop: (stopId) => set({ selectedStopId: stopId }),

  setAddMode: (on) => {
    const s = get()
    if (on && s.mergeMode) return
    set({ addMode: on })
  },

  setDragMode: (on) => {
    const s = get()
    if (on && s.mergeMode) return
    set({ dragMode: on, pendingMove: on ? s.pendingMove : null })
  },

  setPendingMove: (pending) => set({ pendingMove: pending }),

  confirmMove: () => {
    const { pendingMove } = get()
    if (!pendingMove) return
    get().moveStop(pendingMove.stopId, pendingMove.newLng, pendingMove.newLat)
    set({ pendingMove: null })
  },

  cancelMove: () => set({ pendingMove: null }),

  undo: () => {
    const { history, historyIndex } = get()
    if (historyIndex <= 0) return
    const newIndex = historyIndex - 1
    const snapshot = cloneSnapshot(history[newIndex])
    set({
      features: snapshot.features,
      stopRoutes: snapshot.stopRoutes,
      routeStops: snapshot.routeStops,
      historyIndex: newIndex,
      isDirty: newIndex > 0,
      selectedStopId: null,
      mergeMode: false,
      mergeTargetId: null,
      mergeSourceIds: [],
    })
  },

  redo: () => {
    const { history, historyIndex } = get()
    if (historyIndex >= history.length - 1) return
    const newIndex = historyIndex + 1
    const snapshot = cloneSnapshot(history[newIndex])
    set({
      features: snapshot.features,
      stopRoutes: snapshot.stopRoutes,
      routeStops: snapshot.routeStops,
      historyIndex: newIndex,
      isDirty: true,
      selectedStopId: null,
      mergeMode: false,
      mergeTargetId: null,
      mergeSourceIds: [],
    })
  },

  toGeoJSON: (): StopsGeoJSON => {
    const { features } = get()
    const sorted = [...features].sort((a, b) => a.properties.stop_id - b.properties.stop_id)
    return {
      type: 'FeatureCollection',
      name: 'stops',
      crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:OGC:1.3:CRS84' } },
      features: sorted,
    } as StopsGeoJSON
  },

  toStopRoutesJSON: () => {
    return cloneStopRoutes(get().stopRoutes)
  },

  toRouteStopsJSON: () => {
    return cloneRouteStops(get().routeStops)
  },

  saveToServer: async () => {
    const { features, stopRoutes, routeStops } = get()
    set({ saving: true, lastSaveError: null })
    try {
      const { saveStopsToSupabase } = await import('../lib/adminApi')
      const result = await saveStopsToSupabase(features, stopRoutes, routeStops)
      if (result.success) {
        set({ saving: false, isDirty: false })
        return true
      } else {
        set({ saving: false, lastSaveError: result.error || 'Unknown error' })
        return false
      }
    } catch (err) {
      set({ saving: false, lastSaveError: (err as Error).message })
      return false
    }
  },

  linkRouteToStop: (stopId, routeKey) => {
    const { features, stopRoutes, routeStops, history, historyIndex } = get()
    const key = String(stopId)
    const newSR = cloneStopRoutes(stopRoutes)
    const newRS = cloneRouteStops(routeStops)

    // Add to stopRoutes if not already there
    if (!newSR[key]) newSR[key] = []
    if (newSR[key].includes(routeKey)) return
    newSR[key] = [...newSR[key], routeKey]

    // Add to routeStops
    if (!newRS[routeKey]) newRS[routeKey] = []
    if (!newRS[routeKey].some(e => e.stop_id === stopId)) {
      const seq = newRS[routeKey].length
      newRS[routeKey] = [...newRS[routeKey], { stop_id: stopId, sequence: seq, travel_time: 0, dwell_time: 0 }]
    }

    // Update num_routes on the feature
    const updated = features.map(f =>
      f.properties.stop_id === stopId
        ? { ...f, properties: { ...f.properties, num_routes: newSR[key].length } }
        : f
    )

    const snapshot = { features: updated, stopRoutes: newSR, routeStops: newRS }
    set({
      features: updated,
      stopRoutes: newSR,
      routeStops: newRS,
      isDirty: true,
      ...pushHistory(history, historyIndex, snapshot),
    })
  },

  unlinkRouteFromStop: (stopId, routeKey) => {
    const { features, stopRoutes, routeStops, history, historyIndex } = get()
    const key = String(stopId)
    const newSR = cloneStopRoutes(stopRoutes)
    const newRS = cloneRouteStops(routeStops)

    // Remove from stopRoutes
    if (newSR[key]) {
      newSR[key] = newSR[key].filter(rk => rk !== routeKey)
    }

    // Remove from routeStops
    if (newRS[routeKey]) {
      newRS[routeKey] = newRS[routeKey].filter(e => e.stop_id !== stopId)
    }

    // Update num_routes on the feature
    const updated = features.map(f =>
      f.properties.stop_id === stopId
        ? { ...f, properties: { ...f.properties, num_routes: (newSR[key] || []).length } }
        : f
    )

    const snapshot = { features: updated, stopRoutes: newSR, routeStops: newRS }
    set({
      features: updated,
      stopRoutes: newSR,
      routeStops: newRS,
      isDirty: true,
      ...pushHistory(history, historyIndex, snapshot),
    })
  },

  startMerge: () => {
    const { selectedStopId } = get()
    if (selectedStopId === null) return
    set({
      mergeMode: true,
      mergeTargetId: selectedStopId,
      mergeSourceIds: [],
      addMode: false,
      dragMode: false,
      pendingMove: null,
    })
  },

  toggleMergeSource: (stopId) => {
    const { mergeTargetId, mergeSourceIds } = get()
    if (stopId === mergeTargetId) return
    if (mergeSourceIds.includes(stopId)) {
      set({ mergeSourceIds: mergeSourceIds.filter(id => id !== stopId) })
    } else {
      set({ mergeSourceIds: [...mergeSourceIds, stopId] })
    }
  },

  cancelMerge: () => {
    set({
      mergeMode: false,
      mergeTargetId: null,
      mergeSourceIds: [],
    })
  },

  confirmMerge: () => {
    const { features, stopRoutes, routeStops, mergeTargetId, mergeSourceIds, history, historyIndex } = get()
    if (mergeTargetId === null || mergeSourceIds.length === 0) return

    const targetKey = String(mergeTargetId)
    const newSR = cloneStopRoutes(stopRoutes)
    const newRS = cloneRouteStops(routeStops)
    const targetRoutes = new Set<string>(newSR[targetKey] || [])

    for (const sourceId of mergeSourceIds) {
      const sourceKey = String(sourceId)
      const sourceRoutes = newSR[sourceKey] || []

      for (const routeKey of sourceRoutes) {
        const entries = newRS[routeKey] || []
        if (targetRoutes.has(routeKey)) {
          // Target already serves this route - remove source entry
          newRS[routeKey] = entries.filter(e => e.stop_id !== sourceId)
        } else {
          // Target doesn't serve it - replace source stop_id with target
          newRS[routeKey] = entries.map(e =>
            e.stop_id === sourceId ? { ...e, stop_id: mergeTargetId } : e
          )
          targetRoutes.add(routeKey)
        }
      }

      delete newSR[sourceKey]
    }

    newSR[targetKey] = Array.from(targetRoutes)

    const sourceIdSet = new Set(mergeSourceIds)
    const updatedFeatures = features
      .filter(f => !sourceIdSet.has(f.properties.stop_id))
      .map(f =>
        f.properties.stop_id === mergeTargetId
          ? { ...f, properties: { ...f.properties, num_routes: targetRoutes.size } }
          : f
      )

    const snapshot: EditorSnapshot = { features: updatedFeatures, stopRoutes: newSR, routeStops: newRS }
    set({
      features: updatedFeatures,
      stopRoutes: newSR,
      routeStops: newRS,
      isDirty: true,
      mergeMode: false,
      mergeTargetId: null,
      mergeSourceIds: [],
      selectedStopId: mergeTargetId,
      ...pushHistory(history, historyIndex, snapshot),
    })
  },
}))
