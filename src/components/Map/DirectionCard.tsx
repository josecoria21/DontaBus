import { useTranslation } from 'react-i18next'
import { formatDistance } from '../../lib/geo'
import { openWalkingDirections } from '../../lib/directions'
import { useMapStore } from '../../store/mapStore'
import type { DirectionRecommendation } from '../../lib/directionRecommender'

interface Props {
  recommendation: DirectionRecommendation
  userPosition: { lat: number; lng: number }
}

export function DirectionCard({ recommendation, userPosition }: Props) {
  const { t } = useTranslation()
  const setDestination = useMapStore((s) => s.setDestination)

  const minutes = Math.max(1, Math.round(recommendation.rideTravelTime / 60))

  return (
    <div className="absolute bottom-24 left-3 right-3 z-[1000] max-w-sm mx-auto bg-white rounded-lg shadow-lg px-4 py-3 animate-slide-up">
      {/* Direction label */}
      <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 mb-2">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-blue-600">
          <path fillRule="evenodd" d="M2 10a.75.75 0 0 1 .75-.75h12.59l-2.1-1.95a.75.75 0 1 1 1.02-1.1l3.5 3.25a.75.75 0 0 1 0 1.1l-3.5 3.25a.75.75 0 1 1-1.02-1.1l2.1-1.95H2.75A.75.75 0 0 1 2 10Z" clipRule="evenodd" />
        </svg>
        {t('take_direction', { direction: t(`direction_${recommendation.direction}`, { defaultValue: recommendation.direction }) })}
      </div>

      {/* Walk to board */}
      <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
        <span className="flex-shrink-0 w-5 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 inline text-emerald-600">
            <path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7z" />
          </svg>
        </span>
        {t('walk_to_stop', { distance: formatDistance(recommendation.boardStop.distance), id: recommendation.boardStop.stopId })}
      </div>

      {/* Ride info */}
      <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
        <span className="flex-shrink-0 w-5 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 inline text-blue-600">
            <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z" />
          </svg>
        </span>
        {t('ride_stops', { count: recommendation.rideStops, minutes })}
      </div>

      {/* Get off at */}
      <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
        <span className="flex-shrink-0 w-5 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 inline text-red-500">
            <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clipRule="evenodd" />
          </svg>
        </span>
        {t('get_off_at', { id: recommendation.alightStop.stopId })}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          aria-label={t('walk_to_stop_label')}
          className="flex-1 flex items-center justify-center gap-1 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded py-2.5 min-h-[44px] transition-colors"
          onClick={() => openWalkingDirections(recommendation.boardStop.lat, recommendation.boardStop.lng, userPosition)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M8.157 2.176a1.5 1.5 0 0 0-1.147 0l-4.084 1.69A1.5 1.5 0 0 0 2 5.25v10.877a1.5 1.5 0 0 0 2.074 1.386l3.51-1.453 4.26 1.763a1.5 1.5 0 0 0 1.146 0l4.083-1.69A1.5 1.5 0 0 0 18 14.75V3.872a1.5 1.5 0 0 0-2.073-1.386l-3.51 1.453-4.26-1.763ZM7.58 5a.75.75 0 0 1 .75.75v6.5a.75.75 0 0 1-1.5 0v-6.5A.75.75 0 0 1 7.58 5Zm5.59 2.75a.75.75 0 0 0-1.5 0v6.5a.75.75 0 0 0 1.5 0v-6.5Z" clipRule="evenodd" />
          </svg>
          {t('walk_to_board')}
        </button>
        <button
          aria-label={t('clear_destination_label')}
          className="flex items-center justify-center gap-1 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded px-3 py-2.5 min-h-[44px] transition-colors"
          onClick={() => setDestination(null)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
          {t('clear_destination')}
        </button>
      </div>
    </div>
  )
}
