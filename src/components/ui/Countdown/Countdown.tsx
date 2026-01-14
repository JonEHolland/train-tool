import type { ReactNode } from 'react';
import styles from './Countdown.module.css';

export type CountdownVariant = 'default' | 'danger' | 'warning' | 'comfortable';

export interface CountdownProps {
  /** The text/content to display */
  children: ReactNode;
  /** Visual variant for color styling */
  variant?: CountdownVariant;
  /** Large display mode for hero sections */
  large?: boolean;
  /** Enable pulse animation */
  pulse?: boolean;
  className?: string;
}

/**
 * A styled time/countdown display component.
 *
 * This is a pure presentational component - the parent is responsible
 * for formatting the text and determining the variant based on app logic.
 *
 * @example
 * // App-specific wrapper determines formatting and color
 * <Countdown variant="danger" large pulse>Departing</Countdown>
 * <Countdown variant="warning">in 5 min</Countdown>
 * <Countdown large>30m</Countdown>
 */
export function Countdown({
  children,
  variant = 'default',
  large = false,
  pulse = false,
  className = '',
}: CountdownProps) {
  const classNames = [
    styles.countdown,
    styles[variant],
    large ? styles.large : '',
    pulse ? styles.pulse : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classNames}>
      {children}
    </span>
  );
}
