import { describe, it, expect } from 'vitest';
import { extractTrainNumber } from './trainNumber';

describe('extractTrainNumber', () => {
  it.each([
    ['SNDR_Fall2024_Weekday_1700', '1700'],
    ['SNDR_Fall2024_Reduced_Weekday_1702', '1702'],
    ['SOUNDER_GAMEDAY_1210_Sunday_1811', '1811'],
    ['SOUNDER_WSF_1200', '1200'],
    ['1820E-WSF1200', '1820E'],
    ['1811-Gameday1310', '1811'],
    ['AMTRAK_516', '516'],
    ['AMTRAK_519', '519'],
  ])('extracts from %s -> %s', (input, expected) => {
    expect(extractTrainNumber(input)).toBe(expected);
  });

  it.each([
    [undefined, undefined],
    ['', undefined],
    ['UNKNOWN', undefined],
  ])('returns undefined for %s', (input, expected) => {
    expect(extractTrainNumber(input as string | undefined)).toBe(expected);
  });
});
