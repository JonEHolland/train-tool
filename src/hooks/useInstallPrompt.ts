import { useState, useEffect, useCallback } from 'react';
import type { InstallPlatform } from '../types';
import { INSTALL_DISMISS_DURATION_MS, INSTALL_DISMISS_KEY } from '../utils/constants';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface UseInstallPromptResult {
  /** Whether the install banner can be shown */
  canShow: boolean;
  /** Detected platform for install */
  platform: InstallPlatform;
  /** Trigger the native install prompt (Chromium only) */
  installApp: () => Promise<void>;
  /** Dismiss the banner for 7 days */
  dismiss: () => void;
}

/**
 * Detect platform based on user agent
 */
export function detectPlatform(userAgent: string = navigator.userAgent): InstallPlatform {
  const ua = userAgent.toLowerCase();

  // Check for iOS Safari (iPhone/iPad/iPod, not Chrome/Firefox/etc)
  const isIOS = /iphone|ipad|ipod/.test(ua);
  const isSafari = /safari/.test(ua) && !/chrome|crios|fxios|edgios/.test(ua);

  if (isIOS && isSafari) {
    return 'safari-ios';
  }

  // Check for macOS Safari
  const isMacOS = /macintosh|mac os x/.test(ua);
  if (isMacOS && isSafari) {
    return 'safari-macos';
  }

  // Check for Chromium-based browsers (Chrome, Edge, etc.)
  // These support the beforeinstallprompt event
  const isChromium = /chrome|chromium|edg/.test(ua) && !/opr/.test(ua);
  if (isChromium) {
    return 'chromium';
  }

  return 'unsupported';
}

/**
 * Check if app is running in standalone mode (already installed)
 */
export function isStandalone(): boolean {
  // Check display-mode media query
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return true;
  }

  // iOS Safari standalone check
  if ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone) {
    return true;
  }

  return false;
}

/**
 * Check if user dismissed the banner recently (within 7 days)
 */
export function isDismissedRecently(): boolean {
  try {
    const dismissedAt = localStorage.getItem(INSTALL_DISMISS_KEY);
    if (!dismissedAt) return false;

    const dismissedTime = parseInt(dismissedAt, 10);
    if (isNaN(dismissedTime)) return false;

    return Date.now() - dismissedTime < INSTALL_DISMISS_DURATION_MS;
  } catch {
    // localStorage may not be available
    return false;
  }
}

/**
 * Hook managing install prompt state across platforms.
 *
 * - Chromium: Uses beforeinstallprompt event for native install
 * - Safari iOS: Shows instructions banner immediately
 * - Safari macOS: Shows instructions banner immediately
 * - Unsupported: Returns canShow: false
 */
export function useInstallPrompt(): UseInstallPromptResult {
  const [platform] = useState(() => detectPlatform());
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => isDismissedRecently());
  const [installed, setInstalled] = useState(() => isStandalone());

  // Listen for beforeinstallprompt (Chromium only)
  useEffect(() => {
    if (platform !== 'chromium') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [platform]);

  // Listen for appinstalled event (Chromium only)
  useEffect(() => {
    const handleAppInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);
    return () => window.removeEventListener('appinstalled', handleAppInstalled);
  }, []);

  // Trigger install prompt (Chromium only)
  const installApp = useCallback(async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setInstalled(true);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  // Dismiss banner for 7 days
  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(INSTALL_DISMISS_KEY, Date.now().toString());
    } catch {
      // localStorage may not be available
    }
    setDismissed(true);
  }, []);

  // Determine if banner can be shown
  const canShow = (() => {
    // Already installed - don't show
    if (installed) return false;

    // Recently dismissed - don't show
    if (dismissed) return false;

    // Platform-specific checks
    switch (platform) {
      case 'chromium':
        // Only show when we have the deferred prompt
        return deferredPrompt !== null;
      case 'safari-ios':
      case 'safari-macos':
        // Show immediately for Safari
        return true;
      case 'unsupported':
      default:
        return false;
    }
  })();

  return {
    canShow,
    platform,
    installApp,
    dismiss,
  };
}
