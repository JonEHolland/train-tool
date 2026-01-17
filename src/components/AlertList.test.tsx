import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertList } from './AlertList';
import { ExceptionServiceProvider } from '../context/ExceptionServiceContext';
import type { AlertEntity, DirectionTrains } from '../types';

// Helper to create mock alert entities
function createMockAlert(
  header: string,
  description: string,
  id: string = 'alert-1'
): AlertEntity {
  return {
    id,
    alert: {
      header_text: {
        translation: [{ text: header, language: 'en' }],
      },
      description_text: {
        translation: [{ text: description, language: 'en' }],
      },
      informed_entity: [],
    },
  };
}

// Empty trains array for context (no exception service)
const emptyTrains: DirectionTrains[] = [];

// Helper to render AlertList with required context
function renderAlertList(alerts: AlertEntity[], loading = false, error: string | null = null) {
  return render(
    <ExceptionServiceProvider trainsByDirection={emptyTrains} alerts={alerts}>
      <AlertList loading={loading} error={error} />
    </ExceptionServiceProvider>
  );
}

describe('AlertList', () => {
  describe('loading state', () => {
    it('displays loading message when loading', () => {
      renderAlertList([], true, null);
      expect(screen.getByText('Loading alerts...')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('displays error message when there is an error', () => {
      renderAlertList([], false, 'Failed to fetch alerts');
      expect(screen.getByText('Failed to fetch alerts')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('renders nothing when there are no alerts', () => {
      const { container } = renderAlertList([], false, null);
      // Component returns null when no alerts - no card should be present
      expect(container.querySelector('.card')).toBeNull();
    });
  });

  describe('alert content', () => {
    const singleAlert = [createMockAlert('Train Delay', 'The 5:30 train is delayed by 10 minutes.')];

    it('displays alert header', () => {
      renderAlertList(singleAlert, false, null);
      expect(screen.getByText('Train Delay')).toBeInTheDocument();
    });

    it('displays alert description', () => {
      renderAlertList(singleAlert, false, null);
      expect(screen.getByText('The 5:30 train is delayed by 10 minutes.')).toBeInTheDocument();
    });

    it('displays SERVICE ALERTS label', () => {
      renderAlertList(singleAlert, false, null);
      expect(screen.getByText('SERVICE ALERTS')).toBeInTheDocument();
    });

    it('displays all alerts in carousel', () => {
      const multipleAlerts = [
        createMockAlert('First Alert', 'Description of first alert', 'alert-1'),
        createMockAlert('Second Alert', 'Description of second alert', 'alert-2'),
        createMockAlert('Third Alert', 'Description of third alert', 'alert-3'),
      ];
      renderAlertList(multipleAlerts, false, null);

      // With sliding carousel, all alerts are rendered in DOM
      expect(screen.getByText('First Alert')).toBeInTheDocument();
      expect(screen.getByText('Second Alert')).toBeInTheDocument();
      expect(screen.getByText('Third Alert')).toBeInTheDocument();
    });

    it('passes custom hint text to carousel', () => {
      const multipleAlerts = [
        createMockAlert('First', 'Desc 1', 'a1'),
        createMockAlert('Second', 'Desc 2', 'a2'),
      ];
      renderAlertList(multipleAlerts, false, null);
      expect(screen.getByText('Swipe for more alerts (1/2)')).toBeInTheDocument();
    });
  });

  describe('text truncation', () => {
    it('truncates descriptions longer than 200 characters', () => {
      const longDescription = 'A'.repeat(250);
      const alert = [createMockAlert('Long Alert', longDescription)];

      renderAlertList(alert, false, null);

      // Should show first 200 characters followed by "..."
      const expectedText = 'A'.repeat(200) + '...';
      expect(screen.getByText(expectedText)).toBeInTheDocument();
    });

    it('does not truncate descriptions shorter than 200 characters', () => {
      const shortDescription = 'A'.repeat(100);
      const alert = [createMockAlert('Short Alert', shortDescription)];

      renderAlertList(alert, false, null);

      expect(screen.getByText(shortDescription)).toBeInTheDocument();
    });

    it('does not truncate descriptions exactly 200 characters', () => {
      const exactDescription = 'B'.repeat(200);
      const alert = [createMockAlert('Exact Alert', exactDescription)];

      renderAlertList(alert, false, null);

      expect(screen.getByText(exactDescription)).toBeInTheDocument();
    });
  });

  describe('fallback values', () => {
    it('uses "Alert" as fallback when header is missing', () => {
      const alertWithoutHeader: AlertEntity = {
        id: 'no-header',
        alert: {
          header_text: undefined,
          description_text: {
            translation: [{ text: 'Some description', language: 'en' }],
          },
          informed_entity: [],
        },
      };

      renderAlertList([alertWithoutHeader], false, null);
      expect(screen.getByText('Alert')).toBeInTheDocument();
    });

    it('handles empty description gracefully', () => {
      const alertWithoutDesc: AlertEntity = {
        id: 'no-desc',
        alert: {
          header_text: {
            translation: [{ text: 'Header Only', language: 'en' }],
          },
          description_text: undefined,
          informed_entity: [],
        },
      };

      renderAlertList([alertWithoutDesc], false, null);
      expect(screen.getByText('Header Only')).toBeInTheDocument();
    });
  });

  describe('alert filtering via context', () => {
    it('filters out team alerts when exception service banner is shown', () => {
      // Create trains with gameday exception
      const gamedayTrains: DirectionTrains[] = [{
        directionName: 'Seattle',
        trains: [{
          destination: 'Seattle',
          time: '10:00 AM',
          minutesAway: 30,
          isExceptionService: true,
          exceptionServiceType: 'gameday',
        }],
      }];

      // Alerts include Seahawks alert (should be filtered) and another alert (should remain)
      const alerts = [
        createMockAlert('Seahawks Game', 'Special service for Seahawks', 'seahawks-alert'),
        createMockAlert('Track Work', 'Maintenance on tracks', 'track-alert'),
      ];

      render(
        <ExceptionServiceProvider trainsByDirection={gamedayTrains} alerts={alerts}>
          <AlertList loading={false} error={null} />
        </ExceptionServiceProvider>
      );

      // Seahawks alert should be filtered out (consumed by banner)
      expect(screen.queryByText('Seahawks Game')).not.toBeInTheDocument();
      // Other alert should remain
      expect(screen.getByText('Track Work')).toBeInTheDocument();
    });
  });
});
