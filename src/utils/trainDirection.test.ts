import { describe, it, expect } from 'vitest';
import { getDirectionArrow } from './trainDirection';

describe('getDirectionArrow', () => {
  it.each([
    ['Everett Station', undefined, '↑'],
    ['Edmonds Station', undefined, '↑'],
    ['Mukilteo Station', undefined, '↑'],
    ['everett', undefined, '↑'],
  ])('northbound: %s -> %s', (station, route, expected) => {
    expect(getDirectionArrow(station, route)).toBe(expected);
  });

  it.each([
    ['Tacoma Dome Station', undefined, '↓'],
    ['Lakewood Station', undefined, '↓'],
    ['Puyallup Station', undefined, '↓'],
    ['Auburn Station', undefined, '↓'],
    ['Kent Station', undefined, '↓'],
    ['Tukwila Station', undefined, '↓'],
    ['tacoma', undefined, '↓'],
  ])('southbound: %s -> %s', (station, route, expected) => {
    expect(getDirectionArrow(station, route)).toBe(expected);
  });

  it('handles King Street direction based on route', () => {
    expect(getDirectionArrow('King Street Station', 'n-line')).toBe('↓');
    expect(getDirectionArrow('King Street Station', 's-line')).toBe('↑');
    expect(getDirectionArrow('King Street Station')).toBe('↑');
  });

  it('is case insensitive and matches partial strings', () => {
    expect(getDirectionArrow('EVERETT STATION')).toBe('↑');
    expect(getDirectionArrow('TaCoMa DoMe')).toBe('↓');
    expect(getDirectionArrow('To Everett via Express')).toBe('↑');
  });

  it('returns empty string for unknown stations', () => {
    expect(getDirectionArrow('Unknown Station')).toBe('');
    expect(getDirectionArrow('')).toBe('');
  });
});
