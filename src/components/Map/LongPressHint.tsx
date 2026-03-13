import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const STORAGE_KEY = 'dontabus_hint_dismissed'

export function LongPressHint() {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return
    setVisible(true)
    const timer = setTimeout(() => {
      setVisible(false)
      localStorage.setItem(STORAGE_KEY, '1')
    }, 8000)
    return () => clearTimeout(timer)
  }, [])

  if (!visible) return null

  const dismiss = () => {
    setVisible(false)
    localStorage.setItem(STORAGE_KEY, '1')
  }

  return (
    <div
      className="absolute bottom-24 left-3 right-3 z-[1000] max-w-sm mx-auto bg-blue-600 text-white rounded-lg shadow-lg px-4 py-3 animate-slide-up cursor-pointer"
      onClick={dismiss}
    >
      <div className="text-sm text-center font-medium">
        {t('set_destination_hint')}
      </div>
    </div>
  )
}
