import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useRouteData } from '../hooks/useRouteData'
import { useRouteEditorStore } from '../store/routeEditorStore'
import { syncRoutesToSupabase } from '../lib/adminApi'
import { ROUTE_COLORS } from '../lib/constants'
import type { RouteProperties } from '../types'

const ROUTE_TYPES: RouteProperties['route_type'][] = ['ruta', 'circuito', 'circuito_alterno']

const DIRECTION_PRESETS = ['ida', 'vuelta', 'principal', 'ruta_1', 'ruta_2', 'variant_1', 'variant_2']

export function AdminRoutesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { routes, loading } = useRouteData()
  const customRoutes = useRouteEditorStore(s => s.customRoutes)
  const addRoute = useRouteEditorStore(s => s.addRoute)
  const deleteRoute = useRouteEditorStore(s => s.deleteRoute)

  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle')

  // Form state
  const [routeNum, setRouteNum] = useState('')
  const [routeName, setRouteName] = useState('')
  const [routeType, setRouteType] = useState<RouteProperties['route_type']>('ruta')
  const [direction, setDirection] = useState('ida')
  const [customDirection, setCustomDirection] = useState('')

  const customRouteKeys = useMemo(
    () => new Set(customRoutes.map(r => r.properties.route_key)),
    [customRoutes]
  )

  const allRoutes = useMemo(() => {
    if (!routes) return []
    let result = routes.features
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(r => {
        const p = r.properties
        return (
          p.route_num.toLowerCase().includes(q) ||
          p.name.toLowerCase().includes(q) ||
          p.route_key.toLowerCase().includes(q)
        )
      })
    }
    return result.sort((a, b) => {
      // Custom routes first
      const aCustom = customRouteKeys.has(a.properties.route_key) ? 0 : 1
      const bCustom = customRouteKeys.has(b.properties.route_key) ? 0 : 1
      if (aCustom !== bCustom) return aCustom - bCustom
      const numA = parseInt(a.properties.route_num) || 0
      const numB = parseInt(b.properties.route_num) || 0
      if (numA !== numB) return numA - numB
      return a.properties.direction.localeCompare(b.properties.direction)
    })
  }, [routes, search, customRouteKeys])

  function resetForm() {
    setRouteNum('')
    setRouteName('')
    setRouteType('ruta')
    setDirection('ida')
    setCustomDirection('')
    setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const num = routeNum.trim()
    const name = routeName.trim()
    if (!num || !name) {
      setError(t('admin_route_required_fields'))
      return
    }

    const dir = direction === '_custom' ? customDirection : direction
    if (!dir.trim()) {
      setError(t('admin_route_required_fields'))
      return
    }

    const result = addRoute({
      route_num: num,
      name,
      route_type: routeType,
      direction: dir,
    })

    if (result === null) {
      setError(t('admin_route_duplicate'))
      return
    }

    resetForm()
    setShowForm(false)
  }

  function handleDelete(routeKey: string, routeNum: string) {
    if (window.confirm(t('admin_route_confirm_delete', { num: routeNum }))) {
      deleteRoute(routeKey)
    }
  }

  async function handleSync() {
    if (customRoutes.length === 0 || syncing) return
    setSyncing(true)
    setSyncStatus('idle')
    setError(null)
    const result = await syncRoutesToSupabase(customRoutes)
    setSyncing(false)
    setSyncStatus(result.success ? 'success' : 'error')
    if (!result.success) {
      const msg = result.error || 'Unknown error'
      setError(msg)
      alert(`Sync error: ${msg}`)
    }
    setTimeout(() => setSyncStatus('idle'), 5000)
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-[999] bg-white flex items-center justify-center">
        <span className="text-slate-500">{t('loading')}</span>
      </div>
    )
  }

  return (
    <>
      <div className="fixed inset-0 z-[999] bg-slate-50 flex flex-col">
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
          <h1 className="font-semibold text-slate-800">{t('admin_routes_title')}</h1>
          <span className="text-xs text-slate-400 ml-auto mr-2">
            {allRoutes.length} {t('routes').toLowerCase()}
          </span>
          {customRoutes.length > 0 && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                syncStatus === 'success'
                  ? 'bg-green-100 text-green-700'
                  : syncStatus === 'error'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-blue-100 text-blue-700 active:bg-blue-200'
              }`}
            >
              {syncing ? (
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
                  <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
                </svg>
              )}
              {syncing ? t('admin_syncing') : syncStatus === 'success' ? t('admin_sync_done') : syncStatus === 'error' ? t('admin_sync_error') : t('admin_sync')}
            </button>
          )}
        </div>

        {/* Sync error */}
        {error && syncStatus === 'error' && (
          <div className="px-3 py-2 bg-red-50 border-b border-red-200 text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="px-3 py-2 bg-white border-b border-slate-100">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('search_placeholder')}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Route list */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-2 max-w-lg mx-auto">
            {allRoutes.map(route => {
              const p = route.properties
              const isCustom = customRouteKeys.has(p.route_key)
              const color = ROUTE_COLORS[p.route_type] || '#6366f1'

              return (
                <div
                  key={p.route_key}
                  className={`flex items-center gap-3 p-3 rounded-xl bg-white shadow-sm border ${isCustom ? 'border-amber-200' : 'border-slate-100'}`}
                >
                  {/* Color badge */}
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: color }}
                  >
                    {p.route_num}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm text-slate-800 truncate">
                      {p.name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-slate-400 capitalize">
                        {t(`route_type_${p.route_type}`, { defaultValue: p.route_type })}
                      </span>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs text-slate-400 capitalize">
                        {t(`direction_${p.direction}`, { defaultValue: p.direction })}
                      </span>
                      {isCustom && (
                        <>
                          <span className="text-xs text-slate-300">·</span>
                          <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                            {t('admin_route_custom')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Delete (custom only) */}
                  {isCustom && (
                    <button
                      onClick={() => handleDelete(p.route_key, p.route_num)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Add route FAB — outside z-[999] container so it's not trapped in its stacking context */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-20 right-4 z-[1001] w-14 h-14 rounded-full bg-blue-600 text-white shadow-xl flex items-center justify-center active:bg-blue-700 transition-colors safe-area-bottom"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
            <path fillRule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
          </svg>
        </button>
      )}

      {/* Add route form (slide-up sheet) */}
      {showForm && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[1001] bg-black/30"
            onClick={() => { setShowForm(false); resetForm() }}
          />

          {/* Form sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-[1002] bg-white rounded-t-2xl shadow-2xl animate-slide-up safe-area-bottom">
            <div className="p-4 max-w-lg mx-auto">
              {/* Handle */}
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />

              <h2 className="font-semibold text-slate-800 mb-4">{t('admin_route_add')}</h2>

              <form onSubmit={handleSubmit} className="space-y-3">
                {/* Route number */}
                <div>
                  <label className="text-xs text-slate-500 font-medium">{t('admin_route_num')}</label>
                  <input
                    type="text"
                    value={routeNum}
                    onChange={e => setRouteNum(e.target.value)}
                    placeholder="5"
                    className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    autoFocus
                  />
                </div>

                {/* Route name */}
                <div>
                  <label className="text-xs text-slate-500 font-medium">{t('admin_route_name')}</label>
                  <input
                    type="text"
                    value={routeName}
                    onChange={e => setRouteName(e.target.value)}
                    placeholder="Xalapa - Coatepec"
                    className="w-full mt-1 px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                {/* Route type */}
                <div>
                  <label className="text-xs text-slate-500 font-medium">{t('admin_route_type')}</label>
                  <div className="flex gap-2 mt-1">
                    {ROUTE_TYPES.map(rt => (
                      <button
                        key={rt}
                        type="button"
                        onClick={() => setRouteType(rt)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                          routeType === rt
                            ? 'text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                        style={routeType === rt ? { backgroundColor: ROUTE_COLORS[rt] } : undefined}
                      >
                        {t(`route_type_${rt}`, { defaultValue: rt })}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Direction */}
                <div>
                  <label className="text-xs text-slate-500 font-medium">{t('direction')}</label>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {DIRECTION_PRESETS.map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => { setDirection(d); setCustomDirection('') }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
                          direction === d
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {t(`direction_${d}`, { defaultValue: d })}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setDirection('_custom')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        direction === '_custom'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {t('admin_route_custom_direction')}
                    </button>
                  </div>
                  {direction === '_custom' && (
                    <input
                      type="text"
                      value={customDirection}
                      onChange={e => setCustomDirection(e.target.value)}
                      placeholder={t('admin_route_custom_direction_placeholder')}
                      className="w-full mt-2 px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                    {error}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); resetForm() }}
                    className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium active:bg-slate-200 transition-colors"
                  >
                    {t('admin_cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium active:bg-blue-700 transition-colors"
                  >
                    {t('admin_route_add')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </>
  )
}
