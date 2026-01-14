import { useState, useEffect, useRef } from 'react';
import type { DirectionTrains, NextTrain } from '../types';
import { formatTime, formatCountdown, formatCountdownCompact } from '../utils/time';
import { URGENCY_THRESHOLDS, PROGRESS_MAX_MINUTES } from '../utils/constants';
import { Card, CardBody, Tabs, CircularProgress, EmptyState, colors } from './ui';

/**
 * App-specific helper: Calculate progress value for the circular ring.
 * Returns 1 (full) for 60+ minutes, decreasing to 0 for 0 minutes.
 */
function calculateProgress(minutesAway: number): number {
  return Math.min(minutesAway / PROGRESS_MAX_MINUTES, 1);
}

/**
 * App-specific helper: Get urgency color based on minutes away.
 * Uses design tokens for consistent colors across the app.
 */
function getUrgencyColor(minutesAway: number, isDeparting: boolean): string {
  if (isDeparting || minutesAway <= URGENCY_THRESHOLDS.DANGER) {
    return colors.status.danger;
  }
  if (minutesAway <= URGENCY_THRESHOLDS.WARNING) {
    return colors.status.warning;
  }
  if (minutesAway <= URGENCY_THRESHOLDS.COMFORTABLE) {
    return colors.status.comfortable;
  }
  return colors.accent.primary;
}

interface TrainListProps {
  trainsByDirection: DirectionTrains[];
  isWeekend: boolean;
  hasStop: boolean;
  currentRoute?: string;
}

/**
 * Get ring color with alert severity override.
 * Alert severity takes precedence over time-based urgency colors.
 */
function getTrainRingColor(train: NextTrain, isDeparting: boolean): string {
  // Alert severity overrides time-based urgency
  if (train.alert?.severity === 'cancelled') {
    return colors.status.danger;
  }
  if (train.alert?.severity === 'delayed') {
    return colors.status.warning;
  }
  if (train.alert?.severity === 'modified') {
    return colors.status.info;
  }
  // Fall back to existing urgency-based color
  return getUrgencyColor(train.minutesAway, isDeparting);
}

