import { lazy, Suspense } from 'react';
import { UpdateBanner } from './components/UpdateBanner';
import { useServiceWorkerUpdate } from './hooks/useServiceWorkerUpdate';
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
  const { updateAvailable, updateAndReload, dismiss } = useServiceWorkerUpdate();

  // Dev-only: Show component showcase at /components
  if (import.meta.env.DEV && window.location.pathname === '/components') {
    return (
      <Suspense fallback={<div className="container">Loading...</div>}>
        <ComponentShowcase />
      </Suspense>
    );
  }

  return (
    <>
      <UpdateBanner
        visible={updateAvailable}
        onUpdate={updateAndReload}
        onDismiss={dismiss}
      />
      <HomePage />
    </>
  );
}
