import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  describe('single alert', () => {
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

    it('does not show navigation dots for single alert', () => {
      render(<AlertList alerts={singleAlert} loading={false} error={null} />);
      expect(screen.queryByRole('button', { name: /go to item/i })).not.toBeInTheDocument();
    });

    it('does not show navigation arrows for single alert', () => {
      render(<AlertList alerts={singleAlert} loading={false} error={null} />);
      expect(screen.queryByLabelText('Previous')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Next')).not.toBeInTheDocument();
    });

    it('does not show swipe hint for single alert', () => {
      render(<AlertList alerts={singleAlert} loading={false} error={null} />);
      expect(screen.queryByText(/Swipe for more alerts/)).not.toBeInTheDocument();
    });
  });

  describe('multiple alerts', () => {
    const multipleAlerts = [
      createMockAlert('First Alert', 'Description of first alert', 'alert-1'),
      createMockAlert('Second Alert', 'Description of second alert', 'alert-2'),
      createMockAlert('Third Alert', 'Description of third alert', 'alert-3'),
    ];

    it('displays first alert by default', () => {
      render(<AlertList alerts={multipleAlerts} loading={false} error={null} />);
      expect(screen.getByText('First Alert')).toBeInTheDocument();
      expect(screen.getByText('Description of first alert')).toBeInTheDocument();
    });

    it('shows navigation dots for multiple alerts', () => {
      render(<AlertList alerts={multipleAlerts} loading={false} error={null} />);
      const dots = screen.getAllByRole('button', { name: /go to item/i });
      expect(dots).toHaveLength(3);
    });

    it('shows swipe hint with current position', () => {
      render(<AlertList alerts={multipleAlerts} loading={false} error={null} />);
      expect(screen.getByText('Swipe for more alerts (1/3)')).toBeInTheDocument();
    });

    it('shows only next arrow on first alert', () => {
      render(<AlertList alerts={multipleAlerts} loading={false} error={null} />);
      expect(screen.queryByLabelText('Previous')).not.toBeInTheDocument();
      expect(screen.getByLabelText('Next')).toBeInTheDocument();
    });

    it('navigates to next alert when next arrow is clicked', () => {
      render(<AlertList alerts={multipleAlerts} loading={false} error={null} />);

      fireEvent.click(screen.getByLabelText('Next'));

      // With sliding carousel, all alerts are in DOM - check hint text changed
      expect(screen.getByText('Swipe for more alerts (2/3)')).toBeInTheDocument();
    });

    it('shows both arrows on middle alert', () => {
      render(<AlertList alerts={multipleAlerts} loading={false} error={null} />);

      fireEvent.click(screen.getByLabelText('Next'));

      expect(screen.getByLabelText('Previous')).toBeInTheDocument();
      expect(screen.getByLabelText('Next')).toBeInTheDocument();
    });

    it('navigates to previous alert when previous arrow is clicked', () => {
      render(<AlertList alerts={multipleAlerts} loading={false} error={null} />);

      fireEvent.click(screen.getByLabelText('Next'));
      fireEvent.click(screen.getByLabelText('Previous'));

      expect(screen.getByText('Swipe for more alerts (1/3)')).toBeInTheDocument();
    });

    it('shows only previous arrow on last alert', () => {
      render(<AlertList alerts={multipleAlerts} loading={false} error={null} />);

      // Navigate to last alert
      fireEvent.click(screen.getByLabelText('Next'));
      fireEvent.click(screen.getByLabelText('Next'));

      expect(screen.getByLabelText('Previous')).toBeInTheDocument();
      expect(screen.queryByLabelText('Next')).not.toBeInTheDocument();
    });

    it('navigates to specific alert when dot is clicked', () => {
      render(<AlertList alerts={multipleAlerts} loading={false} error={null} />);

      const dots = screen.getAllByRole('button', { name: /go to item/i });
      fireEvent.click(dots[2]); // Click third dot

      expect(screen.getByText('Swipe for more alerts (3/3)')).toBeInTheDocument();
    });

    it('marks active dot correctly', () => {
      const { container } = render(
        <AlertList alerts={multipleAlerts} loading={false} error={null} />
      );

      // Check for module CSS class pattern for active dot
      const dots = container.querySelectorAll('button[aria-label^="Go to item"]');
      expect(dots[0].className).toContain('Active');
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

  describe('swipe navigation', () => {
    const alerts = [
      createMockAlert('First', 'First desc', 'a1'),
      createMockAlert('Second', 'Second desc', 'a2'),
    ];

    it('navigates to next alert on swipe left', () => {
      render(<AlertList alerts={alerts} loading={false} error={null} />);

      const content = screen.getByTestId('carousel-content');
      expect(content).toBeInTheDocument();

      // Simulate swipe left (start > end by more than threshold)
      fireEvent.touchStart(content, { touches: [{ clientX: 200 }] });
      fireEvent.touchMove(content, { touches: [{ clientX: 100 }] });
      fireEvent.touchEnd(content);

      // Check hint text changed to indicate navigation
      expect(screen.getByText('Swipe for more alerts (2/2)')).toBeInTheDocument();
    });

    it('navigates to previous alert on swipe right', () => {
      render(<AlertList alerts={alerts} loading={false} error={null} />);

      const content = screen.getByTestId('carousel-content');

      // First go to second alert
      fireEvent.click(screen.getByLabelText('Next'));
      expect(screen.getByText('Swipe for more alerts (2/2)')).toBeInTheDocument();

      // Swipe right (end > start by more than threshold)
      fireEvent.touchStart(content, { touches: [{ clientX: 100 }] });
      fireEvent.touchMove(content, { touches: [{ clientX: 200 }] });
      fireEvent.touchEnd(content);

      expect(screen.getByText('Swipe for more alerts (1/2)')).toBeInTheDocument();
    });

    it('does not navigate on small swipe', () => {
      render(<AlertList alerts={alerts} loading={false} error={null} />);

      const content = screen.getByTestId('carousel-content');

      // Small swipe (less than 50px threshold)
      fireEvent.touchStart(content, { touches: [{ clientX: 200 }] });
      fireEvent.touchMove(content, { touches: [{ clientX: 180 }] });
      fireEvent.touchEnd(content);

      // Should still be on first alert
      expect(screen.getByText('Swipe for more alerts (1/2)')).toBeInTheDocument();
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
