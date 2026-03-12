import { useTranslation } from 'react-i18next'
import { formatDistance } from '../../lib/geo'
import { openWalkingDirections } from '../../lib/directions'

interface Props {
  stopId: number
  lat: number
  lng: number
  distance: number
  userPosition: { lat: number; lng: number }
}

export function NearestStopCard({ stopId, lat, lng, distance, userPosition }: Props) {
  const { t } = useTranslation()

  return (
    <div className="absolute bottom-24 left-3 z-[1000] max-w-[min(240px,calc(50vw-1rem))] bg-white rounded-lg shadow-lg px-4 py-3 animate-slide-up">
      <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 mb-1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-amber-500">
          <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7z" />
        </svg>
        {t('nearest_stop')}
      </div>
      <div className="text-xs text-gray-500 mb-2">
        {t('stop_label', { id: stopId })} · {formatDistance(distance)}
      </div>
      <button
        className="w-full flex items-center justify-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded py-1.5 transition-colors"
        onClick={() => openWalkingDirections(lat, lng, userPosition)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
          <path fillRule="evenodd" d="M8.157 2.176a1.5 1.5 0 0 0-1.147 0l-4.084 1.69A1.5 1.5 0 0 0 2 5.25v10.877a1.5 1.5 0 0 0 2.074 1.386l3.51-1.453 4.26 1.763a1.5 1.5 0 0 0 1.146 0l4.083-1.69A1.5 1.5 0 0 0 18 14.75V3.872a1.5 1.5 0 0 0-2.073-1.386l-3.51 1.453-4.26-1.763ZM7.58 5a.75.75 0 0 1 .75.75v6.5a.75.75 0 0 1-1.5 0v-6.5A.75.75 0 0 1 7.58 5Zm5.59 2.75a.75.75 0 0 0-1.5 0v6.5a.75.75 0 0 0 1.5 0v-6.5Z" clipRule="evenodd" />
        </svg>
        {t('walk_there')}
      </button>
    </div>
  )
}
