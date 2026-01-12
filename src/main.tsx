import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './App.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

// Register service worker only in production
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    navigator.serviceWorker
      .register('sw.js')
      .then((registration) => {
        // Check for updates on page load
        registration.update();
      })
      .catch(() => {
        // Silent fail - app still works without SW
      });
  } else {
    // Unregister service worker in development to avoid caching issues
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    });
  }
}
