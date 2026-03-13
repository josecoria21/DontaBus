import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ROUTE_COLORS } from '../../lib/constants'
import { openWalkingDirections } from '../../lib/directions'
import { getRouteGroupKey } from '../../lib/routeGrouping'
import type { RouteProperties, RoutesGeoJSON } from '../../types'

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
  routeNum: string
  routeName: string
  routeType: RouteProperties['route_type']
  vehicleType: RouteProperties['vehicle_type']
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
      const p = feature.properties

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          groupKey,
          routeNum: p.route_num,
          routeName: p.name,
          routeType: p.route_type,
          vehicleType: p.vehicle_type,
          keys: [],
        })
      }
      map.get(groupKey)!.keys.push({ routeKey: rk, direction })
    }
    return Array.from(map.values())
  }, [routeKeys, routes])

  const uniqueGroupCount = groups.length

  return (
    <div className="text-sm min-w-[220px]">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="white" className="w-4 h-4">
            <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-slate-800 truncate">
            {t('stop_label', { id: stopId })}
          </div>
          <div className="text-[11px] text-slate-400">
            {t('routes_at_stop')} ({uniqueGroupCount})
          </div>
        </div>
      </div>

      {/* Route list */}
      <div className="max-h-48 overflow-y-auto no-scrollbar space-y-1">
        {groups.map((group) => {
          const color = ROUTE_COLORS[group.routeType] || '#6366f1'
          const isSingle = group.keys.length === 1

          return isSingle ? (
            <button
              key={group.keys[0].routeKey}
              className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition-colors text-left min-h-[44px]"
              onClick={() => onSelectRoute(group.keys[0].routeKey)}
            >
              <div
                className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                style={{ backgroundColor: color }}
              >
                {group.routeNum}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-800 truncate">
                  {group.routeName}
                </div>
                <div className="text-[10px] text-slate-400 capitalize">
                  {t(`route_type_${group.routeType}`, { defaultValue: group.routeType })}
                  {group.vehicleType && (
                    <> · {t(`vehicle_type_${group.vehicleType}`, { defaultValue: group.vehicleType })}</>
                  )}
                </div>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-slate-300 flex-shrink-0">
                <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
              </svg>
            </button>
          ) : (
            <div key={group.groupKey} className="p-2 rounded-lg">
              <div className="flex items-center gap-2.5">
                <div
                  className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: color }}
                >
                  {group.routeNum}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-slate-800 truncate">
                    {group.routeName}
                  </div>
                  <div className="text-[10px] text-slate-400 capitalize">
                    {t(`route_type_${group.routeType}`, { defaultValue: group.routeType })}
                    {group.vehicleType && (
                      <> · {t(`vehicle_type_${group.vehicleType}`, { defaultValue: group.vehicleType })}</>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5 mt-1.5 ml-[46px]">
                {group.keys.map(({ routeKey, direction }) => (
                  <button
                    key={routeKey}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full capitalize min-h-[28px] transition-colors"
                    style={{
                      backgroundColor: color + '15',
                      color: color,
                    }}
                    onClick={() => onSelectRoute(routeKey)}
                  >
                    {t(`direction_${direction}`, { defaultValue: direction })}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Directions button */}
      <div className="border-t border-slate-100 mt-2 pt-2">
        <button
          aria-label={t('get_directions_label')}
          className="w-full flex items-center justify-center gap-1 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg py-2.5 min-h-[44px] transition-colors"
          onClick={() => openWalkingDirections(lat, lng)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M8.157 2.176a1.5 1.5 0 0 0-1.147 0l-4.084 1.69A1.5 1.5 0 0 0 2 5.25v10.877a1.5 1.5 0 0 0 2.074 1.386l3.51-1.453 4.26 1.763a1.5 1.5 0 0 0 1.146 0l4.083-1.69A1.5 1.5 0 0 0 18 14.75V3.872a1.5 1.5 0 0 0-2.073-1.386l-3.51 1.453-4.26-1.763ZM7.58 5a.75.75 0 0 1 .75.75v6.5a.75.75 0 0 1-1.5 0v-6.5A.75.75 0 0 1 7.58 5Zm5.59 2.75a.75.75 0 0 0-1.5 0v6.5a.75.75 0 0 0 1.5 0v-6.5Z" clipRule="evenodd" />
          </svg>
          {t('get_directions')}
        </button>
      </div>
    </div>
  )
}
