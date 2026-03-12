import { useParams, useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouteData } from '../hooks/useRouteData'
import { useMapStore } from '../store/mapStore'
import { ROUTE_COLORS } from '../lib/constants'
import { getSiblingRoutes } from '../lib/routeGrouping'
import { BusImage } from '../components/BusImage'

export function RouteDetailPage() {
  const { routeKey } = useParams<{ routeKey: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { routes, routeStops, stops, loading } = useRouteData()
  const setSelectedRoute = useMapStore((s) => s.setSelectedRoute)

  const route = useMemo(() => {
    if (!routes || !routeKey) return null
    return routes.features.find(
      (f) => f.properties.route_key === decodeURIComponent(routeKey)
    )
  }, [routes, routeKey])

  const siblings = useMemo(() => {
    if (!routes || !routeKey) return []
    return getSiblingRoutes(decodeURIComponent(routeKey), routes.features)
  }, [routes, routeKey])

  const stopSequence = useMemo(() => {
    if (!routeStops || !routeKey || !stops) return []
    const seq = routeStops[decodeURIComponent(routeKey)] || []
    return seq.map((entry) => {
      const stop = stops.features.find(
        (s) => s.properties.stop_id === entry.stop_id
      )
      return { ...entry, stop }
    })
  }, [routeStops, routeKey, stops])

  const totalTime = useMemo(() => {
    return stopSequence.reduce(
      (sum, s) => sum + (s.travel_time || 0) + (s.dwell_time || 0),
      0
    )
  }, [stopSequence])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <svg className="w-8 h-8 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" />
        </svg>
        <div className="text-slate-400 text-sm">{t('loading')}</div>
      </div>
    )
  }

  if (!route) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-slate-400">{t('route_not_found')}</div>
      </div>
    )
  }

  const p = route.properties
  const color = ROUTE_COLORS[p.route_type] || '#6366f1'

  const handleViewOnMap = () => {
    setSelectedRoute(p.route_key)
    navigate('/')
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="px-4 pt-4 pb-20">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="mt-1 p-1 rounded-full hover:bg-slate-200 text-slate-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="px-2 py-0.5 rounded text-white text-xs font-bold"
                style={{ backgroundColor: color }}
              >
                {p.route_num}
              </span>
              <span className="text-xs text-slate-400 capitalize">
                {t(`route_type_${p.route_type}`, { defaultValue: p.route_type })}
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-800">{p.name}</h1>
            {siblings.length > 1 ? (
              <div className="flex gap-1.5 mt-1">
                {siblings.map((sib) => {
                  const isActive = sib.properties.route_key === p.route_key
                  return (
                    <button
                      key={sib.properties.route_key}
                      onClick={() => {
                        if (!isActive) {
                          navigate(`/routes/${encodeURIComponent(sib.properties.route_key)}`, { replace: true })
                        }
                      }}
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize transition-colors ${
                        isActive
                          ? 'text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                      style={isActive ? { backgroundColor: color } : undefined}
                    >
                      {t(`direction_${sib.properties.direction}`, { defaultValue: sib.properties.direction })}
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-slate-500 capitalize">
                {t('direction')}: {t(`direction_${p.direction}`, { defaultValue: p.direction })}
              </p>
            )}
          </div>
        </div>

        {/* Bus photo */}
        <div className="rounded-lg overflow-hidden mb-4">
          <BusImage
            routeNum={p.route_num}
            alt={t('bus_photo_alt', { num: p.route_num })}
            className="w-full h-48 sm:h-56"
          />
        </div>

        {/* View on map */}
        <button
          onClick={handleViewOnMap}
          className="w-full mb-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          {t('view_on_map')}
        </button>

        {/* Frequency */}
        {(p.peak_am || p.midday || p.peak_pm || p.night) && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-100/50 p-4 mb-4" style={{ borderLeftColor: color, borderLeftWidth: '3px' }}>
            <h2 className="text-sm font-semibold text-slate-700 mb-2">{t('frequency')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              {[
                { label: t('peak_am'), value: p.peak_am },
                { label: t('midday'), value: p.midday },
                { label: t('peak_pm'), value: p.peak_pm },
                { label: t('night'), value: p.night },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="text-xs text-slate-400">{label}</div>
                  <div className="text-lg font-bold text-slate-700">
                    {value ?? '—'}
                  </div>
                  {value && <div className="text-xs text-slate-400">{t('minutes')}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stop list */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-100/50 p-4" style={{ borderLeftColor: color, borderLeftWidth: '3px' }}>
          <h2 className="text-sm font-semibold text-slate-700 mb-1">
            {t('stops')}
          </h2>
          <p className="text-xs text-slate-400 mb-3">
            {t('stop_count', { count: stopSequence.length })}
            {totalTime > 0 && ` · ${t('travel_time')}: ${Math.round(totalTime / 60)} ${t('minutes')}`}
          </p>
          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute left-[9px] top-3 bottom-3 w-0.5"
              style={{ backgroundColor: color }}
            />
            <div className="space-y-0">
              {stopSequence.map((entry, i) => (
                <div key={`${entry.stop_id}-${i}`} className="flex items-start gap-3 py-2">
                  <div
                    className="relative z-10 mt-1 w-[18px] h-[18px] rounded-full border-2 flex-shrink-0"
                    style={{
                      borderColor: color,
                      backgroundColor: i === 0 || i === stopSequence.length - 1 ? color : '#fff',
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm text-slate-700">
                      {t('stop_label', { id: entry.stop_id })}
                    </div>
                    {entry.travel_time > 0 && (
                      <div className="text-xs text-slate-400">
                        +{Math.round(entry.travel_time / 60)} {t('minutes')}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
