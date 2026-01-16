import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SpecialServiceBanner } from './SpecialServiceBanner';
import {
  ExceptionServiceProvider,
  computeExceptionServiceState,
} from '../context/ExceptionServiceContext';
import type { DirectionTrains, AlertEntity } from '../types';

describe('SpecialServiceBanner', () => {
  const emptyTrains: DirectionTrains[] = [];
  const emptyAlerts: AlertEntity[] = [];

  // Helper to render banner with context
  function renderBanner(trains: DirectionTrains[], alerts: AlertEntity[]) {
    return render(
      <ExceptionServiceProvider trainsByDirection={trains} alerts={alerts}>
        <SpecialServiceBanner />
      </ExceptionServiceProvider>
    );
  }

  // Helper to create train data with exception service
  function createTrainsWithException(type: 'gameday' | 'fair' | 'reduced' | 'special'): DirectionTrains[] {
    return [{
      directionName: 'Seattle',
      trains: [{
        destination: 'Seattle',
        time: '10:00 AM',
        minutesAway: 30,
        isTomorrow: false,
        isExceptionService: true,
        exceptionServiceType: type,
      }],
    }];
  }

  describe('visibility', () => {
    it('renders nothing when no exception service', () => {
      const { container } = renderBanner(emptyTrains, emptyAlerts);
      // Provider wrapper exists, but banner returns null
      expect(container.querySelector('.special-service-banner')).toBeNull();
    });

    it('renders banner when exception service exists', () => {
      const trains = createTrainsWithException('gameday');
      renderBanner(trains, emptyAlerts);
      expect(screen.getByText('Gameday Service')).toBeInTheDocument();
    });

    it('renders nothing when exception train is tomorrow', () => {
      const trains: DirectionTrains[] = [{
        directionName: 'Seattle',
        trains: [{
          destination: 'Seattle',
          time: '10:00 AM',
          minutesAway: 30,
          isTomorrow: true, // Tomorrow - should not show banner
          isExceptionService: true,
          exceptionServiceType: 'gameday',
        }],
      }];
      const { container } = renderBanner(trains, emptyAlerts);
      expect(container.querySelector('.special-service-banner')).toBeNull();
    });
  });

  describe('themes', () => {
    const themes: Array<{ type: 'gameday' | 'fair' | 'reduced' | 'special'; icon: string; text: string }> = [
      { type: 'gameday', icon: '🏈⚾', text: 'Gameday Service' },
      { type: 'fair', icon: '🎡', text: 'State Fair Service' },
      { type: 'reduced', icon: '📅', text: 'Reduced Service' },
      { type: 'special', icon: '⭐', text: 'Special Service' },
    ];

    themes.forEach(({ type, icon, text }) => {
      it(`renders correct icon and text for ${type} exception`, () => {
        const trains = createTrainsWithException(type);
        renderBanner(trains, emptyAlerts);
        expect(screen.getByText(icon)).toBeInTheDocument();
        expect(screen.getByText(text)).toBeInTheDocument();
      });

      it(`applies correct CSS class for ${type} exception`, () => {
        const trains = createTrainsWithException(type);
        const { container } = renderBanner(trains, emptyAlerts);
        const banner = container.querySelector('.special-service-banner');
        expect(banner).toHaveClass(`special-service-banner--${type}`);
      });
    });
  });

  describe('team detection from alerts', () => {
    it('shows Seahawks theme when alert mentions Seahawks', () => {
      const trains = createTrainsWithException('gameday');
      const alerts: AlertEntity[] = [{
        id: '1',
        alert: {
          header_text: { translation: [{ text: 'Seahawks game service' }] },
          description_text: { translation: [{ text: 'Special trains for Seahawks' }] },
        },
      }];
      renderBanner(trains, alerts);
      expect(screen.getByText('🏈')).toBeInTheDocument();
      expect(screen.getByText('Seahawks Gameday Service')).toBeInTheDocument();
    });

    it('shows Mariners theme when alert mentions Mariners', () => {
      const trains = createTrainsWithException('gameday');
      const alerts: AlertEntity[] = [{
        id: '1',
        alert: {
          header_text: { translation: [{ text: 'Mariners game service' }] },
          description_text: { translation: [{ text: 'Special trains for Mariners' }] },
        },
      }];
      renderBanner(trains, alerts);
      expect(screen.getByText('⚾')).toBeInTheDocument();
      expect(screen.getByText('Mariners Gameday Service')).toBeInTheDocument();
    });
  });
});

describe('computeExceptionServiceState', () => {
  const emptyTrains: DirectionTrains[] = [];
  const emptyAlerts: AlertEntity[] = [];

  function createTrainsWithException(type: 'gameday' | 'fair' | 'reduced' | 'special'): DirectionTrains[] {
    return [{
      directionName: 'Seattle',
      trains: [{
        destination: 'Seattle',
        time: '10:00 AM',
        minutesAway: 30,
        isTomorrow: false,
        isExceptionService: true,
        exceptionServiceType: type,
      }],
    }];
  }

  it('returns null theme when no exception service', () => {
    const result = computeExceptionServiceState(emptyTrains, emptyAlerts);
    expect(result.theme).toBeNull();
    expect(result.filteredAlerts).toEqual(emptyAlerts);
  });

  it('returns correct theme for each exception type', () => {
    expect(computeExceptionServiceState(createTrainsWithException('fair'), []).theme).toBe('fair');
    expect(computeExceptionServiceState(createTrainsWithException('reduced'), []).theme).toBe('reduced');
    expect(computeExceptionServiceState(createTrainsWithException('special'), []).theme).toBe('special');
  });

  it('filters team alerts when Seahawks banner shown', () => {
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
    const trains = createTrainsWithException('fair');
    const alerts: AlertEntity[] = [
      { id: '1', alert: { header_text: { translation: [{ text: 'Some alert' }] } } },
    ];
    const result = computeExceptionServiceState(trains, alerts);
    expect(result.theme).toBe('fair');
    expect(result.filteredAlerts).toHaveLength(1);
  });
});
