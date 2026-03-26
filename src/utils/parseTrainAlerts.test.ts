import { describe, it, expect } from 'vitest';
import {
  extractTrainNumbers,
  classifySeverity,
  extractDelayMinutes,
  formatAlertMessage,
  parseTrainAlerts,
  detectTeamFromAlerts,
  alertMentionsTeam,
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
    it.each([
      ['Train 1700 is delayed', ['1700']],
      ['Train #1511 has been cancelled', ['1511']],
      ['train 1700 is running late', ['1700']],
      ['Sounder train #1511 cancelled', ['1511']],
      ['1702: Running late', ['1702']],
      ['Due to congestion, #1704 is delayed', ['1704']],
      ['Train 1820E is delayed', ['1820E']],
    ])('extracts from "%s"', (input, expected) => {
      expect(extractTrainNumbers(input)).toEqual(expected);
    });

    it('extracts multiple train numbers and deduplicates', () => {
      expect(extractTrainNumbers('Trains 1700, 1702, and 1704 are delayed')).toEqual(
        expect.arrayContaining(['1700', '1702', '1704'])
      );
      expect(extractTrainNumbers('Train 1700 and Train #1700 are the same')).toEqual(['1700']);
    });

    it('returns empty array when no train numbers found', () => {
      expect(extractTrainNumbers('All trains may experience delays')).toEqual([]);
      expect(extractTrainNumbers('')).toEqual([]);
      expect(extractTrainNumbers('In 2024, service will be improved')).toEqual([]);
    });
  });

  describe('classifySeverity', () => {
    it.each([
      ['Train has been cancelled', 'cancelled'],
      ['Service has been suspended', 'cancelled'],
      ['Train is not operating today', 'cancelled'],
      ['Train is delayed by 15 minutes', 'delayed'],
      ['Running 10 minutes late', 'delayed'],
      ['Train running behind schedule', 'delayed'],
      ['Train will skip this station', 'modified'],
      ['Running as express service', 'modified'],
      ['Service advisory for today', 'info'],
      ['Regular service update', 'info'],
    ])('classifies "%s" as %s', (input, expected) => {
      expect(classifySeverity(input)).toBe(expected);
    });

    it('prioritizes by severity and is case insensitive', () => {
      expect(classifySeverity('Train cancelled due to delays')).toBe('cancelled');
      expect(classifySeverity('Train delayed, will skip some stops')).toBe('delayed');
      expect(classifySeverity('TRAIN HAS BEEN CANCELLED')).toBe('cancelled');
    });
  });

  describe('extractDelayMinutes', () => {
    it.each([
      ['Running 15 minutes late', 15],
      ['Train is 10 min late', 10],
      ['Train delayed 20 minutes', 20],
      ['Train delayed by 25 min', 25],
      ['Arriving approximately 30 min late', 30],
      ['Experiencing a 5 minute delay', 5],
    ])('extracts %d from "%s"', (input, expected) => {
      expect(extractDelayMinutes(input)).toBe(expected);
    });

    it.each([
      ['Train has been cancelled'],
      [''],
      ['Delayed 500 minutes'],
      ['0 minutes late'],
    ])('returns undefined for "%s"', (input) => {
      expect(extractDelayMinutes(input)).toBeUndefined();
    });
  });

  describe('formatAlertMessage', () => {
    it.each([
      ['cancelled', undefined, 'Cancelled'],
      ['delayed', 15, 'Running 15m late'],
      ['delayed', undefined, 'Delayed'],
      ['modified', undefined, 'Modified service'],
      ['info', undefined, 'Service alert'],
    ] as const)('formats %s (delay=%s) as "%s"', (severity, delay, expected) => {
      expect(formatAlertMessage(severity, delay)).toBe(expected);
    });
  });

  describe('parseTrainAlerts (integration)', () => {
    it('parses single delayed train alert', () => {
      const result = parseTrainAlerts([ALERT_TRAIN_DELAYED]);

      expect(result.trainAlerts.size).toBe(1);
      expect(result.generalAlerts).toHaveLength(1);

      const alert = result.trainAlerts.get('1700');
      expect(alert?.severity).toBe('delayed');
      expect(alert?.delayMinutes).toBe(15);
      expect(alert?.message).toBe('Running 15m late');
    });

    it('parses cancelled train alert', () => {
      const result = parseTrainAlerts([ALERT_TRAIN_CANCELLED]);
      const alert = result.trainAlerts.get('1511');
      expect(alert?.severity).toBe('cancelled');
      expect(alert?.message).toBe('Cancelled');
    });

    it('parses multiple trains from single alert', () => {
      const result = parseTrainAlerts([ALERT_MULTIPLE_TRAINS]);
      expect(result.trainAlerts.size).toBe(3);
      expect(result.trainAlerts.get('1700')?.delayMinutes).toBe(10);
      expect(result.trainAlerts.get('1702')?.delayMinutes).toBe(10);
    });

    it('parses colon format and suffix format', () => {
      expect(parseTrainAlerts([ALERT_COLON_FORMAT]).trainAlerts.get('1702')?.delayMinutes).toBe(20);
      expect(parseTrainAlerts([ALERT_TRAIN_WITH_SUFFIX]).trainAlerts.get('1820E')?.delayMinutes).toBe(25);
    });

    it('parses modified service and general alerts', () => {
      expect(parseTrainAlerts([ALERT_MODIFIED_SERVICE]).trainAlerts.get('1700')?.severity).toBe('modified');

      const general = parseTrainAlerts([ALERT_GENERAL]);
      expect(general.trainAlerts.size).toBe(0);
      expect(general.generalAlerts).toHaveLength(1);
    });

    it('handles empty description and header-only alerts', () => {
      expect(parseTrainAlerts([ALERT_EMPTY_DESCRIPTION]).generalAlerts).toHaveLength(1);
      expect(parseTrainAlerts([ALERT_HEADER_ONLY]).trainAlerts.get('1700')?.severity).toBe('cancelled');
      expect(parseTrainAlerts([ALERT_HASH_PREFIX]).trainAlerts.get('1704')?.delayMinutes).toBe(5);
    });

    it('keeps most severe alert when train mentioned in multiple alerts', () => {
      const result = parseTrainAlerts([
        ALERT_TRAIN_DELAYED,
        {
          id: 'cancelled-1700',
          alert: {
            header_text: { translation: [{ text: 'Cancellation' }] },
            description_text: { translation: [{ text: 'Train 1700 has been cancelled' }] },
            informed_entity: [{ route_id: 'SNDR_EV' }],
          },
        },
      ]);
      expect(result.trainAlerts.get('1700')?.severity).toBe('cancelled');
    });

    it('handles mixed and empty inputs', () => {
      const mixed = parseTrainAlerts([ALERT_TRAIN_DELAYED, ALERT_GENERAL, ALERT_TRAIN_CANCELLED]);
      expect(mixed.trainAlerts.size).toBe(2);
      expect(mixed.generalAlerts).toHaveLength(3);

      const empty = parseTrainAlerts([]);
      expect(empty.trainAlerts.size).toBe(0);
      expect(empty.generalAlerts).toHaveLength(0);
    });
  });

  describe('detectTeamFromAlerts', () => {
    const createAlert = (header: string, desc = '') => ({
      id: 'test-alert',
      alert: {
        header_text: { translation: [{ text: header }] },
        description_text: { translation: [{ text: desc }] },
      },
    });

    it.each([
      ['Extra service for Seahawks game', '', 'seahawks'],
      ['Special trains for Mariners game tonight', '', 'mariners'],
      ['Gameday Service', 'Running for Seahawks vs Cardinals', 'seahawks'],
      ['SEAHAWKS gameday trains running', '', 'seahawks'],
    ])('detects team from "%s" / "%s" -> %s', (header, desc, expected) => {
      expect(detectTeamFromAlerts([createAlert(header, desc)])).toBe(expected);
    });

    it('returns null when no team mentioned or empty', () => {
      expect(detectTeamFromAlerts([createAlert('Regular gameday service')])).toBe(null);
      expect(detectTeamFromAlerts([])).toBe(null);
    });
  });

  describe('alertMentionsTeam', () => {
    const createAlert = (text: string) => ({
      id: 'test-alert',
      alert: {
        header_text: { translation: [{ text }] },
        description_text: { translation: [{ text: '' }] },
      },
    });

    it('matches team names case-insensitively', () => {
      expect(alertMentionsTeam(createAlert('Seahawks gameday'), 'seahawks')).toBe(true);
      expect(alertMentionsTeam(createAlert('MARINERS GAME'), 'mariners')).toBe(true);
      expect(alertMentionsTeam(createAlert('Regular gameday'), 'seahawks')).toBe(false);
    });
  });
});
