import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertList } from './AlertList';
import type { AlertEntity } from '../types';

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

describe('AlertList', () => {
  describe('loading state', () => {
    it('displays loading message when loading', () => {
      render(<AlertList alerts={[]} loading={true} error={null} />);
      expect(screen.getByText('Loading alerts...')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('displays error message when there is an error', () => {
      render(
        <AlertList alerts={[]} loading={false} error="Failed to fetch alerts" />
      );
      expect(screen.getByText('Failed to fetch alerts')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('displays empty state when there are no alerts', () => {
      render(<AlertList alerts={[]} loading={false} error={null} />);
      expect(screen.getByText('No active alerts')).toBeInTheDocument();
      expect(screen.getByText('All systems operating normally')).toBeInTheDocument();
    });
  });

  describe('alert content', () => {
    const singleAlert = [createMockAlert('Train Delay', 'The 5:30 train is delayed by 10 minutes.')];

    it('displays alert header', () => {
      render(<AlertList alerts={singleAlert} loading={false} error={null} />);
      expect(screen.getByText('Train Delay')).toBeInTheDocument();
    });

    it('displays alert description', () => {
      render(<AlertList alerts={singleAlert} loading={false} error={null} />);
      expect(screen.getByText('The 5:30 train is delayed by 10 minutes.')).toBeInTheDocument();
    });

    it('displays SERVICE ALERTS label', () => {
      render(<AlertList alerts={singleAlert} loading={false} error={null} />);
      expect(screen.getByText('SERVICE ALERTS')).toBeInTheDocument();
    });

    it('displays all alerts in carousel', () => {
      const multipleAlerts = [
        createMockAlert('First Alert', 'Description of first alert', 'alert-1'),
        createMockAlert('Second Alert', 'Description of second alert', 'alert-2'),
        createMockAlert('Third Alert', 'Description of third alert', 'alert-3'),
      ];
      render(<AlertList alerts={multipleAlerts} loading={false} error={null} />);

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
      render(<AlertList alerts={multipleAlerts} loading={false} error={null} />);
      expect(screen.getByText('Swipe for more alerts (1/2)')).toBeInTheDocument();
    });
  });

  describe('text truncation', () => {
    it('truncates descriptions longer than 200 characters', () => {
      const longDescription = 'A'.repeat(250);
      const alert = [createMockAlert('Long Alert', longDescription)];

      render(<AlertList alerts={alert} loading={false} error={null} />);

      // Should show first 200 characters followed by "..."
      const expectedText = 'A'.repeat(200) + '...';
      expect(screen.getByText(expectedText)).toBeInTheDocument();
    });

    it('does not truncate descriptions shorter than 200 characters', () => {
      const shortDescription = 'A'.repeat(100);
      const alert = [createMockAlert('Short Alert', shortDescription)];

      render(<AlertList alerts={alert} loading={false} error={null} />);

      expect(screen.getByText(shortDescription)).toBeInTheDocument();
    });

    it('does not truncate descriptions exactly 200 characters', () => {
      const exactDescription = 'B'.repeat(200);
      const alert = [createMockAlert('Exact Alert', exactDescription)];

      render(<AlertList alerts={alert} loading={false} error={null} />);

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

      render(<AlertList alerts={[alertWithoutHeader]} loading={false} error={null} />);
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

      render(<AlertList alerts={[alertWithoutDesc]} loading={false} error={null} />);
      expect(screen.getByText('Header Only')).toBeInTheDocument();
    });
  });
});