export function TrainList({ trainsByDirection, isWeekend, hasStop, currentRoute }: TrainListProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevMinutesRef = useRef<number | null>(null);

  // Reset tab when directions change (e.g., route or stop change)
  useEffect(() => {
    setActiveTab(0);
  }, [trainsByDirection.map(d => d.directionName).join(',')]);

  // Get current first train for animation tracking
  const currentDirection = trainsByDirection[activeTab] || trainsByDirection[0];
  const firstTrain = currentDirection?.trains[0];
  const currentMinutes = firstTrain ? Math.floor(firstTrain.minutesAway) : null;

  // Trigger animation when minute value changes
  useEffect(() => {
    if (currentMinutes !== null && prevMinutesRef.current !== null && currentMinutes !== prevMinutesRef.current) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
    prevMinutesRef.current = currentMinutes;
  }, [currentMinutes]);

  if (isWeekend) {
    return (
      <Card>
        <CardBody>
          <EmptyState
            title="No trains on weekends"
            subtitle="Service resumes Monday morning"
          />
        </CardBody>
      </Card>
    );
  }

  if (!hasStop) {
    return (
      <Card>
        <CardBody>
          <EmptyState
            title="Select a station"
            subtitle="Choose your departure stop above"
          />
        </CardBody>
      </Card>
    );
  }

  if (trainsByDirection.length === 0) {
    return (
      <Card>
        <CardBody>
          <EmptyState
            title="No trains available"
            subtitle="Check back later for upcoming departures"
          />
        </CardBody>
      </Card>
    );
  }

  const hasMultipleDirections = trainsByDirection.length > 1;

  // Get direction arrow based on direction name and current route
  const getDirectionArrow = (directionName: string) => {
    const name = directionName.toLowerCase();
    // Northbound destinations (going north)
    if (name.includes('everett') || name.includes('edmonds') || name.includes('mukilteo')) {
      return '↑';
    }
    // Southbound destinations (going south)
    if (name.includes('tacoma') || name.includes('lakewood') || name.includes('kent') ||
        name.includes('auburn') || name.includes('puyallup') || name.includes('sumner') ||
        name.includes('tukwila')) {
      return '↓';
    }
    // King Street/Seattle - direction depends on which line we're on
    if (name.includes('seattle') || name.includes('king')) {
      // N-Line: King Street is south of the other stations → going south
      // S-Line: King Street is north of the other stations → going north
      return currentRoute === 'n-line' ? '↓' : '↑';
    }
    return '';
  };

  // Build tabs for multiple directions
  const tabs = trainsByDirection.map((direction, index) => {
    const arrow = getDirectionArrow(direction.directionName);
    const shortName = direction.directionName.split(' ')[0];
    return {
      id: String(index),
      label: shortName,
      icon: arrow || undefined,
    };
  });

  const renderDirection = (direction: DirectionTrains) => {
    const [firstTrain, ...otherTrains] = direction.trains;

    const isDeparting = firstTrain.departingAt !== undefined;

    // Determine urgency for first train
    let urgencyClass = '';
    if (!firstTrain.isTomorrow) {
      if (isDeparting) {
        urgencyClass = 'departing';
      } else if (firstTrain.minutesAway <= URGENCY_THRESHOLDS.DANGER) {
        urgencyClass = 'urgent';
      } else if (firstTrain.minutesAway <= URGENCY_THRESHOLDS.WARNING) {
        urgencyClass = 'soon';
      } else if (firstTrain.minutesAway <= URGENCY_THRESHOLDS.COMFORTABLE) {
        urgencyClass = 'comfortable';
      }
    }

    // For cancelled trains, show "Cancelled" instead of countdown
    const isCancelledHero = firstTrain.alert?.severity === 'cancelled';
    const firstCountdown = isCancelledHero
      ? 'Cancelled'
      : firstTrain.isTomorrow
        ? 'Tomorrow'
        : formatCountdownCompact(firstTrain.minutesAway, isDeparting);

    const progress = firstTrain.isTomorrow ? 1 : calculateProgress(firstTrain.minutesAway);
    const ringColor = firstTrain.isTomorrow
      ? colors.accent.primary
      : getTrainRingColor(firstTrain, isDeparting);

    const directionArrow = getDirectionArrow(direction.directionName);

    // Build countdown class with animation state and alert styling
    const countdownClasses = [
      'train-hero-countdown',
      firstTrain.isTomorrow ? 'tomorrow' : '',
      isAnimating && !isDeparting ? 'minute-changed' : '',
      firstTrain.alert ? `train-hero-countdown--${firstTrain.alert.severity}` : ''
    ].filter(Boolean).join(' ');

    return (
      <div className="train-direction-section">
        {/* Direction header with arrow and train number */}
        <div className="train-direction-header">
          {directionArrow && <span className="direction-arrow">{directionArrow}</span>}
          <span>
            {firstTrain.trainNumber && <span className="train-direction-number">#{firstTrain.trainNumber}</span>}
            {' '}to {direction.directionName}
          </span>
        </div>

        {/* Hero: Next Train with circular progress */}
        <div className={`train-hero ${urgencyClass}`}>
          <div className="train-hero-container">
            <CircularProgress
              progress={progress}
              color={ringColor}
              size={180}
              strokeWidth={6}
            >
              <div className="train-hero-inner">
                <div className={countdownClasses}>
                  {firstCountdown}
                </div>
                <div className="train-hero-time">{formatTime(firstTrain.time)}</div>
              </div>
            </CircularProgress>
            {/* Alert text below the ring (skip for cancelled since countdown shows it) */}
            {firstTrain.alert && firstTrain.alert.severity !== 'cancelled' && (
              <div className={`train-alert-text train-alert-text--${firstTrain.alert.severity}`}>
                {firstTrain.alert.message}
              </div>
            )}
          </div>
        </div>

        {/* Secondary: Other trains */}
        {otherTrains.length > 0 && (
          <>
            <div className="train-secondary-header">
              <div className="train-secondary-title">Other Departures</div>
            </div>
            <div className="train-secondary-list">
              {otherTrains.map((train, index) => {
                const trainIsDeparting = train.departingAt !== undefined;
                const isCancelled = train.alert?.severity === 'cancelled';
                // Show "Cancelled" instead of countdown for cancelled trains
                const countdown = isCancelled
                  ? 'Cancelled'
                  : train.isTomorrow
                    ? 'tomorrow'
                    : formatCountdown(train.minutesAway, trainIsDeparting);

                return (
                  <div
                    key={index}
                    className={`train-secondary-item ${isCancelled ? 'train-cancelled' : ''}`}
                  >
                    <span className="train-secondary-left">
                      <span className="train-secondary-time">{formatTime(train.time)}</span>
                      {train.trainNumber && (
                        <span className="train-secondary-number">#{train.trainNumber}</span>
                      )}
                      {train.alert && (
                        <span
                          className={`train-alert-indicator train-alert-indicator--${train.alert.severity}`}
                          data-tooltip={train.alert.message}
                          title={train.alert.message}
                        />
                      )}
                    </span>
                    <span className={`train-secondary-countdown ${isCancelled ? 'train-secondary-countdown--cancelled' : ''}`}>
                      {countdown}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <Card overflow className="train-card">
      {/* Destination tabs for multiple directions */}
      {hasMultipleDirections && (
        <Tabs
          tabs={tabs}
          activeTab={String(activeTab)}
          onTabChange={(tabId) => setActiveTab(Number(tabId))}
          className="destination-tabs"
        />
      )}

      <CardBody>
        <div className="direction-content">
          {renderDirection(currentDirection)}
        </div>
      </CardBody>
    </Card>
  );
}
