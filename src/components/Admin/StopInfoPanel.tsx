import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useStopEditorStore } from '../../store/stopEditorStore'

export function StopInfoPanel() {
  const { t } = useTranslation()
  const features = useStopEditorStore(s => s.features)
  const stopRoutes = useStopEditorStore(s => s.stopRoutes)
  const selectedStopId = useStopEditorStore(s => s.selectedStopId)
  const selectStop = useStopEditorStore(s => s.selectStop)
  const moveStop = useStopEditorStore(s => s.moveStop)
  const deleteStop = useStopEditorStore(s => s.deleteStop)
  const mergeMode = useStopEditorStore(s => s.mergeMode)
  const startMerge = useStopEditorStore(s => s.startMerge)

  const feature = selectedStopId !== null
    ? features.find(f => f.properties.stop_id === selectedStopId)
    : null

  const [latInput, setLatInput] = useState('')
  const [lngInput, setLngInput] = useState('')

  useEffect(() => {
    if (feature) {
      setLngInput(feature.geometry.coordinates[0].toFixed(6))
      setLatInput(feature.geometry.coordinates[1].toFixed(6))
    }
  }, [feature])

  if (mergeMode) return null
  if (!feature || selectedStopId === null) return null

  const routes = stopRoutes?.[String(selectedStopId)] ?? []

  function handleCoordsBlur() {
    const lat = parseFloat(latInput)
    const lng = parseFloat(lngInput)
    if (!isNaN(lat) && !isNaN(lng) && selectedStopId !== null) {
      moveStop(selectedStopId, lng, lat)
    }
  }

  function handleDelete() {
    if (selectedStopId === null) return
    if (window.confirm(t('admin_confirm_delete'))) {
      deleteStop(selectedStopId)
    }
  }

  return (
    <div className="absolute bottom-[4.5rem] left-3 right-3 z-[1001] bg-white/95 backdrop-blur rounded-lg shadow-lg p-3 max-w-md mx-auto">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-800">
            Stop #{feature.properties.stop_id}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Routes: {feature.properties.num_routes} · Count: {feature.properties.original_count}
          </div>
        </div>
        <button
          onClick={() => selectStop(null)}
          className="text-slate-400 hover:text-slate-600 p-0.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </div>

      <div className="flex gap-2 mt-2">
        <label className="flex-1">
          <span className="text-[10px] text-slate-400 uppercase">Lat</span>
          <input
            type="text"
            value={latInput}
            onChange={e => setLatInput(e.target.value)}
            onBlur={handleCoordsBlur}
            onKeyDown={e => e.key === 'Enter' && handleCoordsBlur()}
            className="w-full text-xs border border-slate-300 rounded px-1.5 py-1 font-mono"
          />
        </label>
        <label className="flex-1">
          <span className="text-[10px] text-slate-400 uppercase">Lng</span>
          <input
            type="text"
            value={lngInput}
            onChange={e => setLngInput(e.target.value)}
            onBlur={handleCoordsBlur}
            onKeyDown={e => e.key === 'Enter' && handleCoordsBlur()}
            className="w-full text-xs border border-slate-300 rounded px-1.5 py-1 font-mono"
          />
        </label>
      </div>

      {routes.length > 0 && (
        <div className="mt-2">
          <div className="text-[10px] text-slate-400 uppercase mb-0.5">{t('routes_at_stop')}</div>
          <div className="flex flex-wrap gap-1">
            {routes.map(rk => (
              <span key={rk} className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                {rk}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleDelete}
        className="mt-2 w-full text-xs text-red-600 hover:bg-red-50 border border-red-200 rounded py-1 font-medium transition-colors"
      >
        {t('admin_delete_stop')}
      </button>

      <button
        onClick={startMerge}
        className="mt-1.5 w-full text-xs text-teal-700 hover:bg-teal-50 border border-teal-200 rounded py-1 font-medium transition-colors"
      >
        {t('admin_merge_stops')}
      </button>
    </div>
  )
}
