import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useStopEditorStore } from '../../store/stopEditorStore'
import { useIsMobile } from '../../hooks/useIsMobile'
import { EditorToolbarMobile } from './EditorToolbarMobile'
import type { DataSource } from '../../hooks/useAdminStopsData'

export interface EditorToolbarProps {
  satellite: boolean
  onToggleSatellite: () => void
  dataSource: DataSource
}

function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function EditorToolbar(props: EditorToolbarProps) {
  const undo = useStopEditorStore(s => s.undo)
  const redo = useStopEditorStore(s => s.redo)
  const setAddMode = useStopEditorStore(s => s.setAddMode)
  const setDragMode = useStopEditorStore(s => s.setDragMode)
  const cancelMerge = useStopEditorStore(s => s.cancelMerge)
  const isMobile = useIsMobile()

  // Keyboard shortcuts — shared between desktop and mobile
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault()
        redo()
      }
      if (e.key === 'Escape') {
        const store = useStopEditorStore.getState()
        if (store.mergeMode) {
          cancelMerge()
        } else {
          setAddMode(false)
          setDragMode(false)
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [undo, redo, setAddMode, setDragMode, cancelMerge])

  if (isMobile) {
    return <EditorToolbarMobile {...props} />
  }

  return <EditorToolbarDesktop {...props} />
}

