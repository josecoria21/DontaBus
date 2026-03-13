import { useTranslation } from 'react-i18next'
import { useStopEditorStore } from '../../store/stopEditorStore'
import { haversineDistance, formatDistance } from '../../lib/geo'

export function MergePanel() {
  const { t } = useTranslation()
  const features = useStopEditorStore(s => s.features)
  const stopRoutes = useStopEditorStore(s => s.stopRoutes)
  const mergeMode = useStopEditorStore(s => s.mergeMode)
  const mergeTargetId = useStopEditorStore(s => s.mergeTargetId)
  const mergeSourceIds = useStopEditorStore(s => s.mergeSourceIds)
  const toggleMergeSource = useStopEditorStore(s => s.toggleMergeSource)
  const cancelMerge = useStopEditorStore(s => s.cancelMerge)
  const confirmMerge = useStopEditorStore(s => s.confirmMerge)

  if (!mergeMode || mergeTargetId === null) return null

  const targetFeature = features.find(f => f.properties.stop_id === mergeTargetId)
  if (!targetFeature) return null

  const [targetLng, targetLat] = targetFeature.geometry.coordinates

  const sourceInfos = mergeSourceIds.map(id => {
    const feature = features.find(f => f.properties.stop_id === id)
    const routes = stopRoutes[String(id)] || []
    const [lng, lat] = feature?.geometry.coordinates ?? [0, 0]
    const dist = feature ? haversineDistance(targetLat, targetLng, lat, lng) : 0
    return { id, routes, dist }
  })

  // Compute combined unique routes
  const targetRoutes = stopRoutes[String(mergeTargetId)] || []
  const allRoutes = new Set<string>(targetRoutes)
  for (const src of sourceInfos) {
    for (const r of src.routes) allRoutes.add(r)
  }

  return (
    <div className="fixed bottom-[8.5rem] sm:bottom-[4.5rem] left-3 right-3 z-[1003] bg-white/95 backdrop-blur rounded-lg shadow-lg p-3 max-w-md mx-auto">
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-semibold text-teal-700">
          {t('admin_merge_stops')} &rarr; Stop #{mergeTargetId}
        </div>
        <button
          onClick={cancelMerge}
          className="text-slate-400 hover:text-slate-600 p-0.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </div>

      {mergeSourceIds.length === 0 ? (
        <div className="text-xs text-slate-400 mt-2">
          {t('admin_merge_sources_hint')}
        </div>
      ) : (
        <>
          <div className="text-[10px] text-slate-400 uppercase mt-2 mb-1">{t('admin_merge_sources')}</div>
          <div className="max-h-28 overflow-y-auto space-y-1">
            {sourceInfos.map(src => (
              <div key={src.id} className="flex items-center justify-between bg-red-50 rounded px-2 py-1">
                <span className="text-xs text-slate-700">
                  Stop #{src.id} &middot; {src.routes.length} routes &middot; {formatDistance(src.dist)}
                </span>
                <button
                  onClick={() => toggleMergeSource(src.id)}
                  className="text-red-400 hover:text-red-600 p-0.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <div className="text-xs text-slate-500 mt-2">
            {t('admin_merge_combined_routes', { count: allRoutes.size })}
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {Array.from(allRoutes).map(rk => (
              <span key={rk} className="text-[10px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded">
                {rk}
              </span>
            ))}
          </div>
        </>
      )}

      <div className="flex gap-2 mt-3">
        <button
          onClick={cancelMerge}
          className="flex-1 text-xs text-slate-600 hover:bg-slate-100 border border-slate-200 rounded py-1.5 font-medium transition-colors"
        >
          {t('admin_cancel')}
        </button>
        <button
          onClick={confirmMerge}
          disabled={mergeSourceIds.length === 0}
          className="flex-1 text-xs text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-40 disabled:cursor-not-allowed rounded py-1.5 font-medium transition-colors"
        >
          {mergeSourceIds.length > 0
            ? t('admin_merge_confirm', { count: mergeSourceIds.length })
            : t('admin_merge_no_sources')
          }
        </button>
      </div>
    </div>
  )
}
