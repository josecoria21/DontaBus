import { CircleMarker, Tooltip } from 'react-leaflet'
import { useTranslation } from 'react-i18next'

interface StopInfo {
  stopId: number
  lat: number
  lng: number
}

interface Props {
  boardStop: StopInfo
  alightStop: StopInfo
}

export function BoardAlightMarkers({ boardStop, alightStop }: Props) {
  const { t } = useTranslation()

  return (
    <>
      {/* Board stop - green */}
      <CircleMarker
        center={[boardStop.lat, boardStop.lng]}
        radius={10}
        pathOptions={{
          fillColor: '#16a34a',
          fillOpacity: 1,
          color: '#ffffff',
          weight: 3,
        }}
      >
        <Tooltip permanent direction="top" offset={[0, -10]} className="board-alight-tooltip">
          {t('board_here')}
        </Tooltip>
      </CircleMarker>

      {/* Alight stop - red */}
      <CircleMarker
        center={[alightStop.lat, alightStop.lng]}
        radius={10}
        pathOptions={{
          fillColor: '#dc2626',
          fillOpacity: 1,
          color: '#ffffff',
          weight: 3,
        }}
      >
        <Tooltip permanent direction="top" offset={[0, -10]} className="board-alight-tooltip">
          {t('alight_here')}
        </Tooltip>
      </CircleMarker>
    </>
  )
}
