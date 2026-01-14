import type { ReactNode } from 'react';
import { Button } from '../Button';
import styles from './Banner.module.css';

export interface BannerProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  onDismiss?: () => void;
  visible?: boolean;
  className?: string;
}

export function Banner({
  icon,
  title,
  subtitle,
  actions,
  onDismiss,
  visible = true,
  className = '',
}: BannerProps) {
  if (!visible) return null;

  return (
    <div className={`${styles.banner} ${className}`.trim()}>
      <div className={styles.content}>
        {icon && <div className={styles.icon}>{icon}</div>}
        <div className={styles.text}>
          <div className={styles.title}>{title}</div>
          {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
        </div>
      </div>
      <div className={styles.actions}>
        {actions}
        {onDismiss && (
          <Button variant="icon" onClick={onDismiss} aria-label="Dismiss">
            ✕
          </Button>
        )}
      </div>
    </div>
  );
}
