import { useEffect, useRef } from 'react'
import L from 'leaflet'
import { useMap } from 'react-leaflet'
import { useStopEditorStore } from '../../store/stopEditorStore'

function makeIcon(selected: boolean, userAdded: boolean = false) {
  const bg = selected ? '#f97316' : userAdded ? '#a855f7' : '#2563eb'
  const border = selected ? (userAdded ? '#7e22ce' : '#ea580c') : userAdded ? '#7e22ce' : '#1d4ed8'
  return L.divIcon({
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    html: `<div style="
      width:14px;height:14px;border-radius:50%;
      background:${bg};
      border:2px solid ${border};
      box-shadow:0 0 3px rgba(0,0,0,0.4);
    "></div>`,
  })
}

function makeMergeTargetIcon() {
  return L.divIcon({
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: `<div style="
      width:20px;height:20px;border-radius:50%;
      background:#10b981;
      border:3px solid #059669;
      box-shadow:0 0 6px rgba(16,185,129,0.6);
    "></div>`,
  })
}

function makeMergeSourceIcon() {
  return L.divIcon({
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    html: `<div style="
      width:16px;height:16px;border-radius:50%;
      background:#ef4444;
      border:2px solid #dc2626;
      box-shadow:0 0 4px rgba(239,68,68,0.5);
    "></div>`,
  })
}

const defaultIcon = makeIcon(false)
const selectedIcon = makeIcon(true)
const userAddedIcon = makeIcon(false, true)
const userAddedSelectedIcon = makeIcon(true, true)
const mergeTargetIcon = makeMergeTargetIcon()
const mergeSourceIcon = makeMergeSourceIcon()

function getIcon(stopId: number, selectedStopId: number | null, mergeMode: boolean, mergeTargetId: number | null, mergeSourceIds: number[], userAdded: boolean = false) {
  if (mergeMode) {
    if (stopId === mergeTargetId) return mergeTargetIcon
    if (mergeSourceIds.includes(stopId)) return mergeSourceIcon
    return userAdded ? userAddedIcon : defaultIcon
  }
  if (stopId === selectedStopId) return userAdded ? userAddedSelectedIcon : selectedIcon
  return userAdded ? userAddedIcon : defaultIcon
}

export function EditorMarkers() {
  const map = useMap()
  const layerGroupRef = useRef<L.LayerGroup>(L.layerGroup())
  const markersRef = useRef<Map<number, L.Marker>>(new Map())
  const userAddedIdsRef = useRef<Set<number>>(new Set())

  useEffect(() => {
    layerGroupRef.current.addTo(map)
    return () => { layerGroupRef.current.remove() }
  }, [map])

  useEffect(() => {
    const unsubscribe = useStopEditorStore.subscribe((state, prevState) => {
      const { features, selectedStopId, dragMode, pendingMove, mergeMode, mergeTargetId, mergeSourceIds } = state
      const prevFeatures = prevState.features
      const prevSelectedId = prevState.selectedStopId
      const prevDragMode = prevState.dragMode
      const prevPending = prevState.pendingMove
      const prevMergeMode = prevState.mergeMode
      const prevMergeTargetId = prevState.mergeTargetId
      const prevMergeSourceIds = prevState.mergeSourceIds

      // Full rebuild if features array changed (undo/redo/add/delete/merge)
      if (features !== prevFeatures) {
        rebuild(features, selectedStopId, dragMode, mergeMode, mergeTargetId, mergeSourceIds)
        return
      }

      // Pending move was cancelled — snap marker back to original position
      if (prevPending && !pendingMove && features === prevFeatures) {
        const m = markersRef.current.get(prevPending.stopId)
        if (m) m.setLatLng([prevPending.oldLat, prevPending.oldLng])
      }

      // Drag mode toggled — update draggable on all markers
      if (dragMode !== prevDragMode) {
        for (const marker of markersRef.current.values()) {
          if (dragMode) marker.dragging?.enable()
          else marker.dragging?.disable()
        }
      }

      // Merge state changed — update icons without full rebuild
      if (mergeMode !== prevMergeMode || mergeTargetId !== prevMergeTargetId || mergeSourceIds !== prevMergeSourceIds) {
        for (const [stopId, marker] of markersRef.current.entries()) {
          marker.setIcon(getIcon(stopId, selectedStopId, mergeMode, mergeTargetId, mergeSourceIds, userAddedIdsRef.current.has(stopId)))
        }
        return
      }

      // Just selection changed
      if (selectedStopId !== prevSelectedId) {
        if (prevSelectedId !== null) {
          const m = markersRef.current.get(prevSelectedId)
          if (m) m.setIcon(getIcon(prevSelectedId, selectedStopId, mergeMode, mergeTargetId, mergeSourceIds, userAddedIdsRef.current.has(prevSelectedId)))
        }
        if (selectedStopId !== null) {
          const m = markersRef.current.get(selectedStopId)
          if (m) m.setIcon(getIcon(selectedStopId, selectedStopId, mergeMode, mergeTargetId, mergeSourceIds, userAddedIdsRef.current.has(selectedStopId)))
        }
      }
    })

    // Initial build
    const { features, selectedStopId, dragMode, mergeMode, mergeTargetId, mergeSourceIds } = useStopEditorStore.getState()
    if (features.length > 0) rebuild(features, selectedStopId, dragMode, mergeMode, mergeTargetId, mergeSourceIds)

    return unsubscribe
  }, [])

  function rebuild(
    features: ReturnType<typeof useStopEditorStore.getState>['features'],
    selectedStopId: number | null,
    dragMode: boolean,
    mergeMode: boolean,
    mergeTargetId: number | null,
    mergeSourceIds: number[]
  ) {
    layerGroupRef.current.clearLayers()
    markersRef.current.clear()

    // Build user-added lookup
    const addedIds = new Set<number>()
    for (const f of features) {
      if (f.properties.original_count === 0) addedIds.add(f.properties.stop_id)
    }
    userAddedIdsRef.current = addedIds

    for (const f of features) {
      const stopId = f.properties.stop_id
      const [lng, lat] = f.geometry.coordinates
      const isUserAdded = addedIds.has(stopId)
      const marker = L.marker([lat, lng], {
        draggable: dragMode && !mergeMode,
        icon: getIcon(stopId, selectedStopId, mergeMode, mergeTargetId, mergeSourceIds, isUserAdded),
      })

      marker.bindTooltip(`#${stopId}`, { direction: 'top', offset: [0, -8] })

      marker.on('click', () => {
        const store = useStopEditorStore.getState()
        if (store.mergeMode) {
          store.toggleMergeSource(stopId)
        } else {
          store.selectStop(stopId)
        }
      })

      marker.on('dragend', () => {
        const pos = marker.getLatLng()
        const store = useStopEditorStore.getState()
        if (store.pendingMove) {
          marker.setLatLng([lat, lng])
          return
        }
        store.setPendingMove({
          stopId,
          oldLng: lng,
          oldLat: lat,
          newLng: pos.lng,
          newLat: pos.lat,
        })
      })

      marker.addTo(layerGroupRef.current)
      markersRef.current.set(stopId, marker)
    }
  }

  return null
}
