import { useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useGeolocation } from '../hooks/useGeolocation'
import { useRouteData } from '../hooks/useRouteData'
import { useNearestStopAll } from '../hooks/useNearestStopAll'
import { useFieldStopDetector } from '../hooks/useFieldStopDetector'
import { useFieldMapperStore } from '../store/fieldMapperStore'
import { ModeSelector } from '../components/FieldMapper/ModeSelector'
import { AtStopPanel } from '../components/FieldMapper/AtStopPanel'
import { OnBusPanel } from '../components/FieldMapper/OnBusPanel'
import { FieldMapView } from '../components/FieldMapper/FieldMapView'
import { SessionLog } from '../components/FieldMapper/SessionLog'

export function FieldMapperPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { position, accuracy, error: geoError, startWatching, locate } = useGeolocation()
  const { routes, stops, loading } = useRouteData()

  const mode = useFieldMapperStore(s => s.mode)
  const sessionEntries = useFieldMapperStore(s => s.sessionEntries)
  const detectedStopId = useFieldMapperStore(s => s.detectedStopId)
  const detectedStopDistance = useFieldMapperStore(s => s.detectedStopDistance)
  const selectedRouteKey = useFieldMapperStore(s => s.selectedRouteKey)
  const pendingStopId = useFieldMapperStore(s => s.pendingStopId)
  const pendingStopDistance = useFieldMapperStore(s => s.pendingStopDistance)
  const dismissedStopIds = useFieldMapperStore(s => s.dismissedStopIds)
  const saving = useFieldMapperStore(s => s.saving)
  const lastSaveError = useFieldMapperStore(s => s.lastSaveError)

  const setMode = useFieldMapperStore(s => s.setMode)
  const setDetectedStop = useFieldMapperStore(s => s.setDetectedStop)
  const setSelectedRouteKey = useFieldMapperStore(s => s.setSelectedRouteKey)
  const setPendingStop = useFieldMapperStore(s => s.setPendingStop)
  const linkStopToRoute = useFieldMapperStore(s => s.linkStopToRoute)
  const confirmPendingStop = useFieldMapperStore(s => s.confirmPendingStop)
  const dismissPendingStop = useFieldMapperStore(s => s.dismissPendingStop)
  const saveEntriesToServer = useFieldMapperStore(s => s.saveEntriesToServer)
  const reset = useFieldMapperStore(s => s.reset)

  // Start GPS on mount
  useEffect(() => {
    startWatching()
    locate()
  }, [startWatching, locate])

  // Mode A: detect nearest stop
  const nearestStop = useNearestStopAll(stops, position)

  useEffect(() => {
    if (mode === 'at-stop') {
      setDetectedStop(
        nearestStop?.stopId ?? null,
        nearestStop?.distance ?? null
      )
    }
  }, [mode, nearestStop, setDetectedStop])

  // Mode B: stop detector
  const handleStopDetected = useCallback((stopId: number, distance: number) => {
    setPendingStop(stopId, distance)
    try { navigator.vibrate?.(200) } catch { /* ignore */ }
  }, [setPendingStop])

  useFieldStopDetector({
    stops,
    userPosition: position,
    routeKey: selectedRouteKey,
    dismissedStopIds,
    sessionEntries,
    onStopDetected: handleStopDetected,
    enabled: mode === 'on-bus' && selectedRouteKey !== null,
  })

  const handleSave = async () => {
    const ok = await saveEntriesToServer()
    if (ok) {
      reset()
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-[999] bg-white flex items-center justify-center">
        <span className="text-slate-500">{t('loading')}</span>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[999] bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-200 bg-white z-10">
        <button
          onClick={() => navigate('/admin/stops')}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-700">
            <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
          </svg>
        </button>
        <h1 className="font-semibold text-slate-800">{t('field_title')}</h1>
        {mode && (
          <button
            onClick={() => setMode(null)}
            className="ml-auto text-xs text-slate-500 hover:text-slate-700 px-2 py-1"
          >
            {t('field_change_mode')}
          </button>
        )}
      </div>

      {/* GPS error */}
      {geoError && (
        <div className="px-4 py-2 bg-red-50 text-red-700 text-sm">
          {t(geoError)}
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 min-h-0 flex flex-col">
        {!mode ? (
          <ModeSelector onSelectMode={setMode} />
        ) : (
          <div className="flex-1 min-h-0 flex flex-col">
            {/* Map section - takes 40% */}
            <div className="h-2/5 min-h-0">
              <FieldMapView
                stops={stops}
                routes={routes}
                userPosition={position}
                accuracy={accuracy}
                sessionEntries={sessionEntries}
                selectedRouteKey={selectedRouteKey}
                detectedStopId={mode === 'at-stop' ? detectedStopId : pendingStopId}
              />
            </div>

            {/* Panel section - takes 60% */}
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="flex-1 min-h-0 overflow-y-auto">
                {mode === 'at-stop' ? (
                  <AtStopPanel
                    detectedStopId={detectedStopId}
                    detectedStopDistance={detectedStopDistance}
                    routes={routes}
                    sessionEntries={sessionEntries}
                    onLinkRoute={(routeKey) => {
                      if (detectedStopId !== null) {
                        linkStopToRoute(detectedStopId, routeKey)
                      }
                    }}
                  />
                ) : (
                  <OnBusPanel
                    selectedRouteKey={selectedRouteKey}
                    pendingStopId={pendingStopId}
                    pendingStopDistance={pendingStopDistance}
                    routes={routes}
                    sessionEntries={sessionEntries}
                    onSelectRoute={setSelectedRouteKey}
                    onConfirm={confirmPendingStop}
                    onDismiss={dismissPendingStop}
                  />
                )}
              </div>

              {/* Session log at bottom */}
              <SessionLog
                entries={sessionEntries}
                saving={saving}
                lastSaveError={lastSaveError}
                onSave={handleSave}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
