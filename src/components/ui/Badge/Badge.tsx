import type { ReactNode } from 'react';
import type { Severity } from '../tokens';
import styles from './Badge.module.css';

export interface BadgeProps {
  severity: Severity;
  size?: 'sm' | 'md';
  dot?: boolean;
  children?: ReactNode;
  className?: string;
}

export function Badge({
  severity,
  size = 'md',
  dot = false,
  children,
  className = '',
}: BadgeProps) {
  const classNames = [
    styles.badge,
    styles[severity],
    styles[size],
    dot ? styles.dot : '',
    className,
  ].filter(Boolean).join(' ');

  if (dot) {
    return <span className={classNames} aria-hidden="true" />;
  }

  return (
    <span className={classNames}>
      {children}
    </span>
  );
}
