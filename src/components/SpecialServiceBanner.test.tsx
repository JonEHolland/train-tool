import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SpecialServiceBanner } from './SpecialServiceBanner';
import {
  ExceptionServiceProvider,
  computeExceptionServiceState,
} from '../context/ExceptionServiceContext';
import type { DirectionTrains, AlertEntity } from '../types';

const emptyTrains: DirectionTrains[] = [];
const emptyAlerts: AlertEntity[] = [];

function renderBanner(trains: DirectionTrains[], alerts: AlertEntity[]) {
  return render(
    <ExceptionServiceProvider trainsByDirection={trains} alerts={alerts}>
      <SpecialServiceBanner />
    </ExceptionServiceProvider>
  );
}

function createTrainsWithException(type: 'gameday' | 'fair' | 'reduced' | 'special'): DirectionTrains[] {
  return [{
    directionName: 'Seattle',
    trains: [{ destination: 'Seattle', time: '10:00 AM', minutesAway: 30, isExceptionService: true, exceptionServiceType: type }],
  }];
}

describe('SpecialServiceBanner', () => {
  it('renders nothing when no exception service', () => {
    const { container } = renderBanner(emptyTrains, emptyAlerts);
    expect(container.querySelector('.special-service-banner')).toBeNull();
  });

  it.each([
    ['gameday', '🏈⚾', 'Gameday Service'],
    ['fair', '🎡', 'State Fair Service'],
    ['reduced', '📅', 'Reduced Service'],
    ['special', '⭐', 'Special Service'],
  ] as const)('renders %s theme with correct icon and text', (type, icon, text) => {
    renderBanner(createTrainsWithException(type), emptyAlerts);
    expect(screen.getByText(icon)).toBeInTheDocument();
    expect(screen.getByText(text)).toBeInTheDocument();
  });

  it('shows Seahawks/Mariners theme when alert mentions the team', () => {
    const trains = createTrainsWithException('gameday');
    renderBanner(trains, [{ id: '1', alert: { header_text: { translation: [{ text: 'Seahawks game' }] }, description_text: { translation: [{ text: '' }] } } }]);
    expect(screen.getByText('🏈')).toBeInTheDocument();
    expect(screen.getByText('Seahawks Gameday Service')).toBeInTheDocument();
  });
});

describe('computeExceptionServiceState', () => {
  it('returns null theme when no exception service', () => {
    const result = computeExceptionServiceState(emptyTrains, emptyAlerts);
    expect(result.theme).toBeNull();
  });

  it('filters team alerts when team banner shown', () => {
    const trains = createTrainsWithException('gameday');
    const alerts: AlertEntity[] = [
      { id: '1', alert: { header_text: { translation: [{ text: 'Seahawks game' }] } } },
      { id: '2', alert: { header_text: { translation: [{ text: 'Other alert' }] } } },
    ];
    const result = computeExceptionServiceState(trains, alerts);
    expect(result.theme).toBe('seahawks');
    expect(result.filteredAlerts).toHaveLength(1);
    expect(result.filteredAlerts[0].id).toBe('2');
  });

  it('does not filter alerts for non-team banners', () => {
    const result = computeExceptionServiceState(
      createTrainsWithException('fair'),
      [{ id: '1', alert: { header_text: { translation: [{ text: 'Some alert' }] } } }]
    );
    expect(result.theme).toBe('fair');
    expect(result.filteredAlerts).toHaveLength(1);
  });
});
