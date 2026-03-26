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
  it.each([
    ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', 'safari-ios'],
    ['Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', 'safari-ios'],
    ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15', 'safari-macos'],
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 'chromium'],
    ['Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0', 'unsupported'],
  ])('detects %s as %s', (ua, expected) => {
    expect(detectPlatform(ua)).toBe(expected);
  });
});

describe('isStandalone', () => {
  const originalMatchMedia = window.matchMedia;
  const originalNavigator = window.navigator;

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    Object.defineProperty(window, 'navigator', { value: originalNavigator, writable: true });
  });

  it('detects standalone via matchMedia and iOS navigator.standalone', () => {
    // Standard standalone
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(display-mode: standalone)',
      media: query, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    }));
    expect(isStandalone()).toBe(true);

    // Not standalone
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false, media: '(display-mode: standalone)', onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    });
    Object.defineProperty(window, 'navigator', { value: { ...originalNavigator }, writable: true });
    expect(isStandalone()).toBe(false);

    // iOS standalone
    Object.defineProperty(window, 'navigator', { value: { ...originalNavigator, standalone: true }, writable: true });
    expect(isStandalone()).toBe(true);
  });
});

describe('isDismissedRecently', () => {
  beforeEach(() => { vi.useFakeTimers(); localStorage.clear(); });
  afterEach(() => { vi.useRealTimers(); localStorage.clear(); });

  it('detects dismissal within and beyond 7 days', () => {
    expect(isDismissedRecently()).toBe(false);

    const now = Date.now();
    vi.setSystemTime(now);
    localStorage.setItem(INSTALL_DISMISS_KEY, (now - 1000).toString());
    expect(isDismissedRecently()).toBe(true);

    localStorage.setItem(INSTALL_DISMISS_KEY, (now - INSTALL_DISMISS_DURATION_MS - 1000).toString());
    expect(isDismissedRecently()).toBe(false);
  });
});

describe('useInstallPrompt', () => {
  const originalMatchMedia = window.matchMedia;
  const originalNavigator = window.navigator;

  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false, media: '(display-mode: standalone)', onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
    window.matchMedia = originalMatchMedia;
    Object.defineProperty(window, 'navigator', { value: originalNavigator, writable: true });
  });

  it('returns canShow false when standalone or recently dismissed', () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === '(display-mode: standalone)',
      media: query, onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    }));
    expect(renderHook(() => useInstallPrompt()).result.current.canShow).toBe(false);

    // Reset matchMedia, test dismissal
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false, media: '(display-mode: standalone)', onchange: null,
      addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    });
    const now = Date.now();
    vi.setSystemTime(now);
    localStorage.setItem(INSTALL_DISMISS_KEY, (now - 1000).toString());
    expect(renderHook(() => useInstallPrompt()).result.current.canShow).toBe(false);
  });

  it('dismiss stores timestamp and hides banner', () => {
    const now = Date.now();
    vi.setSystemTime(now);
    const { result } = renderHook(() => useInstallPrompt());

    act(() => { result.current.dismiss(); });
    expect(localStorage.getItem(INSTALL_DISMISS_KEY)).toBe(now.toString());
    expect(result.current.canShow).toBe(false);
  });

  it('handles beforeinstallprompt event for chromium', () => {
    const chromeUA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    Object.defineProperty(navigator, 'userAgent', { value: chromeUA, configurable: true });

    let beforeInstallHandler: ((e: Event) => void) | null = null;
    window.addEventListener = vi.fn((type, handler) => {
      if (type === 'beforeinstallprompt') beforeInstallHandler = handler as (e: Event) => void;
    });
    window.removeEventListener = vi.fn();

    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.canShow).toBe(false);
    expect(result.current.platform).toBe('chromium');

    act(() => {
      beforeInstallHandler?.({
        preventDefault: vi.fn(),
        prompt: vi.fn().mockResolvedValue(undefined),
        userChoice: Promise.resolve({ outcome: 'accepted' as const }),
      } as unknown as Event);
    });

    expect(result.current.canShow).toBe(true);
  });
});
