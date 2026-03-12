import { create } from 'zustand'
import type { FieldCollectionEntry } from '../types'

type Mode = 'at-stop' | 'on-bus' | null

interface FieldMapperState {
  mode: Mode
  sessionEntries: FieldCollectionEntry[]

  // Mode A: At a Stop
  detectedStopId: number | null
  detectedStopDistance: number | null

  // Mode B: On a Bus
  selectedRouteKey: string | null
  pendingStopId: number | null
  pendingStopDistance: number | null
  dismissedStopIds: Set<number>
  nextSequence: number

  // Server state
  saving: boolean
  lastSaveError: string | null

  // Actions
  setMode: (mode: Mode) => void
  setDetectedStop: (stopId: number | null, distance: number | null) => void
  setSelectedRouteKey: (routeKey: string | null) => void
  setPendingStop: (stopId: number | null, distance: number | null) => void
  linkStopToRoute: (stopId: number, routeKey: string) => void
  confirmPendingStop: () => void
  dismissPendingStop: () => void
  saveEntriesToServer: () => Promise<boolean>
  reset: () => void
}

const STORAGE_KEY = 'dontabus-field-mapper-session'

function loadPersistedEntries(): FieldCollectionEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return []
}

function persistEntries(entries: FieldCollectionEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch { /* ignore */ }
}

export const useFieldMapperStore = create<FieldMapperState>((set, get) => ({
  mode: null,
  sessionEntries: loadPersistedEntries(),
  detectedStopId: null,
  detectedStopDistance: null,
  selectedRouteKey: null,
  pendingStopId: null,
  pendingStopDistance: null,
  dismissedStopIds: new Set(),
  nextSequence: 1,
  saving: false,
  lastSaveError: null,

  setMode: (mode) => {
    set({
      mode,
      detectedStopId: null,
      detectedStopDistance: null,
      selectedRouteKey: null,
      pendingStopId: null,
      pendingStopDistance: null,
      dismissedStopIds: new Set(),
      nextSequence: 1,
    })
  },

  setDetectedStop: (stopId, distance) => {
    set({ detectedStopId: stopId, detectedStopDistance: distance })
  },

  setSelectedRouteKey: (routeKey) => {
    set({
      selectedRouteKey: routeKey,
      pendingStopId: null,
      pendingStopDistance: null,
      dismissedStopIds: new Set(),
      nextSequence: 1,
    })
  },

  setPendingStop: (stopId, distance) => {
    set({ pendingStopId: stopId, pendingStopDistance: distance })
  },

  linkStopToRoute: (stopId, routeKey) => {
    const { sessionEntries, mode, nextSequence } = get()
    const entry: FieldCollectionEntry = {
      stop_id: stopId,
      route_key: routeKey,
      sequence: mode === 'on-bus' ? nextSequence : 0,
      timestamp: Date.now(),
    }
    const updated = [...sessionEntries, entry]
    persistEntries(updated)
    set({
      sessionEntries: updated,
      nextSequence: mode === 'on-bus' ? nextSequence + 1 : nextSequence,
    })
  },

  confirmPendingStop: () => {
    const { pendingStopId, selectedRouteKey } = get()
    if (pendingStopId === null || !selectedRouteKey) return
    get().linkStopToRoute(pendingStopId, selectedRouteKey)
    set({ pendingStopId: null, pendingStopDistance: null })
  },

  dismissPendingStop: () => {
    const { pendingStopId, dismissedStopIds } = get()
    if (pendingStopId === null) return
    const updated = new Set(dismissedStopIds)
    updated.add(pendingStopId)
    set({ pendingStopId: null, pendingStopDistance: null, dismissedStopIds: updated })
  },

  saveEntriesToServer: async () => {
    const { sessionEntries } = get()
    if (sessionEntries.length === 0) return true

    set({ saving: true, lastSaveError: null })
    try {
      const { saveFieldLinks } = await import('../lib/fieldMapperApi')
      const result = await saveFieldLinks(sessionEntries)
      if (result.success) {
        set({ saving: false, sessionEntries: [] })
        persistEntries([])
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

  reset: () => {
    persistEntries([])
    set({
      mode: null,
      sessionEntries: [],
      detectedStopId: null,
      detectedStopDistance: null,
      selectedRouteKey: null,
      pendingStopId: null,
      pendingStopDistance: null,
      dismissedStopIds: new Set(),
      nextSequence: 1,
      saving: false,
      lastSaveError: null,
    })
  },
}))
