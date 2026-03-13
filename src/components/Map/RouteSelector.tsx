import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouteData } from '../../hooks/useRouteData'
import { useMapStore } from '../../store/mapStore'
import { getRouteGroupKey, getSiblingRoutes } from '../../lib/routeGrouping'

const PLACEHOLDER_RE = /^Ruta \d{5}$/

export function RouteSelector() {
  const { t } = useTranslation()
  const { routes } = useRouteData()
  const selectedRouteKey = useMapStore((s) => s.selectedRouteKey)
  const setSelectedRoute = useMapStore((s) => s.setSelectedRoute)

  const namedRoutes = useMemo(() => {
    if (!routes) return []
    return routes.features
      .filter((f) => !PLACEHOLDER_RE.test(f.properties.name))
      .sort((a, b) => {
        const an = parseInt(a.properties.route_num, 10)
        const bn = parseInt(b.properties.route_num, 10)
        if (!isNaN(an) && !isNaN(bn)) {
          if (an !== bn) return an - bn
          // Same route_num: sort by direction
          return a.properties.direction.localeCompare(b.properties.direction)
        }
        return a.properties.route_num.localeCompare(b.properties.route_num)
      })
  }, [routes])

  const namedRouteKeys = useMemo(
    () => new Set(namedRoutes.map((f) => f.properties.route_key)),
    [namedRoutes],
  )

  // Group named routes by group key for optgroup rendering
  const optGroups = useMemo(() => {
    const map = new Map<string, typeof namedRoutes>()
    for (const f of namedRoutes) {
      const gk = getRouteGroupKey(f.properties)
      if (!map.has(gk)) map.set(gk, [])
      map.get(gk)!.push(f)
    }
    return Array.from(map.entries())
  }, [namedRoutes])

  // Siblings for the currently selected route
  const siblings = useMemo(() => {
    if (!selectedRouteKey || !routes) return []
    return getSiblingRoutes(selectedRouteKey, routes.features)
  }, [selectedRouteKey, routes])

  // Selected route that isn't in the named list (e.g. selected from stop popup)
  const isUnlistedSelection =
    selectedRouteKey !== null && !namedRouteKeys.has(selectedRouteKey)

  return (
    <div className="absolute top-3 left-3 right-3 z-[1000]">
      {/* Dropdown container */}
      <div className="bg-white rounded-lg shadow-lg px-3 py-2 flex items-center gap-2">
        <select
          value={selectedRouteKey && namedRouteKeys.has(selectedRouteKey) ? selectedRouteKey : ''}
          onChange={(e) => setSelectedRoute(e.target.value || null)}
          aria-label={t('select_route')}
          className="flex-1 min-w-0 appearance-none bg-transparent text-sm text-slate-700 font-medium outline-none cursor-pointer truncate"
        >
          <option value="">{t('select_route')}</option>
          {optGroups.map(([groupKey, features]) =>
            features.length > 1 ? (
              <optgroup key={groupKey} label={features[0].properties.name}>
                {features.map((f) => (
                  <option key={f.properties.route_key} value={f.properties.route_key}>
                    {f.properties.name} — {t(`direction_${f.properties.direction}`, { defaultValue: f.properties.direction })}
                  </option>
                ))}
              </optgroup>
            ) : (
              <option key={features[0].properties.route_key} value={features[0].properties.route_key}>
                {features[0].properties.name}
              </option>
            ),
          )}
        </select>

        {selectedRouteKey ? (
          // Clear button
          <button
            onClick={() => setSelectedRoute(null)}
            aria-label={t('clear_route_label')}
            className="flex-shrink-0 p-2.5 rounded-full hover:bg-slate-100 text-slate-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        ) : (
          // Chevron icon
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 flex-shrink-0 text-slate-500 pointer-events-none">
            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
          </svg>
        )}
      </div>

      {/* Direction toggle strip for multi-direction routes */}
      {selectedRouteKey && siblings.length > 1 && (
        <div className="mt-1.5 bg-white rounded-lg shadow-lg px-3 py-1.5 flex items-center gap-1.5">
          {siblings.map((sib) => {
            const isActive = sib.properties.route_key === selectedRouteKey
            return (
              <button
                key={sib.properties.route_key}
                onClick={() => setSelectedRoute(sib.properties.route_key)}
                aria-pressed={isActive}
                className={`px-2.5 py-2 rounded-full text-sm font-medium capitalize transition-colors min-h-[44px] ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t(`direction_${sib.properties.direction}`, { defaultValue: sib.properties.direction })}
              </button>
            )
          })}
        </div>
      )}

      {/* Fallback banner for unlisted routes */}
      {isUnlistedSelection && siblings.length <= 1 && (
        <div className="mt-1.5 bg-white rounded-lg shadow-lg px-3 py-2 flex items-center justify-between">
          <span className="text-sm text-slate-600 truncate">
            {selectedRouteKey.replace(/_/g, ' ')}
          </span>
          <button
            onClick={() => setSelectedRoute(null)}
            aria-label={t('clear_route_label')}
            className="ml-2 flex-shrink-0 p-2.5 rounded-full hover:bg-slate-100 text-slate-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
