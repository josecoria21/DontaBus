import { useTranslation } from 'react-i18next'

interface Props {
  onSelectMode: (mode: 'at-stop' | 'on-bus') => void
}

export function ModeSelector({ onSelectMode }: Props) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col gap-4 p-4">
      <h2 className="text-lg font-semibold text-slate-800 text-center">
        {t('field_select_mode')}
      </h2>

      <button
        onClick={() => onSelectMode('at-stop')}
        className="w-full p-6 rounded-xl border-2 border-blue-200 bg-blue-50 hover:bg-blue-100 active:bg-blue-200 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-6 h-6">
              <path fillRule="evenodd" d="m11.54 22.351.07.04.028.016a.76.76 0 0 0 .723 0l.028-.015.071-.041a16.975 16.975 0 0 0 1.144-.742 19.58 19.58 0 0 0 2.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 0 0-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 0 0 3.834 3.025ZM12 12.75a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-blue-900 text-lg">{t('field_mode_at_stop')}</div>
            <div className="text-sm text-blue-700 mt-1">{t('field_mode_at_stop_desc')}</div>
          </div>
        </div>
      </button>

      <button
        onClick={() => onSelectMode('on-bus')}
        className="w-full p-6 rounded-xl border-2 border-green-200 bg-green-50 hover:bg-green-100 active:bg-green-200 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-6 h-6">
              <path d="M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h1.218c.415-1.157 1.52-1.976 2.782-1.976s2.367.82 2.782 1.976h5.436c.415-1.157 1.52-1.976 2.782-1.976s2.367.82 2.782 1.976H21V6.375c0-1.036-.84-1.875-1.875-1.875H3.375Z" />
              <path fillRule="evenodd" d="M5.5 15.024a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Zm0-1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM16.5 15.024a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Zm0-1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <div className="font-semibold text-green-900 text-lg">{t('field_mode_on_bus')}</div>
            <div className="text-sm text-green-700 mt-1">{t('field_mode_on_bus_desc')}</div>
          </div>
        </div>
      </button>
    </div>
  )
}