// Desktop toolbar — unchanged from original
function EditorToolbarDesktop({ satellite, onToggleSatellite, dataSource }: EditorToolbarProps) {
  const { t } = useTranslation()
  const features = useStopEditorStore(s => s.features)
  const isDirty = useStopEditorStore(s => s.isDirty)
  const saving = useStopEditorStore(s => s.saving)
  const lastSaveError = useStopEditorStore(s => s.lastSaveError)
  const saveToServer = useStopEditorStore(s => s.saveToServer)
  const historyIndex = useStopEditorStore(s => s.historyIndex)
  const historyLength = useStopEditorStore(s => s.history.length)
  const selectedStopId = useStopEditorStore(s => s.selectedStopId)
  const addMode = useStopEditorStore(s => s.addMode)
  const dragMode = useStopEditorStore(s => s.dragMode)
  const pendingMove = useStopEditorStore(s => s.pendingMove)
  const mergeMode = useStopEditorStore(s => s.mergeMode)
  const mergeTargetId = useStopEditorStore(s => s.mergeTargetId)
  const deleteStop = useStopEditorStore(s => s.deleteStop)
  const setAddMode = useStopEditorStore(s => s.setAddMode)
  const setDragMode = useStopEditorStore(s => s.setDragMode)
  const confirmMove = useStopEditorStore(s => s.confirmMove)
  const cancelMove = useStopEditorStore(s => s.cancelMove)
  const toGeoJSON = useStopEditorStore(s => s.toGeoJSON)
  const toStopRoutesJSON = useStopEditorStore(s => s.toStopRoutesJSON)
  const toRouteStopsJSON = useStopEditorStore(s => s.toRouteStopsJSON)

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < historyLength - 1
  const undo = useStopEditorStore(s => s.undo)
  const redo = useStopEditorStore(s => s.redo)

  function handleDelete() {
    if (selectedStopId === null) return
    if (window.confirm(t('admin_confirm_delete'))) {
      deleteStop(selectedStopId)
    }
  }

  function handleDownload() {
    downloadJSON(toGeoJSON(), 'stops.geojson')
    setTimeout(() => downloadJSON(toStopRoutesJSON(), 'stop_routes.json'), 200)
    setTimeout(() => downloadJSON(toRouteStopsJSON(), 'route_stops.json'), 400)
  }

  const btnBase = 'px-2 py-1.5 rounded text-xs font-medium transition-colors'
  const btnDefault = `${btnBase} bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed`
  const btnActive = `${btnBase} bg-blue-600 text-white`

  return (
    <div className="absolute top-3 left-12 right-3 z-[1001] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1 bg-white/95 backdrop-blur rounded-lg shadow-md px-2 py-1.5 flex-shrink-0">
        <button onClick={undo} disabled={!canUndo} className={btnDefault} title={t('admin_undo')}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M7.793 2.232a.75.75 0 0 1-.025 1.06L3.622 7.25h10.003a5.375 5.375 0 0 1 0 10.75H10.75a.75.75 0 0 1 0-1.5h2.875a3.875 3.875 0 0 0 0-7.75H3.622l4.146 3.957a.75.75 0 0 1-1.036 1.085l-5.5-5.25a.75.75 0 0 1 0-1.085l5.5-5.25a.75.75 0 0 1 1.06.025Z" clipRule="evenodd" />
          </svg>
        </button>
        <button onClick={redo} disabled={!canRedo} className={btnDefault} title={t('admin_redo')}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12.207 2.232a.75.75 0 0 0 .025 1.06l4.146 3.958H6.375a5.375 5.375 0 0 0 0 10.75H9.25a.75.75 0 0 0 0-1.5H6.375a3.875 3.875 0 0 1 0-7.75h10.003l-4.146 3.957a.75.75 0 0 0 1.036 1.085l5.5-5.25a.75.75 0 0 0 0-1.085l-5.5-5.25a.75.75 0 0 0-1.06.025Z" clipRule="evenodd" />
          </svg>
        </button>

        <div className="w-px h-5 bg-slate-300 mx-0.5" />

        <button
          onClick={() => setDragMode(!dragMode)}
          disabled={mergeMode}
          className={dragMode ? btnActive : btnDefault}
          title={t('admin_drag_mode')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M10 1a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 1ZM5.05 3.05a.75.75 0 0 1 1.06 0l1.062 1.06a.75.75 0 1 1-1.06 1.061L5.05 4.11a.75.75 0 0 1 0-1.06Zm9.9 0a.75.75 0 0 1 0 1.06l-1.06 1.061a.75.75 0 0 1-1.062-1.06l1.061-1.06a.75.75 0 0 1 1.06 0ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm-7 3a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 3 10Zm11.25-.75a.75.75 0 0 0 0 1.5h1.5a.75.75 0 0 0 0-1.5h-1.5Zm-6.188 4.828a.75.75 0 0 1 1.06-1.06l1.061 1.06a.75.75 0 0 1-1.06 1.06l-1.06-1.06Zm-3.95-.939a.75.75 0 0 1 1.06 0l1.062 1.06a.75.75 0 1 1-1.061 1.061l-1.06-1.06a.75.75 0 0 1 0-1.06ZM10 15a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 10 15Z" clipRule="evenodd" />
          </svg>
        </button>

        <button
          onClick={() => setAddMode(!addMode)}
          disabled={mergeMode}
          className={addMode ? btnActive : btnDefault}
          title={t('admin_add_mode')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
        </button>

        <button
          onClick={handleDelete}
          disabled={selectedStopId === null || mergeMode}
          className={`${btnDefault} text-red-600 hover:bg-red-50`}
          title={t('admin_delete_stop')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
          </svg>
        </button>

        <div className="w-px h-5 bg-slate-300 mx-0.5" />

        <button
          onClick={onToggleSatellite}
          className={satellite ? btnActive : btnDefault}
          title={t('admin_satellite')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M4.606 12.97a.75.75 0 0 1-.134 1.051 2.494 2.494 0 0 0-.93 2.437 2.494 2.494 0 0 0 2.437-.93.75.75 0 1 1 1.186.918 3.995 3.995 0 0 1-4.482 1.332.75.75 0 0 1-.461-.461 3.994 3.994 0 0 1 1.332-4.482.75.75 0 0 1 1.052.134Zm1.172-3.692a.75.75 0 0 1-.07 1.06c-1.706 1.517-2.487 3.18-2.322 4.91a.75.75 0 1 1-1.494.149C1.67 13.07 2.725 11.05 4.718 9.278a.75.75 0 0 1 1.06 0Zm4.444-4.5a.75.75 0 0 1-.07 1.06c-2.34 2.08-3.52 4.327-3.472 6.634a.75.75 0 1 1-1.5.034c-.062-2.838 1.326-5.458 3.982-7.797a.75.75 0 0 1 1.06.07Zm4.56-3.56a.75.75 0 0 1-.07 1.06C11.18 5.368 9.553 8.592 9.6 12.32a.75.75 0 1 1-1.5.018C8.046 8.093 9.87 4.478 13.722 1.218a.75.75 0 0 1 1.06.07Z" clipRule="evenodd" />
          </svg>
        </button>

        <button onClick={handleDownload} className={btnDefault} title={t('admin_download')}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" />
            <path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" />
          </svg>
        </button>

        <button
          onClick={saveToServer}
          disabled={!isDirty || saving}
          className={`${btnBase} transition-colors ${isDirty && !saving ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed'}`}
          title={saving ? t('admin_saving') : t('admin_save_server')}
        >
          {saving ? (
            <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M5.5 17a4.5 4.5 0 0 1-1.44-8.765 4.5 4.5 0 0 1 8.302-3.046 3.5 3.5 0 0 1 4.504 4.272A4 4 0 0 1 15 17H5.5Zm3.75-2.75a.75.75 0 0 0 1.5 0V9.66l1.95 2.1a.75.75 0 1 0 1.1-1.02l-3.25-3.5a.75.75 0 0 0-1.1 0l-3.25 3.5a.75.75 0 1 0 1.1 1.02l1.95-2.1v4.59Z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        <div className="w-px h-5 bg-slate-300 mx-0.5" />

        <span className="text-xs text-slate-500 px-1">
          {t('admin_stops_count', { count: features.length })}
        </span>
      </div>

      {mergeMode && mergeTargetId !== null && (
        <div className="bg-teal-600 text-white text-xs px-3 py-1 rounded-full shadow">
          {t('admin_merge_banner', { id: mergeTargetId })}
        </div>
      )}
      {!mergeMode && dragMode && !pendingMove && (
        <div className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full shadow">
          {t('admin_drag_mode')} — drag a marker · Esc to exit
        </div>
      )}
      {pendingMove && (
        <div className="flex items-center gap-2 bg-white/95 backdrop-blur rounded-lg shadow-md px-3 py-1.5">
          <span className="text-xs text-slate-700">
            {t('admin_confirm_move', { id: pendingMove.stopId })}
          </span>
          <button
            onClick={confirmMove}
            className="px-2.5 py-1 rounded text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
          >
            {t('admin_finish_drag')}
          </button>
          <button
            onClick={cancelMove}
            className="px-2.5 py-1 rounded text-xs font-medium bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors"
          >
            {t('admin_cancel')}
          </button>
        </div>
      )}
      {!mergeMode && addMode && (
        <div className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full shadow">
          {t('admin_add_mode')} — click map · Esc to cancel
        </div>
      )}
      {dataSource && (
        <div className={`text-xs px-2.5 py-0.5 rounded-full shadow ${dataSource === 'supabase' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
          {dataSource === 'supabase' ? t('admin_loaded_server') : t('admin_loaded_static')}
        </div>
      )}
      {lastSaveError && (
        <div className="text-xs px-2.5 py-0.5 rounded-full shadow bg-red-100 text-red-700">
          {t('admin_save_error')}: {lastSaveError}
        </div>
      )}
    </div>
  )
}
