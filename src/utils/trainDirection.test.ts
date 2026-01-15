import { describe, it, expect } from 'vitest';
import { getDirectionArrow } from './trainDirection';

describe('getDirectionArrow', () => {
  describe('N-Line northbound stations', () => {
    it('returns ↑ for Everett', () => {
      expect(getDirectionArrow('Everett Station')).toBe('↑');
      expect(getDirectionArrow('everett')).toBe('↑');
    });

    it('returns ↑ for Edmonds', () => {
      expect(getDirectionArrow('Edmonds Station')).toBe('↑');
      expect(getDirectionArrow('edmonds')).toBe('↑');
    });

    it('returns ↑ for Mukilteo', () => {
      expect(getDirectionArrow('Mukilteo Station')).toBe('↑');
      expect(getDirectionArrow('mukilteo')).toBe('↑');
    });
  });

  describe('southbound stations (both lines)', () => {
    it('returns ↓ for Tacoma', () => {
      expect(getDirectionArrow('Tacoma Dome Station')).toBe('↓');
      expect(getDirectionArrow('tacoma')).toBe('↓');
    });

    it('returns ↓ for Lakewood', () => {
      expect(getDirectionArrow('Lakewood Station')).toBe('↓');
      expect(getDirectionArrow('lakewood')).toBe('↓');
    });

    it('returns ↓ for Puyallup', () => {
      expect(getDirectionArrow('Puyallup Station')).toBe('↓');
      expect(getDirectionArrow('puyallup')).toBe('↓');
    });

    it('returns ↓ for Sumner', () => {
      expect(getDirectionArrow('Sumner Station')).toBe('↓');
      expect(getDirectionArrow('sumner')).toBe('↓');
    });

    it('returns ↓ for Auburn', () => {
      expect(getDirectionArrow('Auburn Station')).toBe('↓');
      expect(getDirectionArrow('auburn')).toBe('↓');
    });

    it('returns ↓ for Kent', () => {
      expect(getDirectionArrow('Kent Station')).toBe('↓');
      expect(getDirectionArrow('kent')).toBe('↓');
    });

    it('returns ↓ for Tukwila', () => {
      expect(getDirectionArrow('Tukwila Station')).toBe('↓');
      expect(getDirectionArrow('tukwila')).toBe('↓');
    });
  });

  describe('route-dependent stations (Seattle/King Street)', () => {
    describe('N-Line', () => {
      it('returns ↓ for King Street (south end of N-Line)', () => {
        expect(getDirectionArrow('King Street Station', 'n-line')).toBe('↓');
      });

      it('returns ↓ for Seattle (south end of N-Line)', () => {
        expect(getDirectionArrow('Seattle Station', 'n-line')).toBe('↓');
      });
    });

    describe('S-Line', () => {
      it('returns ↑ for King Street (north end of S-Line)', () => {
        expect(getDirectionArrow('King Street Station', 's-line')).toBe('↑');
      });

      it('returns ↑ for Seattle (north end of S-Line)', () => {
        expect(getDirectionArrow('Seattle Station', 's-line')).toBe('↑');
      });
    });

    describe('no route specified', () => {
      it('returns ↑ for King Street when no route (defaults to S-Line behavior)', () => {
        expect(getDirectionArrow('King Street Station')).toBe('↑');
      });
    });
  });

  describe('unknown stations', () => {
    it('returns empty string for unknown station names', () => {
      expect(getDirectionArrow('Unknown Station')).toBe('');
      expect(getDirectionArrow('Random Place')).toBe('');
      expect(getDirectionArrow('')).toBe('');
    });
  });

  describe('case insensitivity', () => {
    it('handles mixed case station names', () => {
      expect(getDirectionArrow('EVERETT STATION')).toBe('↑');
      expect(getDirectionArrow('TaCoMa DoMe')).toBe('↓');
      expect(getDirectionArrow('KING STREET', 'n-line')).toBe('↓');
    });
  });

  describe('partial matches', () => {
    it('matches stations within longer strings', () => {
      expect(getDirectionArrow('To Everett via Express')).toBe('↑');
      expect(getDirectionArrow('Heading to Tacoma Dome')).toBe('↓');
    });
  });
});
