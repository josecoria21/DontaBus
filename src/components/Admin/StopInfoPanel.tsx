import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useStopEditorStore } from '../../store/stopEditorStore'
import { useRouteData } from '../../hooks/useRouteData'

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
  const linkRouteToStop = useStopEditorStore(s => s.linkRouteToStop)
  const unlinkRouteFromStop = useStopEditorStore(s => s.unlinkRouteFromStop)

  const { routes: routeData } = useRouteData()

  const feature = selectedStopId !== null
    ? features.find(f => f.properties.stop_id === selectedStopId)
    : null

  const [latInput, setLatInput] = useState('')
  const [lngInput, setLngInput] = useState('')
  const [showRoutePicker, setShowRoutePicker] = useState(false)
  const [routeSearch, setRouteSearch] = useState('')

  useEffect(() => {
    if (feature) {
      setLngInput(feature.geometry.coordinates[0].toFixed(6))
      setLatInput(feature.geometry.coordinates[1].toFixed(6))
    }
    setShowRoutePicker(false)
    setRouteSearch('')
  }, [feature])

  if (mergeMode) return null
  if (!feature || selectedStopId === null) return null

  const routes = stopRoutes?.[String(selectedStopId)] ?? []
  const linkedSet = new Set(routes)

  // Available routes for linking (not already linked)
  const availableRoutes = routeData?.features.filter(f => {
    if (linkedSet.has(f.properties.route_key)) return false
    if (!routeSearch.trim()) return true
    const q = routeSearch.toLowerCase()
    return (
      f.properties.route_num.toLowerCase().includes(q) ||
      f.properties.name.toLowerCase().includes(q) ||
      f.properties.route_key.toLowerCase().includes(q)
    )
  }) ?? []

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

  // Resolve route display name from route data
  function routeLabel(rk: string) {
    const f = routeData?.features.find(r => r.properties.route_key === rk)
    return f ? `${f.properties.route_num} - ${f.properties.name}` : rk
  }

  return (
    <div className="fixed bottom-[8.5rem] sm:bottom-[4.5rem] left-3 right-3 z-[1003] bg-white/95 backdrop-blur rounded-lg shadow-lg p-3 max-w-md mx-auto max-h-[60vh] overflow-y-auto">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-800">
            Stop #{feature.properties.stop_id}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Routes: {routes.length} · Count: {feature.properties.original_count}
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

      {/* Routes at this stop */}
      <div className="mt-2">
        <div className="text-[10px] text-slate-400 uppercase mb-1">{t('routes_at_stop')}</div>
        {routes.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {routes.map(rk => (
              <button
                key={rk}
                onClick={() => unlinkRouteFromStop(selectedStopId, rk)}
                className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded flex items-center gap-1 hover:bg-red-50 hover:text-red-600 transition-colors"
                title={routeLabel(rk)}
              >
                {routeLabel(rk)}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-2.5 h-2.5">
                  <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                </svg>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-[10px] text-slate-400 italic">{t('no_routes_found')}</div>
        )}
      </div>

      {/* Add route button / picker */}
      {!showRoutePicker ? (
        <button
          onClick={() => setShowRoutePicker(true)}
          className="mt-2 w-full text-xs text-blue-600 hover:bg-blue-50 border border-blue-200 rounded py-1.5 font-medium transition-colors flex items-center justify-center gap-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
          {t('admin_add_route_to_stop')}
        </button>
      ) : (
        <div className="mt-2">
          <input
            type="text"
            value={routeSearch}
            onChange={e => setRouteSearch(e.target.value)}
            placeholder={t('search_placeholder')}
            className="w-full text-xs border border-slate-300 rounded px-2 py-1.5 mb-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
            autoFocus
          />
          <div className="max-h-32 overflow-y-auto space-y-0.5">
            {availableRoutes.length === 0 ? (
              <div className="text-[10px] text-slate-400 text-center py-2">{t('no_routes_found')}</div>
            ) : (
              availableRoutes.map(f => (
                <button
                  key={f.properties.route_key}
                  onClick={() => {
                    linkRouteToStop(selectedStopId, f.properties.route_key)
                    setRouteSearch('')
                  }}
                  className="w-full text-left text-xs px-2 py-1.5 rounded hover:bg-blue-50 text-slate-700 truncate"
                >
                  <span className="font-medium text-blue-700">{f.properties.route_num}</span>
                  {' '}{f.properties.name}
                  <span className="text-slate-400 ml-1 capitalize text-[10px]">
                    ({t(`direction_${f.properties.direction}`, { defaultValue: f.properties.direction })})
                  </span>
                </button>
              ))
            )}
          </div>
          <button
            onClick={() => { setShowRoutePicker(false); setRouteSearch('') }}
            className="mt-1 w-full text-[10px] text-slate-500 hover:text-slate-700 py-0.5"
          >
            {t('admin_cancel')}
          </button>
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
