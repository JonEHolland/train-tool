import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AlertList } from './AlertList';
import { ExceptionServiceProvider } from '../context/ExceptionServiceContext';
import type { AlertEntity, DirectionTrains } from '../types';

function createMockAlert(header: string, description: string, id = 'alert-1'): AlertEntity {
  return {
    id,
    alert: {
      header_text: { translation: [{ text: header, language: 'en' }] },
      description_text: { translation: [{ text: description, language: 'en' }] },
      informed_entity: [],
    },
  };
}

const emptyTrains: DirectionTrains[] = [];

function renderAlertList(alerts: AlertEntity[], loading = false, error: string | null = null) {
  return render(
    <ExceptionServiceProvider trainsByDirection={emptyTrains} alerts={alerts}>
      <AlertList loading={loading} error={error} />
    </ExceptionServiceProvider>
  );
}

describe('AlertList', () => {
  it('shows loading and error states', () => {
    const { rerender, unmount } = renderAlertList([], true);
    expect(screen.getByText('Loading alerts...')).toBeInTheDocument();
    unmount();

    render(
      <ExceptionServiceProvider trainsByDirection={emptyTrains} alerts={[]}>
        <AlertList loading={false} error="Failed to fetch alerts" />
      </ExceptionServiceProvider>
    );
    expect(screen.getByText('Failed to fetch alerts')).toBeInTheDocument();
  });

  it('renders nothing when no alerts', () => {
    const { container } = renderAlertList([]);
    expect(container.querySelector('.card')).toBeNull();
  });

  it('displays alert content with header, description, and label', () => {
    renderAlertList([createMockAlert('Train Delay', 'The 5:30 train is delayed by 10 minutes.')]);
    expect(screen.getByText('SERVICE ALERTS')).toBeInTheDocument();
    expect(screen.getByText('Train Delay')).toBeInTheDocument();
    expect(screen.getByText('The 5:30 train is delayed by 10 minutes.')).toBeInTheDocument();
  });

  it('truncates descriptions longer than 200 characters', () => {
    renderAlertList([createMockAlert('Long Alert', 'A'.repeat(250))]);
    expect(screen.getByText('A'.repeat(200) + '...')).toBeInTheDocument();
  });

  it('filters out team alerts when exception service banner is shown', () => {
    const gamedayTrains: DirectionTrains[] = [{
      directionName: 'Seattle',
      trains: [{ destination: 'Seattle', time: '10:00 AM', minutesAway: 30, isExceptionService: true, exceptionServiceType: 'gameday' }],
    }];
    const alerts = [
      createMockAlert('Seahawks Game', 'Special service for Seahawks', 'seahawks-alert'),
      createMockAlert('Track Work', 'Maintenance on tracks', 'track-alert'),
    ];

    render(
      <ExceptionServiceProvider trainsByDirection={gamedayTrains} alerts={alerts}>
        <AlertList loading={false} error={null} />
      </ExceptionServiceProvider>
    );

    expect(screen.queryByText('Seahawks Game')).not.toBeInTheDocument();
    expect(screen.getByText('Track Work')).toBeInTheDocument();
  });
});
