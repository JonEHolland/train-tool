import { describe, it, expect } from 'vitest';
import {
  extractTrainNumbers,
  classifySeverity,
  extractDelayMinutes,
  formatAlertMessage,
  parseTrainAlerts,
} from './parseTrainAlerts';
import {
  ALERT_TRAIN_DELAYED,
  ALERT_TRAIN_CANCELLED,
  ALERT_MULTIPLE_TRAINS,
  ALERT_COLON_FORMAT,
  ALERT_TRAIN_WITH_SUFFIX,
  ALERT_MODIFIED_SERVICE,
  ALERT_GENERAL,
  ALERT_EMPTY_DESCRIPTION,
  ALERT_HEADER_ONLY,
  ALERT_HASH_PREFIX,
} from '../../tests/fixtures/alerts';

describe('parseTrainAlerts', () => {
  describe('extractTrainNumbers', () => {
    it('extracts "Train 1700" format', () => {
      expect(extractTrainNumbers('Train 1700 is delayed')).toEqual(['1700']);
    });

    it('extracts "Train #1700" format with hash', () => {
      expect(extractTrainNumbers('Train #1511 has been cancelled')).toEqual(['1511']);
    });

    it('extracts "train" lowercase', () => {
      expect(extractTrainNumbers('train 1700 is running late')).toEqual(['1700']);
    });

    it('extracts "Sounder train #1700" format', () => {
      expect(extractTrainNumbers('Sounder train #1511 cancelled')).toEqual(['1511']);
    });

    it('extracts "1702:" colon format at line start', () => {
      expect(extractTrainNumbers('1702: Running late')).toEqual(['1702']);
    });

    it('extracts "#1700" standalone hash format', () => {
      expect(extractTrainNumbers('Due to congestion, #1704 is delayed')).toEqual(['1704']);
    });

    it('extracts train number with letter suffix', () => {
      expect(extractTrainNumbers('Train 1820E is delayed')).toEqual(['1820E']);
    });

    it('extracts multiple train numbers from comma list', () => {
      const numbers = extractTrainNumbers('Trains 1700, 1702, and 1704 are delayed');
      expect(numbers).toContain('1700');
      expect(numbers).toContain('1702');
      expect(numbers).toContain('1704');
    });

    it('extracts train numbers from multiple patterns in same text', () => {
      const text = 'Train 1700 and #1702 are both delayed.\n1704: also affected.';
      const numbers = extractTrainNumbers(text);
      expect(numbers).toContain('1700');
      expect(numbers).toContain('1702');
      expect(numbers).toContain('1704');
    });

    it('returns empty array when no train numbers found', () => {
      expect(extractTrainNumbers('All trains may experience delays')).toEqual([]);
    });

    it('returns empty array for empty string', () => {
      expect(extractTrainNumbers('')).toEqual([]);
    });

    it('does not extract non-train numbers like years', () => {
      // Years like 2024 should not be extracted (they don't match our patterns)
      const numbers = extractTrainNumbers('In 2024, service will be improved');
      expect(numbers).toEqual([]);
    });

    it('deduplicates repeated train numbers', () => {
      const numbers = extractTrainNumbers('Train 1700 and Train #1700 are the same');
      expect(numbers).toEqual(['1700']);
    });
  });

  describe('classifySeverity', () => {
    it('classifies "cancelled" keyword as cancelled', () => {
      expect(classifySeverity('Train has been cancelled')).toBe('cancelled');
    });

    it('classifies "cancel" keyword as cancelled', () => {
      expect(classifySeverity('We need to cancel this service')).toBe('cancelled');
    });

    it('classifies "not operating" as cancelled', () => {
      expect(classifySeverity('Train is not operating today')).toBe('cancelled');
    });

    it('classifies "suspended" as cancelled', () => {
      expect(classifySeverity('Service has been suspended')).toBe('cancelled');
    });

    it('classifies "delayed" keyword as delayed', () => {
      expect(classifySeverity('Train is delayed by 15 minutes')).toBe('delayed');
    });

    it('classifies "late" keyword as delayed', () => {
      expect(classifySeverity('Running 10 minutes late')).toBe('delayed');
    });

    it('classifies "behind schedule" as delayed', () => {
      expect(classifySeverity('Train running behind schedule')).toBe('delayed');
    });

    it('classifies "skip" keyword as modified', () => {
      expect(classifySeverity('Train will skip this station')).toBe('modified');
    });

    it('classifies "express" keyword as modified', () => {
      expect(classifySeverity('Running as express service')).toBe('modified');
    });

    it('classifies "advisory" keyword as info', () => {
      expect(classifySeverity('Service advisory for today')).toBe('info');
    });

    it('defaults to info when no keywords match', () => {
      expect(classifySeverity('Regular service update')).toBe('info');
    });

    it('prioritizes cancelled over delayed', () => {
      expect(classifySeverity('Train cancelled due to delays')).toBe('cancelled');
    });

    it('prioritizes delayed over modified', () => {
      expect(classifySeverity('Train delayed, will skip some stops')).toBe('delayed');
    });

    it('is case insensitive', () => {
      expect(classifySeverity('TRAIN HAS BEEN CANCELLED')).toBe('cancelled');
      expect(classifySeverity('RUNNING LATE')).toBe('delayed');
    });
  });

  describe('extractDelayMinutes', () => {
    it('extracts "15 minutes late"', () => {
      expect(extractDelayMinutes('Running 15 minutes late')).toBe(15);
    });

    it('extracts "10 min late"', () => {
      expect(extractDelayMinutes('Train is 10 min late')).toBe(10);
    });

    it('extracts "delayed 20 minutes"', () => {
      expect(extractDelayMinutes('Train delayed 20 minutes')).toBe(20);
    });

    it('extracts "delayed by 25 min"', () => {
      expect(extractDelayMinutes('Train delayed by 25 min')).toBe(25);
    });

    it('extracts "approximately 30 min"', () => {
      expect(extractDelayMinutes('Arriving approximately 30 min late')).toBe(30);
    });

    it('extracts "5 minute delay"', () => {
      expect(extractDelayMinutes('Experiencing a 5 minute delay')).toBe(5);
    });

    it('returns undefined when no delay mentioned', () => {
      expect(extractDelayMinutes('Train has been cancelled')).toBeUndefined();
    });

    it('returns undefined for empty string', () => {
      expect(extractDelayMinutes('')).toBeUndefined();
    });

    it('rejects unreasonably large delays (>180 min)', () => {
      expect(extractDelayMinutes('Delayed 500 minutes')).toBeUndefined();
    });

    it('rejects zero or negative delays', () => {
      expect(extractDelayMinutes('0 minutes late')).toBeUndefined();
    });
  });

  describe('formatAlertMessage', () => {
    it('formats cancelled message', () => {
      expect(formatAlertMessage('cancelled')).toBe('Cancelled');
    });

    it('formats delayed message with minutes', () => {
      expect(formatAlertMessage('delayed', 15)).toBe('Running 15m late');
    });

    it('formats delayed message without minutes', () => {
      expect(formatAlertMessage('delayed')).toBe('Delayed');
    });

    it('formats modified message', () => {
      expect(formatAlertMessage('modified')).toBe('Modified service');
    });

    it('formats info message', () => {
      expect(formatAlertMessage('info')).toBe('Service alert');
    });
  });

  describe('parseTrainAlerts (integration)', () => {
    it('parses single delayed train alert', () => {
      const result = parseTrainAlerts([ALERT_TRAIN_DELAYED]);

      expect(result.trainAlerts.size).toBe(1);
      // All alerts also go to generalAlerts for the SERVICE ALERTS card
      expect(result.generalAlerts).toHaveLength(1);

      const alert = result.trainAlerts.get('1700');
      expect(alert).toBeDefined();
      expect(alert?.severity).toBe('delayed');
      expect(alert?.delayMinutes).toBe(15);
      expect(alert?.message).toBe('Running 15m late');
    });

    it('parses cancelled train alert', () => {
      const result = parseTrainAlerts([ALERT_TRAIN_CANCELLED]);

      expect(result.trainAlerts.size).toBe(1);
      const alert = result.trainAlerts.get('1511');
      expect(alert?.severity).toBe('cancelled');
      expect(alert?.message).toBe('Cancelled');
    });

    it('parses multiple trains from single alert', () => {
      const result = parseTrainAlerts([ALERT_MULTIPLE_TRAINS]);

      expect(result.trainAlerts.size).toBe(3);
      expect(result.trainAlerts.has('1700')).toBe(true);
      expect(result.trainAlerts.has('1702')).toBe(true);
      expect(result.trainAlerts.has('1704')).toBe(true);

      // All should have same delay info
      expect(result.trainAlerts.get('1700')?.delayMinutes).toBe(10);
      expect(result.trainAlerts.get('1702')?.delayMinutes).toBe(10);
    });

    it('parses colon format train number', () => {
      const result = parseTrainAlerts([ALERT_COLON_FORMAT]);

      expect(result.trainAlerts.has('1702')).toBe(true);
      expect(result.trainAlerts.get('1702')?.delayMinutes).toBe(20);
    });

    it('parses train number with letter suffix', () => {
      const result = parseTrainAlerts([ALERT_TRAIN_WITH_SUFFIX]);

      expect(result.trainAlerts.has('1820E')).toBe(true);
      expect(result.trainAlerts.get('1820E')?.delayMinutes).toBe(25);
    });

    it('parses modified service alert', () => {
      const result = parseTrainAlerts([ALERT_MODIFIED_SERVICE]);

      const alert = result.trainAlerts.get('1700');
      expect(alert?.severity).toBe('modified');
      expect(alert?.message).toBe('Modified service');
    });

    it('categorizes alert without train number as general', () => {
      const result = parseTrainAlerts([ALERT_GENERAL]);

      expect(result.trainAlerts.size).toBe(0);
      expect(result.generalAlerts).toHaveLength(1);
      expect(result.generalAlerts[0].id).toBe('alert-general-advisory');
    });

    it('handles empty description alert', () => {
      const result = parseTrainAlerts([ALERT_EMPTY_DESCRIPTION]);

      // Should be general since no train number in header only
      expect(result.generalAlerts).toHaveLength(1);
    });

    it('parses train number from header when description empty', () => {
      const result = parseTrainAlerts([ALERT_HEADER_ONLY]);

      expect(result.trainAlerts.has('1700')).toBe(true);
      expect(result.trainAlerts.get('1700')?.severity).toBe('cancelled');
    });

    it('parses hash prefix format', () => {
      const result = parseTrainAlerts([ALERT_HASH_PREFIX]);

      expect(result.trainAlerts.has('1704')).toBe(true);
      expect(result.trainAlerts.get('1704')?.delayMinutes).toBe(5);
    });

    it('keeps most severe alert when train mentioned in multiple alerts', () => {
      const delayedAlert: typeof ALERT_TRAIN_DELAYED = {
        ...ALERT_TRAIN_DELAYED,
        id: 'delayed-1700',
      };
      const cancelledAlert = {
        id: 'cancelled-1700',
        alert: {
          header_text: { translation: [{ text: 'Cancellation' }] },
          description_text: { translation: [{ text: 'Train 1700 has been cancelled' }] },
          informed_entity: [{ route_id: 'SNDR_EV' }],
        },
      };

      const result = parseTrainAlerts([delayedAlert, cancelledAlert]);

      // Should keep cancelled (more severe)
      expect(result.trainAlerts.get('1700')?.severity).toBe('cancelled');
    });

    it('handles mixed train-specific and general alerts', () => {
      const result = parseTrainAlerts([
        ALERT_TRAIN_DELAYED,
        ALERT_GENERAL,
        ALERT_TRAIN_CANCELLED,
      ]);

      expect(result.trainAlerts.size).toBe(2);
      // All alerts go to generalAlerts for SERVICE ALERTS card (full context)
      expect(result.generalAlerts).toHaveLength(3);
    });

    it('returns empty results for empty input', () => {
      const result = parseTrainAlerts([]);

      expect(result.trainAlerts.size).toBe(0);
      expect(result.generalAlerts).toHaveLength(0);
    });
  });
});
