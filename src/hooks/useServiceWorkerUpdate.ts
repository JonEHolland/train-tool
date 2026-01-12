import { useState, useEffect, useCallback } from 'react';

interface UseServiceWorkerUpdateResult {
  updateAvailable: boolean;
  updateAndReload: () => void;
  dismiss: () => void;
}

export function useServiceWorkerUpdate(): UseServiceWorkerUpdateResult {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  // Detect waiting service worker on mount
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (reg) {
          setRegistration(reg);
          if (reg.waiting) {
            setWaitingWorker(reg.waiting);
            setUpdateAvailable(true);
          }
        }
      });
    }
  }, []);

  // Listen for updatefound events
  useEffect(() => {
    if (!registration) return;

    const handleUpdateFound = () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingWorker(newWorker);
            setUpdateAvailable(true);
          }
        });
      }
    };

    registration.addEventListener('updatefound', handleUpdateFound);
    return () => registration.removeEventListener('updatefound', handleUpdateFound);
  }, [registration]);

  // Poll for updates every 10 seconds
  useEffect(() => {
    if (!registration) return;

    const interval = setInterval(() => {
      registration.update();
    }, 10000);

    return () => clearInterval(interval);
  }, [registration]);

  // Listen for controllerchange to reload
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleControllerChange = () => {
        window.location.reload();
      };

      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
      return () => navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    }
  }, []);

  const updateAndReload = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [waitingWorker]);

  const dismiss = useCallback(() => {
    setUpdateAvailable(false);
  }, []);

  return { updateAvailable, updateAndReload, dismiss };
}
