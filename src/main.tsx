import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// Check for updates immediately, and then every hour
registerSW({
  onRegistered(r: any) {
    r && setInterval(() => {
      r.update()
    }, 60 * 60 * 1000)
  }
})

// When the new service worker takes over, reload the page immediately so the user doesn't see a cached version
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload()
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
