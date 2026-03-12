import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDistance } from '../../lib/geo'
import type { RoutesGeoJSON, FieldCollectionEntry } from '../../types'

interface Props {
  selectedRouteKey: string | null
  pendingStopId: number | null
  pendingStopDistance: number | null
  routes: RoutesGeoJSON | null
  sessionEntries: FieldCollectionEntry[]
  userPosition: { lat: number; lng: number } | null
  onSelectRoute: (routeKey: string) => void
  onConfirm: () => void
  onDismiss: () => void
  onAddNewStop: () => void
}

export function OnBusPanel({
  selectedRouteKey,
  pendingStopId,
  pendingStopDistance,
  routes,
  sessionEntries,
  userPosition,
  onSelectRoute,
  onConfirm,
  onDismiss,
  onAddNewStop,
}: Props) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')

  const filteredRoutes = useMemo(() => {
    if (!routes) return []
    const q = search.toLowerCase().trim()
    return routes.features.filter(r => {
      if (!q) return true
      return (
        r.properties.route_key.toLowerCase().includes(q) ||
        r.properties.route_num.toLowerCase().includes(q) ||
        r.properties.name.toLowerCase().includes(q)
      )
    })
  }, [routes, search])

  const stopsCollectedForRoute = useMemo(() => {
    if (!selectedRouteKey) return 0
    return sessionEntries.filter(e => e.route_key === selectedRouteKey).length
  }, [sessionEntries, selectedRouteKey])

  // Route picker sub-state
  if (!selectedRouteKey) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800 mb-2">{t('field_select_route')}</h3>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('search_placeholder')}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {filteredRoutes.map(route => (
              <button
                key={route.properties.route_key}
                onClick={() => onSelectRoute(route.properties.route_key)}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm bg-white hover:bg-green-50 active:bg-green-100 transition-colors"
              >
                <span className="font-medium">{route.properties.route_num}</span>
                <span className="text-slate-500 ml-2">{route.properties.name}</span>
                <span className="text-slate-400 ml-1 text-xs">({route.properties.direction})</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const selectedRoute = routes?.features.find(r => r.properties.route_key === selectedRouteKey)

  // Active tracking sub-state
  return (
    <div className="flex flex-col h-full">
      {/* Active route banner */}
      <div className="p-3 border-b border-slate-200 bg-green-50">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-green-600 font-medium">{t('field_riding')}</span>
            <div className="font-semibold text-green-900">
              {selectedRoute?.properties.route_num} — {selectedRoute?.properties.name}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-green-600 text-white text-xs font-bold px-2 py-1 rounded-full">
              {stopsCollectedForRoute} {t('stops')}
            </span>
          </div>
        </div>
      </div>

      {/* Pending stop detection card */}
      <div className="flex-1 flex items-center justify-center p-4">
        {pendingStopId !== null ? (
          <div className="w-full max-w-sm bg-white rounded-xl shadow-lg border-2 border-amber-300 p-5">
            <div className="text-center mb-4">
              <div className="text-lg font-semibold text-slate-800">
                {t('field_stop_detected', { id: pendingStopId })}
              </div>
              {pendingStopDistance !== null && (
                <div className="text-sm text-slate-500">
                  {formatDistance(pendingStopDistance)}
                </div>
              )}
            </div>
            <div className="text-center text-sm text-slate-600 mb-4">
              {t('field_add_stop_question', { stop: pendingStopId, route: selectedRoute?.properties.route_num || selectedRouteKey })}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onDismiss}
                className="flex-1 py-3 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 active:bg-slate-300 transition-colors"
              >
                No
              </button>
              <button
                onClick={() => {
                  onConfirm()
                  // Vibrate on confirm if available
                  try { navigator.vibrate?.(100) } catch { /* ignore */ }
                }}
                className="flex-1 py-3 rounded-lg bg-green-500 text-white font-bold hover:bg-green-600 active:bg-green-700 transition-colors"
              >
                {t('field_yes_add')}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-slate-400">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-slate-300 animate-pulse" />
            </div>
            <p>{t('field_waiting_stop')}</p>

            {/* Rapid-fire: drop a new stop at current location */}
            {userPosition && (
              <button
                onClick={() => {
                  onAddNewStop()
                  try { navigator.vibrate?.(100) } catch { /* ignore */ }
                }}
                className="mt-6 w-full max-w-xs mx-auto flex items-center justify-center gap-2 py-4 rounded-2xl bg-amber-500 text-white font-bold text-base shadow-lg active:bg-amber-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                  <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                </svg>
                {t('field_drop_stop_here')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
