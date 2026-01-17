import { lazy, Suspense } from 'react';
import { UpdateBanner } from './components/UpdateBanner';
import { InstallBanner } from './components/InstallBanner';
import { useServiceWorkerUpdate } from './hooks/useServiceWorkerUpdate';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import { HomePage } from './pages/HomePage';

// Dev-only component showcase (lazy loaded)
const ComponentShowcase = lazy(() =>
  import('./pages/ComponentShowcase').then(m => ({ default: m.ComponentShowcase }))
);

/**
 * Root application shell.
 * Handles service worker updates and page routing.
 */
export function App() {
  const { updateAvailable, updateAndReload, dismiss: dismissUpdate } = useServiceWorkerUpdate();
  const { canShow: canShowInstall, platform, installApp, dismiss: dismissInstall } = useInstallPrompt();

  // Dev-only: Show component showcase at /components
  if (import.meta.env.DEV && window.location.pathname === '/components') {
    return (
      <Suspense fallback={<div className="container">Loading...</div>}>
        <ComponentShowcase />
      </Suspense>
    );
  }

  // Only show install banner when update banner is hidden (priority)
  const showInstallBanner = canShowInstall && !updateAvailable;

  return (
    <>
      <UpdateBanner
        visible={updateAvailable}
        onUpdate={updateAndReload}
        onDismiss={dismissUpdate}
      />
      <InstallBanner
        visible={showInstallBanner}
        platform={platform}
        onInstall={installApp}
        onDismiss={dismissInstall}
      />
      <HomePage />
    </>
  );
}
