import { useMapStore } from '../../store/mapStore'
import { useRouteData } from '../../hooks/useRouteData'
import { StopPopupContent } from './StopPopupContent'

export function StopBottomSheet() {
  const selectedStop = useMapStore((s) => s.selectedStop)
  const setSelectedStop = useMapStore((s) => s.setSelectedStop)
  const setSelectedRoute = useMapStore((s) => s.setSelectedRoute)
  const { routes } = useRouteData()

  if (!selectedStop) return null

  const handleSelectRoute = (routeKey: string) => {
    setSelectedRoute(routeKey)
    setSelectedStop(null)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[1001] bg-black/30"
        onClick={() => setSelectedStop(null)}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[1002] bg-white rounded-t-2xl shadow-2xl animate-slide-up safe-area-bottom">
        <div className="p-4 max-w-lg mx-auto">
          {/* Handle bar */}
          <div className="flex justify-center mb-4">
            <div className="w-10 h-1 bg-slate-200 rounded-full" />
          </div>

          {/* Content */}
          <div className="max-h-[60vh] overflow-y-auto no-scrollbar">
            <StopPopupContent
              stopId={selectedStop.stopId}
              lat={selectedStop.lat}
              lng={selectedStop.lng}
              routeKeys={selectedStop.routeKeys}
              routes={routes}
              onSelectRoute={handleSelectRoute}
            />
          </div>
        </div>
      </div>
    </>
  )
}
