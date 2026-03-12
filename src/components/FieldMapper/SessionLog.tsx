import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { FieldCollectionEntry } from '../../types'

interface Props {
  entries: FieldCollectionEntry[]
  saving: boolean
  lastSaveError: string | null
  onSave: () => void
}

export function SessionLog({ entries, saving, lastSaveError, onSave }: Props) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  if (entries.length === 0) return null

  return (
    <div className="border-t border-slate-200 bg-white">
      {/* Header / toggle */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
            {entries.length}
          </span>
          <span className="text-sm font-medium text-slate-700">{t('field_session_entries')}</span>
        </div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
        >
          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Expanded list */}
      {expanded && (
        <div className="max-h-48 overflow-y-auto border-t border-slate-100">
          {entries.map((entry, i) => (
            <div key={i} className="px-4 py-2 text-xs border-b border-slate-50 flex justify-between">
              <span className="text-slate-600">
                {t('stop_label', { id: entry.stop_id })} → <span className="font-medium">{entry.route_key}</span>
              </span>
              {entry.sequence > 0 && (
                <span className="text-slate-400">#{entry.sequence}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Save button */}
      <div className="px-4 py-3 border-t border-slate-100">
        {lastSaveError && (
          <p className="text-xs text-red-600 mb-2">{lastSaveError}</p>
        )}
        <button
          onClick={onSave}
          disabled={saving}
          className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium text-sm hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 transition-colors"
        >
          {saving ? t('admin_saving') : t('field_save_finish')}
        </button>
      </div>
    </div>
  )
}
