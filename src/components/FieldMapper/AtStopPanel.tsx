import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatDistance } from '../../lib/geo'
import type { RoutesGeoJSON, FieldCollectionEntry } from '../../types'

interface Props {
  detectedStopId: number | null
  detectedStopDistance: number | null
  routes: RoutesGeoJSON | null
  sessionEntries: FieldCollectionEntry[]
  onLinkRoute: (routeKey: string) => void
}

export function AtStopPanel({ detectedStopId, detectedStopDistance, routes, sessionEntries, onLinkRoute }: Props) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [lastLinked, setLastLinked] = useState<string | null>(null)

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

  // Routes already linked to this stop in this session
  const linkedRouteKeys = useMemo(() => {
    if (detectedStopId === null) return new Set<string>()
    return new Set(
      sessionEntries
        .filter(e => e.stop_id === detectedStopId)
        .map(e => e.route_key)
    )
  }, [sessionEntries, detectedStopId])

  const handleLink = (routeKey: string) => {
    onLinkRoute(routeKey)
    setLastLinked(routeKey)
    setTimeout(() => setLastLinked(null), 2000)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Detected stop banner */}
      <div className="p-3 border-b border-slate-200">
        {detectedStopId !== null ? (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <span className="font-medium text-slate-800">
              {t('field_at_stop', { id: detectedStopId })}
            </span>
            {detectedStopDistance !== null && (
              <span className="text-sm text-slate-500">
                ({formatDistance(detectedStopDistance)})
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-slate-300 animate-pulse" />
            <span className="text-slate-500">{t('field_searching_stop')}</span>
          </div>
        )}
      </div>

      {/* Search routes */}
      <div className="p-3 border-b border-slate-200">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('search_placeholder')}
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Success feedback */}
      {lastLinked && (
        <div className="mx-3 mt-2 px-3 py-2 rounded-lg bg-green-100 text-green-800 text-sm font-medium">
          {t('field_linked_success', { route: lastLinked })}
        </div>
      )}

      {/* Route list */}
      <div className="flex-1 overflow-y-auto p-2">
        {detectedStopId === null ? (
          <p className="text-center text-slate-400 text-sm mt-8">{t('field_move_closer')}</p>
        ) : (
          <div className="space-y-1">
            {filteredRoutes.map(route => {
              const rk = route.properties.route_key
              const alreadyLinked = linkedRouteKeys.has(rk)
              return (
                <button
                  key={rk}
                  onClick={() => !alreadyLinked && handleLink(rk)}
                  disabled={alreadyLinked}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    alreadyLinked
                      ? 'bg-green-50 text-green-600 cursor-default'
                      : 'bg-white hover:bg-blue-50 active:bg-blue-100'
                  }`}
                >
                  <span className="font-medium">{route.properties.route_num}</span>
                  <span className="text-slate-500 ml-2">{route.properties.name}</span>
                  <span className="text-slate-400 ml-1 text-xs">({route.properties.direction})</span>
                  {alreadyLinked && <span className="float-right text-green-500">✓</span>}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
