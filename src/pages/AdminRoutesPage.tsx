import { useState, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useRouteData } from '../hooks/useRouteData'
import { useRouteEditorStore, buildRouteKey } from '../store/routeEditorStore'
import { syncRoutesToSupabase } from '../lib/adminApi'
import { uploadRouteImage } from '../lib/imageUpload'
import { ROUTE_COLORS } from '../lib/constants'
import type { RouteProperties } from '../types'

const ROUTE_TYPES: RouteProperties['route_type'][] = ['ruta', 'circuito', 'circuito_alterno']
const VEHICLE_TYPES: NonNullable<RouteProperties['vehicle_type']>[] = ['autobus', 'combi']

const DIRECTION_PRESETS = ['ida', 'vuelta', 'principal', 'ruta_1', 'ruta_2', 'variant_1', 'variant_2']

const DIRECTION_COUNTERPART: Record<string, string> = {
  ida: 'vuelta',
  vuelta: 'ida',
  ruta_1: 'ruta_2',
  ruta_2: 'ruta_1',
  variant_1: 'variant_2',
  variant_2: 'variant_1',
}

export function AdminRoutesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { routes, loading } = useRouteData()
  const customRoutes = useRouteEditorStore(s => s.customRoutes)
  const addRoute = useRouteEditorStore(s => s.addRoute)
  const editRoute = useRouteEditorStore(s => s.editRoute)
  const importRoute = useRouteEditorStore(s => s.importRoute)
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
  const [vehicleType, setVehicleType] = useState<NonNullable<RouteProperties['vehicle_type']>>('autobus')

  // Edit mode
  const [editingRouteKey, setEditingRouteKey] = useState<string | null>(null)

  // Image upload
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const customRouteKeys = useMemo(
    () => new Set(customRoutes.map(r => r.properties.route_key)),
    [customRoutes]
  )

  // Set of all existing route keys for counterpart lookup
  const allRouteKeys = useMemo(() => {
    if (!routes) return new Set<string>()
    return new Set(routes.features.map(r => r.properties.route_key))
  }, [routes])

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
    setVehicleType('autobus')
    setEditingRouteKey(null)
    setImageFile(null)
    setImagePreview(null)
    setError(null)
  }

  function handleEditClick(routeKey: string) {
    // Find from all routes (custom or server)
    const route = allRoutes.find(r => r.properties.route_key === routeKey)
    if (!route) return

    // If it's not already custom, import it into the local store
    if (!customRouteKeys.has(routeKey)) {
      importRoute(route)
    }

    const p = route.properties
    setRouteNum(p.route_num)
    setRouteName(p.name)
    setRouteType(p.route_type)
    setVehicleType(p.vehicle_type || 'autobus')

    // Direction: check if it matches a preset
    if (DIRECTION_PRESETS.includes(p.direction)) {
      setDirection(p.direction)
      setCustomDirection('')
    } else {
      setDirection('_custom')
      setCustomDirection(p.direction)
    }

    // Image
    setImageFile(null)
    setImagePreview(p.image_url || null)

    setEditingRouteKey(routeKey)
    setError(null)
    setShowForm(true)
  }

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const url = URL.createObjectURL(file)
    setImagePreview(url)
  }

  function handleImageRemove() {
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
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

    // Upload image if a new file was picked
    let imageUrl: string | null | undefined = undefined
    if (imageFile) {
      setUploading(true)
      const key = editingRouteKey || buildRouteKey(num, dir)
      const url = await uploadRouteImage(key, imageFile)
      setUploading(false)
      if (!url) {
        setError(t('admin_image_upload_error'))
        return
      }
      imageUrl = url
    } else if (imagePreview === null && editingRouteKey) {
      // User removed existing image
      imageUrl = null
    }

    if (editingRouteKey) {
      // Edit mode
      const updates: Parameters<typeof editRoute>[1] = {
        route_num: num,
        name,
        route_type: routeType,
        direction: dir,
        vehicle_type: vehicleType,
      }
      if (imageUrl !== undefined) updates.image_url = imageUrl
      editRoute(editingRouteKey, updates)
    } else {
      // Add mode
      const result = addRoute({
        route_num: num,
        name,
        route_type: routeType,
        direction: dir,
        vehicle_type: vehicleType,
      })

      if (result === null) {
        setError(t('admin_route_duplicate'))
        return
      }

      // If image was uploaded, attach it to the newly created route
      if (imageUrl) {
        editRoute(result, { image_url: imageUrl })
      }
    }

    resetForm()
    setShowForm(false)
  }

  function handleDelete(routeKey: string, routeNum: string) {
    if (window.confirm(t('admin_route_confirm_delete', { num: routeNum }))) {
      deleteRoute(routeKey)
    }
  }

  function handleCreateCounterpart(routeKey: string) {
    const route = allRoutes.find(r => r.properties.route_key === routeKey)
    if (!route) return
    const p = route.properties
    const counterDir = DIRECTION_COUNTERPART[p.direction]
    if (!counterDir) return

    setRouteNum(p.route_num)
    setRouteName(p.name)
    setRouteType(p.route_type)
    setVehicleType(p.vehicle_type || 'autobus')
    setDirection(counterDir)
    setCustomDirection('')
    setEditingRouteKey(null)
    setImageFile(null)
    setImagePreview(p.image_url || null)
    setError(null)
    setShowForm(true)
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
                  {/* Color badge / image */}
                  <div
                    className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm overflow-hidden relative"
                    style={{ backgroundColor: color }}
                  >
                    {p.image_url && (
                      <img
                        src={p.image_url}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    <span className={p.image_url ? 'relative z-10 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]' : ''}>
                      {p.route_num}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-sm text-slate-800 truncate">
                      {p.name}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="text-xs text-slate-400 capitalize">
                        {t(`route_type_${p.route_type}`, { defaultValue: p.route_type })}
                      </span>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs text-slate-400 capitalize">
                        {t(`direction_${p.direction}`, { defaultValue: p.direction })}
                      </span>
                      {p.vehicle_type && (
                        <>
                          <span className="text-xs text-slate-300">·</span>
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full capitalize">
                            {t(`vehicle_type_${p.vehicle_type}`, { defaultValue: p.vehicle_type })}
                          </span>
                        </>
                      )}
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

                  {/* Actions: counterpart + edit + delete */}
                  <div className="flex items-center gap-1">
                    {DIRECTION_COUNTERPART[p.direction] && !allRouteKeys.has(buildRouteKey(p.route_num, DIRECTION_COUNTERPART[p.direction])) && (
                      <button
                        onClick={() => handleCreateCounterpart(p.route_key)}
                        className="p-2 text-purple-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title={t('admin_create_counterpart', { direction: t(`direction_${DIRECTION_COUNTERPART[p.direction]}`, { defaultValue: DIRECTION_COUNTERPART[p.direction] }) })}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                          <path fillRule="evenodd" d="M13.2 2.24a.75.75 0 0 0 .04 1.06l2.1 1.95H6.75a.75.75 0 0 0 0 1.5h8.59l-2.1 1.95a.75.75 0 1 0 1.02 1.1l3.5-3.25a.75.75 0 0 0 0-1.1l-3.5-3.25a.75.75 0 0 0-1.06.04Zm-6.4 8a.75.75 0 0 0-1.06-.04l-3.5 3.25a.75.75 0 0 0 0 1.1l3.5 3.25a.75.75 0 1 0 1.02-1.1l-2.1-1.95h8.59a.75.75 0 0 0 0-1.5H4.66l2.1-1.95a.75.75 0 0 0 .04-1.06Z" clipRule="evenodd" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleEditClick(p.route_key)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
                        <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25h5.5a.75.75 0 0 0 0-1.5h-5.5A2.75 2.75 0 0 0 2 5.75v8.5A2.75 2.75 0 0 0 4.75 17h8.5A2.75 2.75 0 0 0 16 14.25v-5.5a.75.75 0 0 0-1.5 0v5.5c0 .69-.56 1.25-1.25 1.25h-8.5c-.69 0-1.25-.56-1.25-1.25v-8.5Z" />
                      </svg>
                    </button>
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
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Add route FAB */}
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

      {/* Add/Edit route form (slide-up sheet) */}
      {showForm && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[1001] bg-black/30"
            onClick={() => { setShowForm(false); resetForm() }}
          />

          {/* Form sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-[1002] bg-white rounded-t-2xl shadow-2xl animate-slide-up safe-area-bottom">
            <div className="p-4 max-w-lg mx-auto max-h-[80vh] overflow-y-auto">
              {/* Handle */}
              <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />

              <h2 className="font-semibold text-slate-800 mb-4">
                {editingRouteKey ? t('admin_route_edit') : t('admin_route_add')}
              </h2>

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

                {/* Vehicle type */}
                <div>
                  <label className="text-xs text-slate-500 font-medium">{t('admin_vehicle_type')}</label>
                  <div className="flex gap-2 mt-1">
                    {VEHICLE_TYPES.map(vt => (
                      <button
                        key={vt}
                        type="button"
                        onClick={() => setVehicleType(vt)}
                        className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                          vehicleType === vt
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {t(`vehicle_type_${vt}`, { defaultValue: vt })}
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

                {/* Image upload */}
                <div>
                  <label className="text-xs text-slate-500 font-medium">{t('admin_route_image')}</label>
                  <div className="mt-1">
                    {imagePreview ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={imagePreview}
                          alt=""
                          className="w-16 h-16 rounded-lg object-cover border border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={handleImageRemove}
                          className="text-xs text-red-500 hover:text-red-700 font-medium"
                        >
                          {t('admin_route_image_remove')}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition-colors"
                      >
                        {t('admin_route_image_pick')}
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImagePick}
                      className="hidden"
                    />
                  </div>
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
                    disabled={uploading}
                    className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-medium active:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {uploading ? (
                      <>
                        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" />
                        </svg>
                        {t('admin_image_uploading')}
                      </>
                    ) : (
                      editingRouteKey ? t('admin_route_save') : t('admin_route_add')
                    )}
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
