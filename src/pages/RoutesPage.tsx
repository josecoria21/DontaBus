import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useRouteData } from '../hooks/useRouteData'
import { SearchBar } from '../components/SearchBar'
import { RouteList } from '../components/RouteList'
import { LanguageToggle } from '../components/LanguageToggle'

export function RoutesPage() {
  const { t } = useTranslation()
  const { routes, loading } = useRouteData()
  const [search, setSearch] = useState('')

  if (loading || !routes) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <svg className="w-8 h-8 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" />
        </svg>
        <div className="text-slate-400 text-sm">{t('loading')}</div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="sticky top-0 z-10 bg-slate-50 px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-slate-800">
            {t('routes')} ({routes.features.length})
          </h1>
          <LanguageToggle />
        </div>
        <SearchBar value={search} onChange={setSearch} />
      </div>
      <div className="px-4 pb-20">
        <RouteList routes={routes.features} searchQuery={search} />
      </div>
    </div>
  )
}
