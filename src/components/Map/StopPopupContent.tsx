import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { openWalkingDirections } from '../../lib/directions'
import { getRouteGroupKey } from '../../lib/routeGrouping'
import type { RoutesGeoJSON } from '../../types'

interface Props {
  stopId: number
  lat: number
  lng: number
  routeKeys: string[]
  routes: RoutesGeoJSON | null
  onSelectRoute: (routeKey: string) => void
}

interface RouteGroup {
  groupKey: string
  label: string
  keys: { routeKey: string; direction: string }[]
}

export function StopPopupContent({ stopId, lat, lng, routeKeys, routes, onSelectRoute }: Props) {
  const { t } = useTranslation()

  const groups = useMemo(() => {
    const map = new Map<string, RouteGroup>()
    for (const rk of routeKeys) {
      const feature = routes?.features.find((f) => f.properties.route_key === rk)
      if (!feature) continue
      const groupKey = getRouteGroupKey({ route_key: rk })
      const direction = feature.properties.direction
      const label = `${feature.properties.route_num} - ${feature.properties.name}`

      if (!map.has(groupKey)) {
        map.set(groupKey, { groupKey, label, keys: [] })
      }
      map.get(groupKey)!.keys.push({ routeKey: rk, direction })
    }
    return Array.from(map.values())
  }, [routeKeys, routes])

  const uniqueGroupCount = groups.length

  return (
    <div className="text-sm">
      <div className="font-semibold mb-1">
        {t('stop_label', { id: stopId })}
      </div>
      <div className="text-xs text-gray-500 mb-2">
        {t('routes_at_stop')} ({uniqueGroupCount})
      </div>
      <div className="max-h-40 overflow-y-auto space-y-1">
        {groups.map((group) =>
          group.keys.length === 1 ? (
            <button
              key={group.keys[0].routeKey}
              className="block w-full text-left text-sm px-3 py-2 rounded hover:bg-blue-50 text-blue-700 truncate min-h-[44px]"
              onClick={() => onSelectRoute(group.keys[0].routeKey)}
            >
              {group.label}
            </button>
          ) : (
            <div key={group.groupKey} className="px-2 py-1">
              <div className="text-xs text-slate-700 truncate">{group.label}</div>
              <div className="flex gap-1 mt-0.5">
                {group.keys.map(({ routeKey, direction }) => (
                  <button
                    key={routeKey}
                    className="text-xs px-2.5 py-1.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 capitalize min-h-[36px]"
                    onClick={() => onSelectRoute(routeKey)}
                  >
                    {t(`direction_${direction}`, { defaultValue: direction })}
                  </button>
                ))}
              </div>
            </div>
          ),
        )}
      </div>
      <button
        aria-label={t('get_directions_label')}
        className="mt-2 w-full flex items-center justify-center gap-1 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded py-2.5 min-h-[44px] transition-colors"
        onClick={() => openWalkingDirections(lat, lng)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
          <path fillRule="evenodd" d="M8.157 2.176a1.5 1.5 0 0 0-1.147 0l-4.084 1.69A1.5 1.5 0 0 0 2 5.25v10.877a1.5 1.5 0 0 0 2.074 1.386l3.51-1.453 4.26 1.763a1.5 1.5 0 0 0 1.146 0l4.083-1.69A1.5 1.5 0 0 0 18 14.75V3.872a1.5 1.5 0 0 0-2.073-1.386l-3.51 1.453-4.26-1.763ZM7.58 5a.75.75 0 0 1 .75.75v6.5a.75.75 0 0 1-1.5 0v-6.5A.75.75 0 0 1 7.58 5Zm5.59 2.75a.75.75 0 0 0-1.5 0v6.5a.75.75 0 0 0 1.5 0v-6.5Z" clipRule="evenodd" />
        </svg>
        {t('get_directions')}
      </button>
    </div>
  )
}
