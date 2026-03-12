import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, TileLayer } from 'react-leaflet'
import { useTranslation } from 'react-i18next'
import { useAdminStopsData } from '../hooks/useAdminStopsData'
import { useStopEditorStore } from '../store/stopEditorStore'
import { EditorMarkers } from '../components/Admin/EditorMarkers'
import { EditorToolbar } from '../components/Admin/EditorToolbar'
import { StopInfoPanel } from '../components/Admin/StopInfoPanel'
import { MergePanel } from '../components/Admin/MergePanel'
import { GeocoderControl } from '../components/Admin/GeocoderControl'
import { MapClickHandler } from '../components/Admin/MapClickHandler'
import { XALAPA_CENTER } from '../lib/constants'
import 'leaflet/dist/leaflet.css'

const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'

export function AdminStopsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { features, stopRoutes, routeStops, loading, source } = useAdminStopsData()
  const loadEditorData = useStopEditorStore(s => s.loadEditorData)
  const mergeMode = useStopEditorStore(s => s.mergeMode)
  const [satellite, setSatellite] = useState(false)

  useEffect(() => {
    if (features && stopRoutes && routeStops) {
      // Don't re-initialize if the editor already has unsaved changes
      const { isDirty } = useStopEditorStore.getState()
      if (!isDirty) {
        loadEditorData(features, stopRoutes, routeStops)
      }
    }
  }, [features, stopRoutes, routeStops, loadEditorData])

  if (loading) {
    return (
      <div className="fixed inset-0 z-[999] bg-white flex items-center justify-center">
        <span className="text-slate-500">{t('loading')}</span>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[999] bg-white">
      {/* Back button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-3 left-3 z-[1001] bg-white/95 backdrop-blur rounded-lg shadow-md p-2 hover:bg-slate-100 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-700">
          <path fillRule="evenodd" d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Field mapper link — below back button to avoid toolbar overlap */}
      <button
        onClick={() => navigate('/admin/field-mapper')}
        className="absolute top-14 left-3 z-[1001] bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md px-3 py-2 text-xs font-medium transition-colors"
      >
        {t('field_title')}
      </button>

      <EditorToolbar satellite={satellite} onToggleSatellite={() => setSatellite(s => !s)} dataSource={source} />

      <MapContainer
        center={XALAPA_CENTER}
        zoom={15}
        minZoom={11}
        maxZoom={19}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          key={satellite ? 'sat' : 'osm'}
          url={satellite ? SATELLITE_URL : OSM_URL}
          attribution={satellite ? '&copy; Esri' : '&copy; OpenStreetMap'}
          maxZoom={19}
        />
        <EditorMarkers />
        <GeocoderControl />
        <MapClickHandler />
      </MapContainer>

      <StopInfoPanel />
      {mergeMode && <MergePanel />}
    </div>
  )
}
