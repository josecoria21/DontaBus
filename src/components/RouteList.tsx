import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTE_COLORS } from '../lib/constants'
import { getRouteGroupKey } from '../lib/routeGrouping'
import { BusImage } from './BusImage'
import type { RouteFeature } from '../types'

interface Props {
  routes: RouteFeature[]
  searchQuery: string
}

interface RouteGroup {
  groupKey: string
  routes: RouteFeature[]
}

export function RouteList({ routes, searchQuery }: Props) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [typeFilter, setTypeFilter] = useState<string>('all')

  const groups = useMemo(() => {
    let result = routes
    if (typeFilter !== 'all') {
      result = result.filter((r) => r.properties.route_type === typeFilter)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((r) => {
        const p = r.properties
        return (
          p.route_num.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.route_key.toLowerCase().includes(q)
        )
      })
    }
    const sorted = result.sort((a, b) => {
      const numA = parseInt(a.properties.route_num) || 0
      const numB = parseInt(b.properties.route_num) || 0
      if (numA !== numB) return numA - numB
      return a.properties.direction.localeCompare(b.properties.direction)
    })

    // Group by route group key
    const map = new Map<string, RouteGroup>()
    for (const route of sorted) {
      const gk = getRouteGroupKey(route.properties)
      if (!map.has(gk)) {
        map.set(gk, { groupKey: gk, routes: [] })
      }
      map.get(gk)!.routes.push(route)
    }
    return Array.from(map.values())
  }, [routes, searchQuery, typeFilter])

  const types = ['all', 'circuito', 'ruta', 'circuito_alterno']

  return (
    <div>
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setTypeFilter(type)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              typeFilter === type
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {type === 'all' ? t('all_types') : t(`route_type_${type}`, { defaultValue: type })}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          {t('no_routes_found')}
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((group) => {
            const primary = group.routes[0]
            const p = primary.properties
            const color = ROUTE_COLORS[p.route_type] || '#6366f1'
            const isMulti = group.routes.length > 1

            return (
              <div
                key={group.groupKey}
                className="w-full text-left flex items-center gap-3 p-3 rounded-lg bg-white shadow-sm border border-slate-100/50 hover:border-blue-200 hover:shadow-md transition-all cursor-pointer"
                onClick={() => navigate(`/routes/${encodeURIComponent(p.route_key)}`)}
              >
                <div className="relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-slate-100">
                  <BusImage
                    routeNum={p.route_num}
                    alt={t('bus_photo_alt', { num: p.route_num })}
                    className="w-full h-full"
                  />
                  <span
                    className="absolute bottom-0 left-0 right-0 text-center text-white text-[10px] font-bold py-0.5"
                    style={{ backgroundColor: color }}
                  >
                    {p.route_num}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm text-slate-800 truncate">
                    {p.name}
                  </div>
                  <div className="text-[9px] font-mono text-slate-300 truncate">
                    {p.route_key}
                  </div>
                  {isMulti ? (
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-xs text-slate-400 capitalize">
                        {t(`route_type_${p.route_type}`, { defaultValue: p.route_type })}
                      </span>
                      <span className="text-xs text-slate-300 mx-0.5">·</span>
                      {group.routes.map((r) => (
                        <button
                          key={r.properties.route_key}
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/routes/${encodeURIComponent(r.properties.route_key)}`)
                          }}
                          className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700 capitalize transition-colors"
                        >
                          {t(`direction_${r.properties.direction}`, { defaultValue: r.properties.direction })}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 capitalize">
                      {t(`route_type_${p.route_type}`, { defaultValue: p.route_type })} · {t(`direction_${p.direction}`, { defaultValue: p.direction })}
                    </div>
                  )}
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-300 flex-shrink-0">
                  <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                </svg>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
