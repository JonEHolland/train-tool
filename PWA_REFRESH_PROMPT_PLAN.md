# PWA Refresh Prompt Implementation Plan

## Overview
Implement controlled service worker update flow with user-facing refresh prompts, following the pace-tool repository pattern. Users will see a dismissible banner when updates are available and can choose when to apply them.

## Current State
**train-tool Issues:**
- Service worker calls `self.skipWaiting()` immediately (line 14 of `public/sw.js`) - forces auto-updates without user consent
- No update detection or notification system
- Basic SW registration with no update polling

**pace-tool Pattern:**
- Service worker waits for user permission via 'SKIP_WAITING' message
- React hook detects updates and polls every 10 seconds
- UpdateBanner component shows dismissible prompt with "Update Now" button
- Clean, controlled update flow with automatic reload after activation

## Implementation Steps

### 1. Modify Service Worker (`public/sw.js`)

**Remove auto-skipWaiting (line 14):**
```javascript
// DELETE THIS LINE:
self.skipWaiting();
```

**Add message listener (after line 26):**
```javascript
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
```

**Update activate event to notify clients (replace lines 17-26):**
```javascript
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => {
      return self.clients.claim();
    }).then(() => {
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'ACTIVATED' });
        });
      });
    })
  );
});
```

### 2. Create Service Worker Update Hook

**New file: `src/hooks/useServiceWorkerUpdate.ts`**

Key features:
- Detects waiting service workers on mount
- Listens for 'updatefound' events
- Polls for updates every 10 seconds via `registration.update()`
- Sends 'SKIP_WAITING' message when user clicks update
- Listens for 'controllerchange' and reloads page
- Returns: `{ updateAvailable, updateAndReload, dismiss }`

Implementation:
```typescript
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
```

### 3. Create UpdateBanner Component

**New file: `src/components/UpdateBanner.tsx`**

```typescript
interface UpdateBannerProps {
  visible: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
}

export function UpdateBanner({ visible, onUpdate, onDismiss }: UpdateBannerProps) {
  if (!visible) return null;

  return (
    <div className="update-banner">
      <div className="update-banner-content">
        <div className="update-banner-icon">⚡</div>
        <div className="update-banner-text">
          <div className="update-banner-title">Update Available</div>
          <div className="update-banner-subtitle">New features ready to install</div>
        </div>
      </div>
      <div className="update-banner-actions">
        <button className="update-banner-button" onClick={onUpdate}>
          Update Now
        </button>
        <button className="update-banner-dismiss" onClick={onDismiss}>
          ✕
        </button>
      </div>
    </div>
  );
}
```

### 4. Add UpdateBanner Styles

**File: `src/App.css`** (append to end of file)

```css
.update-banner {
  background: white;
  border: 2px solid #004F2D;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 12px 16px;
  margin: 16px auto;
  max-width: 500px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.update-banner-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.update-banner-icon {
  font-size: 1.5rem;
  line-height: 1;
}

.update-banner-text {
  flex: 1;
}

.update-banner-title {
  font-weight: 600;
  color: #004F2D;
  margin-bottom: 2px;
}

.update-banner-subtitle {
  font-size: 0.85rem;
  color: #666;
}

.update-banner-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.update-banner-button {
  background: #004F2D;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.update-banner-button:hover {
  background: #003d23;
}

.update-banner-dismiss {
  background: transparent;
  border: none;
  color: #666;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 4px 8px;
  line-height: 1;
  transition: color 0.2s;
}

.update-banner-dismiss:hover {
  color: #333;
}

@media (max-width: 500px) {
  .update-banner {
    margin: 16px;
  }
}
```

### 5. Integrate UpdateBanner into App

**File: `src/App.tsx`**

**Add imports (after line 8):**
```typescript
import { UpdateBanner } from './components/UpdateBanner';
import { useServiceWorkerUpdate } from './hooks/useServiceWorkerUpdate';
```

**Add hook usage (after line 136):**
```typescript
const { updateAvailable, updateAndReload, dismiss } = useServiceWorkerUpdate();
```

**Add component in JSX (between Header and container, around line 171):**
```typescript
return (
  <>
    <Header />
    <UpdateBanner
      visible={updateAvailable}
      onUpdate={updateAndReload}
      onDismiss={dismiss}
    />
    <div className="container">
      {/* existing components */}
    </div>
  </>
);
```

### 6. Enhance Service Worker Registration

**File: `src/main.tsx`** (replace lines 12-24)

```typescript
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
```

## Critical Files

1. **`public/sw.js`** - Remove auto-skipWaiting, add message listener and client notifications
2. **`src/hooks/useServiceWorkerUpdate.ts`** - New hook for update detection and management
3. **`src/components/UpdateBanner.tsx`** - New UI component for update prompt
4. **`src/App.tsx`** - Integration point for hook and banner
5. **`src/App.css`** - Banner styling matching Sound Transit branding
6. **`src/main.tsx`** - Enhanced registration with immediate update check

## Edge Cases Handled

- **First-time installation**: Hook gracefully handles missing registration
- **Multiple tabs**: All tabs reload when update is triggered
- **Dismissed banner**: Reappears on next page load or new update
- **Network failures**: Silent failure, retries on next poll
- **Older browsers**: Graceful degradation with feature detection
- **Development mode**: SW unregistered to prevent caching issues

## Verification Steps

### Test 1: Initial Deployment
1. Deploy code with SW changes
2. Open app in browser
3. Check DevTools → Application → Service Workers shows active SW
4. Verify app loads and caches correctly

### Test 2: Update Detection
1. Make visible change (e.g., change header text)
2. Increment CACHE_NAME in `sw.js` (e.g., 'sounder-v3')
3. Build and deploy
4. Keep app open, wait 10 seconds
5. Verify UpdateBanner appears with lightning bolt and text

### Test 3: Update Flow
1. Click "Update Now" button
2. Verify page reloads automatically
3. Verify new version is visible
4. Check DevTools confirms new SW is active

### Test 4: Dismiss Functionality
1. Trigger another update
2. Click dismiss button (✕)
3. Verify banner disappears
4. Reload page manually
5. Verify banner reappears (update still waiting)

### Test 5: Multiple Tabs
1. Open app in two browser tabs
2. Trigger update
3. Click "Update Now" in one tab
4. Verify both tabs reload simultaneously

## Cache Invalidation Strategy

The cache hash is calculated by combining:
- `dist/index.html` (contains all bundled JavaScript including schedule data)
- `public/sw.js` (service worker source code)
- `public/manifest.json` (PWA manifest)

**What triggers cache updates:**
- ✅ App code changes (components, hooks, utilities)
- ✅ Schedule data changes (`src/schedule-data.json`)
- ✅ Service worker logic changes
- ✅ Manifest changes (icons, name, colors)
- ✅ CSS changes (inlined in index.html)

All changes result in a new hash → new cache name → update detected → banner appears!

## Dependencies

**None required** - All functionality uses native Web APIs:
- Service Worker API
- Navigator API
- React hooks (already available)
- TypeScript DOM types (already configured)

## Rollback Plan

If issues occur, revert in reverse order:
1. Remove UpdateBanner from App.tsx
2. Revert main.tsx registration changes
3. Re-add `self.skipWaiting()` to sw.js line 14

App continues functioning with auto-updating service worker.

## Design Notes

- Uses Sound Transit green (#004F2D) for branding consistency
- Matches existing card design (12px border-radius, box-shadow)
- Positioned after Header for immediate visibility
- Dismissible to avoid blocking user workflow
- Responsive design for mobile devices
- Accessibility with clear button labels
