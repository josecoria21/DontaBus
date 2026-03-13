import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './i18n'
import './index.css'
import App from './App'

// Check for SW updates every 60 seconds and auto-reload when one is ready
registerSW({
  onRegisteredSW(_url, registration) {
    if (registration) {
      setInterval(() => { registration.update() }, 60 * 1000)
    }
  },
  onNeedRefresh() {
    // New content available — reload immediately
    window.location.reload()
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
