import { useEffect } from 'react'
import { useMapEvents } from 'react-leaflet'
import { useStopEditorStore } from '../../store/stopEditorStore'

export function MapClickHandler() {
  const addMode = useStopEditorStore(s => s.addMode)
  const mergeMode = useStopEditorStore(s => s.mergeMode)
  const addStop = useStopEditorStore(s => s.addStop)

  const map = useMapEvents({
    click(e) {
      if (addMode && !mergeMode) {
        addStop(e.latlng.lng, e.latlng.lat)
      }
    },
  })

  useEffect(() => {
    const container = map.getContainer()
    if (addMode && !mergeMode) {
      container.style.cursor = 'crosshair'
    } else {
      container.style.cursor = ''
    }
    return () => { container.style.cursor = '' }
  }, [addMode, mergeMode, map])

  return null
}
