import type { ReactNode } from 'react';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  title: string;
  subtitle: string;
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({ title, subtitle, icon, className = '' }: EmptyStateProps) {
  return (
    <div className={`${styles.emptyState} ${className}`.trim()}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.title}>{title}</div>
      <div className={styles.subtitle}>{subtitle}</div>
    </div>
  );
}
