/**
 * Opens walking directions to a destination using the device's native maps app.
 *
 * - iOS Safari → Apple Maps
 * - Android / everything else → Google Maps
 *
 * If the user's position is available it's used as origin; otherwise the maps
 * app will default to the user's current location.
 */
export function openWalkingDirections(
  destLat: number,
  destLng: number,
  origin?: { lat: number; lng: number } | null,
) {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)

  if (isIOS) {
    // Apple Maps URL scheme — omit saddr entirely when no origin
    const saddrParam = origin ? `&saddr=${origin.lat},${origin.lng}` : ''
    const url = `maps://maps.apple.com/?daddr=${destLat},${destLng}${saddrParam}&dirflg=w`
    window.location.href = url
  } else {
    // Google Maps — works on Android and desktop browsers
    const originParam = origin
      ? `&origin=${origin.lat},${origin.lng}`
      : ''
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destLat},${destLng}${originParam}&travelmode=walking`
    const win = window.open(url, '_blank')
    if (!win) {
      // Popup was blocked — navigate directly
      window.location.href = url
    }
  }
}
