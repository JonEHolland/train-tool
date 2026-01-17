import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { detectTeamFromAlerts, alertMentionsTeam } from '../utils/parseTrainAlerts';
import type { SportsTeam } from '../utils/parseTrainAlerts';
import type { ExceptionServiceType, DirectionTrains, AlertEntity } from '../types';

/**
 * Theme for exception service display.
 * - Sports teams: 'seahawks' | 'mariners' (for team-specific gameday)
 * - Exception types: 'gameday' | 'fair' | 'reduced' | 'special'
 */
export type ExceptionServiceTheme = SportsTeam | ExceptionServiceType;

interface ExceptionServiceState {
  /** The active exception theme, or null if no exception service today */
  theme: ExceptionServiceTheme | null;
  /** Alerts with exception-related alerts filtered out (to avoid redundancy with banner) */
  filteredAlerts: AlertEntity[];
}

const ExceptionServiceContext = createContext<ExceptionServiceState | null>(null);

interface ExceptionServiceProviderProps {
  trainsByDirection: DirectionTrains[];
  alerts: AlertEntity[];
  children: ReactNode;
}

/**
 * Computes exception service state from train and alert data.
 * Pure function - can be used for testing without React.
 */
export function computeExceptionServiceState(
  trainsByDirection: DirectionTrains[],
  alerts: AlertEntity[]
): ExceptionServiceState {
  // Find the first exception type from today's trains
  let activeExceptionType: ExceptionServiceType | null = null;
  for (const direction of trainsByDirection) {
    for (const train of direction.trains) {
      if (!train.nextDayLabel && train.isExceptionService && train.exceptionServiceType) {
        activeExceptionType = train.exceptionServiceType;
        break;
      }
    }
    if (activeExceptionType) break;
  }

  // Determine theme based on exception type
  let theme: ExceptionServiceTheme | null = null;
  if (activeExceptionType) {
    if (activeExceptionType === 'gameday') {
      const team = detectTeamFromAlerts(alerts);
      theme = team || 'gameday';
    } else {
      theme = activeExceptionType;
    }
  }

  // Filter alerts: only hide team alerts when showing team-specific gameday banner
  const filteredAlerts =
    theme === 'seahawks' || theme === 'mariners'
      ? alerts.filter(alert => !alertMentionsTeam(alert, theme as SportsTeam))
      : alerts;

  return { theme, filteredAlerts };
}

/**
 * Provider that computes and publishes exception service state.
 * Wrap components that need access to exception service info.
 */
export function ExceptionServiceProvider({
  trainsByDirection,
  alerts,
  children,
}: ExceptionServiceProviderProps) {
  const value = useMemo(
    () => computeExceptionServiceState(trainsByDirection, alerts),
    [trainsByDirection, alerts]
  );

  return (
    <ExceptionServiceContext.Provider value={value}>
      {children}
    </ExceptionServiceContext.Provider>
  );
}

/**
 * Hook to subscribe to exception service state.
 * Must be used within an ExceptionServiceProvider.
 */
export function useExceptionService(): ExceptionServiceState {
  const context = useContext(ExceptionServiceContext);
  if (!context) {
    throw new Error('useExceptionService must be used within an ExceptionServiceProvider');
  }
  return context;
}
