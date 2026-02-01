import { describe, it, expect } from 'vitest';
import { extractTrainNumber } from './trainNumber';

describe('extractTrainNumber', () => {
  describe('SNDR patterns (standard Sounder schedules)', () => {
    it('extracts train number from SNDR_Fall2024_Weekday_1700', () => {
      expect(extractTrainNumber('SNDR_Fall2024_Weekday_1700')).toBe('1700');
    });

    it('extracts train number from SNDR_Fall2024_Reduced_Weekday_1702', () => {
      expect(extractTrainNumber('SNDR_Fall2024_Reduced_Weekday_1702')).toBe('1702');
    });

    it('extracts train number from SNDR_Fall2024_Weekday_1704', () => {
      expect(extractTrainNumber('SNDR_Fall2024_Weekday_1704')).toBe('1704');
    });
  });

  describe('SOUNDER patterns (gameday schedules)', () => {
    it('extracts train number from SOUNDER_GAMEDAY_1210_Sunday_1811', () => {
      expect(extractTrainNumber('SOUNDER_GAMEDAY_1210_Sunday_1811')).toBe('1811');
    });

    it('extracts train number from SOUNDER_WSF_1200', () => {
      expect(extractTrainNumber('SOUNDER_WSF_1200')).toBe('1200');
    });
  });

  describe('hyphenated patterns (ferry/gameday)', () => {
    it('extracts train number from 1820E-WSF1200', () => {
      expect(extractTrainNumber('1820E-WSF1200')).toBe('1820E');
    });

    it('extracts train number from 1811-Gameday1310', () => {
      expect(extractTrainNumber('1811-Gameday1310')).toBe('1811');
    });

    it('extracts train number from 1833-GamedayDouble1305', () => {
      expect(extractTrainNumber('1833-GamedayDouble1305')).toBe('1833');
    });

    it('extracts train number from 1822E-WSF1200', () => {
      expect(extractTrainNumber('1822E-WSF1200')).toBe('1822E');
    });
  });

  describe('AMTRAK patterns (RailPlus trains)', () => {
    it('extracts train number from AMTRAK_516', () => {
      expect(extractTrainNumber('AMTRAK_516')).toBe('516');
    });

    it('extracts train number from AMTRAK_517', () => {
      expect(extractTrainNumber('AMTRAK_517')).toBe('517');
    });

    it('extracts train number from AMTRAK_518', () => {
      expect(extractTrainNumber('AMTRAK_518')).toBe('518');
    });

    it('extracts train number from AMTRAK_519', () => {
      expect(extractTrainNumber('AMTRAK_519')).toBe('519');
    });
  });

  describe('edge cases', () => {
    it('returns undefined for undefined input', () => {
      expect(extractTrainNumber(undefined)).toBeUndefined();
    });

    it('returns undefined for empty string', () => {
      expect(extractTrainNumber('')).toBeUndefined();
    });

    it('returns undefined for unrecognized pattern without underscore or hyphen', () => {
      expect(extractTrainNumber('UNKNOWN')).toBeUndefined();
    });

    it('handles tripId with only underscores', () => {
      expect(extractTrainNumber('A_B_C')).toBeUndefined();
    });

    it('handles tripId starting with hyphen', () => {
      expect(extractTrainNumber('-Something')).toBe('');
    });
  });
});
