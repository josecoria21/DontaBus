import { useTranslation } from 'react-i18next'
import { LanguageToggle } from '../components/LanguageToggle'
import { useRouteData } from '../hooks/useRouteData'

export function AboutPage() {
  const { t } = useTranslation()
  const { routes, stops } = useRouteData()

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <div className="px-4 pt-4 pb-20 max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-bold text-slate-800">
            {t('about_title')}
          </h1>
          <LanguageToggle />
        </div>

        <div className="space-y-5">
          <Section>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t('about_description')}
            </p>
          </Section>

          <Section title={t('about_how_title')}>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t('about_how_description')}
            </p>
          </Section>

          <Section title={t('about_data_title')}>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t('about_data_description', { routeCount: routes?.features.length ?? 0, stopCount: stops?.features.length ?? 0 })}
            </p>
          </Section>

          <Section title={t('about_privacy_title')}>
            <p className="text-sm text-slate-600 leading-relaxed">
              {t('about_privacy_description')}
            </p>
          </Section>

          <div className="pt-4 text-center text-xs text-slate-400">
            DontaBus v0.1.0 — Xalapa, Veracruz
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-100/50 p-4">
      {title && (
        <h2 className="text-sm font-semibold text-slate-700 mb-2">{title}</h2>
      )}
      {children}
    </div>
  )
}
