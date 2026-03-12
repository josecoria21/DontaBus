import { useTranslation } from 'react-i18next'

interface Props {
  onClick: () => void
  loading: boolean
  active: boolean
}

export function LocateButton({ onClick, loading, active }: Props) {
  const { t } = useTranslation()

  return (
    <button
      onClick={onClick}
      className={`absolute bottom-24 right-3 z-[1000] w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-white text-slate-600 hover:bg-slate-50'
      }`}
      title={t('my_location')}
      aria-label={t('my_location')}
    >
      {loading ? (
        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30 70" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M12 2a.75.75 0 0 1 .75.75v1.532a8.25 8.25 0 0 1 6.968 6.968h1.532a.75.75 0 0 1 0 1.5h-1.532a8.25 8.25 0 0 1-6.968 6.968v1.532a.75.75 0 0 1-1.5 0v-1.532a8.25 8.25 0 0 1-6.968-6.968H2.75a.75.75 0 0 1 0-1.5h1.532a8.25 8.25 0 0 1 6.968-6.968V2.75A.75.75 0 0 1 12 2Zm0 4.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Zm0 2a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z" />
        </svg>
      )}
    </button>
  )
}
