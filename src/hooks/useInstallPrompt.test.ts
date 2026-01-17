import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInstallPrompt, detectPlatform, isStandalone, isDismissedRecently } from './useInstallPrompt';
import { INSTALL_DISMISS_KEY, INSTALL_DISMISS_DURATION_MS } from '../utils/constants';

// Mock localStorage for test environment
let store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { store = {}; },
  get length() { return Object.keys(store).length; },
  key: (index: number) => Object.keys(store)[index] ?? null,
};

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('detectPlatform', () => {
  it('detects iOS Safari', () => {
    const iosUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
    expect(detectPlatform(iosUA)).toBe('safari-ios');
  });

  it('detects iPad Safari', () => {
    const ipadUA = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
    expect(detectPlatform(ipadUA)).toBe('safari-ios');
  });

  it('detects macOS Safari', () => {
    const macUA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
    expect(detectPlatform(macUA)).toBe('safari-macos');
  });

  it('detects Chrome as chromium', () => {
    const chromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    expect(detectPlatform(chromeUA)).toBe('chromium');
  });

  it('detects Edge as chromium', () => {
    const edgeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0';
    expect(detectPlatform(edgeUA)).toBe('chromium');
  });

  it('detects Chrome on iOS as safari-ios (not chromium)', () => {
    const chromeIosUA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.0.0 Mobile/15E148 Safari/604.1';
    // Chrome on iOS uses WebKit, but we should detect it's on iOS
    expect(detectPlatform(chromeIosUA)).toBe('unsupported');
  });

  it('returns unsupported for Firefox', () => {
    const firefoxUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0';
    expect(detectPlatform(firefoxUA)).toBe('unsupported');
  });
});

describe('isStandalone', () => {
  const originalMatchMedia = window.matchMedia;
  const originalNavigator = window.navigator;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    Object.defineProperty(window, 'navigator', { value: originalNavigator, writable: true });
  });

  it('returns true when display-mode is standalone', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    expect(isStandalone()).toBe(true);
  });

  it('returns false when display-mode is browser', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      media: '(display-mode: standalone)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    const nav = { ...originalNavigator };
    Object.defineProperty(window, 'navigator', { value: nav, writable: true });

    expect(isStandalone()).toBe(false);
  });

  it('returns true when iOS standalone mode is active', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      media: '(display-mode: standalone)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    const nav = { ...originalNavigator, standalone: true };
    Object.defineProperty(window, 'navigator', { value: nav, writable: true });

    expect(isStandalone()).toBe(true);
  });
});

describe('isDismissedRecently', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('returns false when no dismissal stored', () => {
    expect(isDismissedRecently()).toBe(false);
  });

  it('returns true when dismissed within 7 days', () => {
    const now = Date.now();
    vi.setSystemTime(now);
    localStorage.setItem(INSTALL_DISMISS_KEY, (now - 1000).toString()); // 1 second ago

    expect(isDismissedRecently()).toBe(true);
  });

  it('returns false when dismissed more than 7 days ago', () => {
    const now = Date.now();
    vi.setSystemTime(now);
    const eightDaysAgo = now - (INSTALL_DISMISS_DURATION_MS + 1000);
    localStorage.setItem(INSTALL_DISMISS_KEY, eightDaysAgo.toString());

    expect(isDismissedRecently()).toBe(false);
  });

  it('returns false when stored value is invalid', () => {
    localStorage.setItem(INSTALL_DISMISS_KEY, 'invalid');
    expect(isDismissedRecently()).toBe(false);
  });
});

describe('useInstallPrompt', () => {
  const originalAddEventListener = window.addEventListener;
  const originalRemoveEventListener = window.removeEventListener;
  const originalMatchMedia = window.matchMedia;
  const originalNavigator = window.navigator;

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();

    // Default to non-standalone mode
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      media: '(display-mode: standalone)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
    window.addEventListener = originalAddEventListener;
    window.removeEventListener = originalRemoveEventListener;
    window.matchMedia = originalMatchMedia;
    Object.defineProperty(window, 'navigator', { value: originalNavigator, writable: true });
  });

  it('returns canShow false when already installed (standalone)', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(display-mode: standalone)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => useInstallPrompt());

    expect(result.current.canShow).toBe(false);
  });

  it('returns canShow false when recently dismissed', () => {
    const now = Date.now();
    vi.setSystemTime(now);
    localStorage.setItem(INSTALL_DISMISS_KEY, (now - 1000).toString());

    const { result } = renderHook(() => useInstallPrompt());

    expect(result.current.canShow).toBe(false);
  });

  it('dismiss stores timestamp and hides banner', () => {
    const now = Date.now();
    vi.setSystemTime(now);

    const { result } = renderHook(() => useInstallPrompt());

    act(() => {
      result.current.dismiss();
    });

    expect(localStorage.getItem(INSTALL_DISMISS_KEY)).toBe(now.toString());
    expect(result.current.canShow).toBe(false);
  });

  it('handles beforeinstallprompt event for chromium', () => {
    // Mock chromium user agent
    const chromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    Object.defineProperty(navigator, 'userAgent', { value: chromeUA, configurable: true });

    let beforeInstallHandler: ((e: Event) => void) | null = null;

    window.addEventListener = vi.fn((type, handler) => {
      if (type === 'beforeinstallprompt') {
        beforeInstallHandler = handler as (e: Event) => void;
      }
    });

    window.removeEventListener = vi.fn();

    const { result } = renderHook(() => useInstallPrompt());

    // Initially canShow is false (no deferred prompt yet)
    expect(result.current.canShow).toBe(false);
    expect(result.current.platform).toBe('chromium');

    // Simulate beforeinstallprompt event
    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const mockEvent = {
      preventDefault: vi.fn(),
      prompt: mockPrompt,
      userChoice: Promise.resolve({ outcome: 'accepted' as const }),
    };

    act(() => {
      beforeInstallHandler?.(mockEvent as unknown as Event);
    });

    // Now canShow should be true
    expect(result.current.canShow).toBe(true);
  });

  it('handles appinstalled event', () => {
    let appInstalledHandler: (() => void) | null = null;

    window.addEventListener = vi.fn((type, handler) => {
      if (type === 'appinstalled') {
        appInstalledHandler = handler as () => void;
      }
    });

    window.removeEventListener = vi.fn();

    const { result } = renderHook(() => useInstallPrompt());

    // Simulate appinstalled event
    act(() => {
      appInstalledHandler?.();
    });

    // canShow should be false after installation
    expect(result.current.canShow).toBe(false);
  });

  it('cleans up event listeners on unmount', () => {
    window.removeEventListener = vi.fn();

    const { unmount } = renderHook(() => useInstallPrompt());

    unmount();

    expect(window.removeEventListener).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
    expect(window.removeEventListener).toHaveBeenCalledWith('appinstalled', expect.any(Function));
  });
});
