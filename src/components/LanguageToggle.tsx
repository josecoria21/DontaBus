import { useTranslation } from 'react-i18next'

export function LanguageToggle() {
  const { i18n } = useTranslation()
  const isEn = i18n.language === 'en'

  const toggle = () => {
    const newLang = isEn ? 'es' : 'en'
    i18n.changeLanguage(newLang)
    localStorage.setItem('dontabus-lang', newLang)
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
    >
      {isEn ? 'ES' : 'EN'}
    </button>
  )
}
