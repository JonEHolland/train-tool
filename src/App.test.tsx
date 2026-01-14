import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from './hooks/useLocalStorage';

/**
 * Tests for station persistence behavior.
 *
 * The app stores station selections as a map keyed by route ID:
 * - `sounder-stops` = { "n-line": "edmonds", "s-line": "kent" }
 *
 * This allows each route to remember its own station selection.
 */

// Provide localStorage for test environment
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
  beforeEach(() => {
    store = {};
  });

  it('stores station selections as a map keyed by route ID', () => {
    const { result } = renderHook(() =>
      useLocalStorage<Record<string, string>>('sounder-stops', {})
    );

    act(() => {
      result.current[1]({ 'n-line': 'edmonds' });
    });

    expect(result.current[0]).toEqual({ 'n-line': 'edmonds' });
  });

  it('preserves station selection when switching routes', () => {
    const { result } = renderHook(() =>
      useLocalStorage<Record<string, string>>('sounder-stops', {})
    );

    // Set station for n-line
    act(() => {
      result.current[1]({ 'n-line': 'edmonds' });
    });

    // Add station for s-line (simulating route switch and station selection)
    act(() => {
      result.current[1](prev => ({ ...prev, 's-line': 'kent' }));
    });

    // Both stations should be preserved
    expect(result.current[0]).toEqual({
      'n-line': 'edmonds',
      's-line': 'kent'
    });

    // Simulate looking up station for n-line (after switching back)
    expect(result.current[0]['n-line']).toBe('edmonds');
  });

  it('allows updating station for current route without affecting other routes', () => {
    const { result } = renderHook(() =>
      useLocalStorage<Record<string, string>>('sounder-stops', {})
    );

    // Setup: both routes have stations
    act(() => {
      result.current[1]({ 'n-line': 'edmonds', 's-line': 'kent' });
    });

    // Update n-line station to a different one
    act(() => {
      result.current[1](prev => ({ ...prev, 'n-line': 'mukilteo' }));
    });

    // n-line should be updated, s-line should be unchanged
    expect(result.current[0]).toEqual({
      'n-line': 'mukilteo',
      's-line': 'kent'
    });
  });

  it('returns empty string for route with no saved station', () => {
    const { result } = renderHook(() =>
      useLocalStorage<Record<string, string>>('sounder-stops', {})
    );

    // Set station only for n-line
    act(() => {
      result.current[1]({ 'n-line': 'edmonds' });
    });

    // s-line has no station saved - use fallback pattern from App.tsx
    const sLineStation = result.current[0]['s-line'] || '';
    expect(sLineStation).toBe('');
  });

  it('persists across hook re-renders', () => {
    const { result, rerender } = renderHook(() =>
      useLocalStorage<Record<string, string>>('sounder-stops', {})
    );

    act(() => {
      result.current[1]({ 'n-line': 'everett', 's-line': 'tacoma-dome' });
    });

    rerender();

    expect(result.current[0]).toEqual({
      'n-line': 'everett',
      's-line': 'tacoma-dome'
    });
  });

  it('loads existing values on mount', () => {
    // First hook instance sets values
    const { result: first } = renderHook(() =>
      useLocalStorage<Record<string, string>>('sounder-stops', {})
    );

    act(() => {
      first.current[1]({ 'n-line': 'king-street', 's-line': 'auburn' });
    });

    // Second hook instance should load existing values
    const { result: second } = renderHook(() =>
      useLocalStorage<Record<string, string>>('sounder-stops', {})
    );

    expect(second.current[0]).toEqual({
      'n-line': 'king-street',
      's-line': 'auburn'
    });
  });

  it('works with any route ID without hardcoding', () => {
    const { result } = renderHook(() =>
      useLocalStorage<Record<string, string>>('sounder-stops', {})
    );

    // Use arbitrary route IDs - demonstrates generalization
    act(() => {
      result.current[1]({
        'express-line': 'station-a',
        'local-line': 'station-b',
        'weekend-special': 'station-c'
      });
    });

    expect(result.current[0]['express-line']).toBe('station-a');
    expect(result.current[0]['local-line']).toBe('station-b');
    expect(result.current[0]['weekend-special']).toBe('station-c');
  });
});
