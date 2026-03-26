import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './hooks/useLocalStorage';

/**
 * Tests for station persistence behavior.
 * The app stores station selections as a map keyed by route ID.
 */

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

describe('App - Station Persistence', () => {
  beforeEach(() => { store = {}; });

  it('stores and retrieves station selections by route', () => {
    const { result } = renderHook(() =>
      useLocalStorage<Record<string, string>>('sounder-stops', {})
    );

    act(() => { result.current[1]({ 'n-line': 'edmonds' }); });
    expect(result.current[0]).toEqual({ 'n-line': 'edmonds' });
  });

  it('preserves selections across routes and loads on mount', () => {
    const { result: first } = renderHook(() =>
      useLocalStorage<Record<string, string>>('sounder-stops', {})
    );

    act(() => { first.current[1]({ 'n-line': 'edmonds' }); });
    act(() => { first.current[1](prev => ({ ...prev, 's-line': 'kent' })); });
    expect(first.current[0]).toEqual({ 'n-line': 'edmonds', 's-line': 'kent' });

    // New hook instance loads persisted values
    const { result: second } = renderHook(() =>
      useLocalStorage<Record<string, string>>('sounder-stops', {})
    );
    expect(second.current[0]).toEqual({ 'n-line': 'edmonds', 's-line': 'kent' });
  });
});
