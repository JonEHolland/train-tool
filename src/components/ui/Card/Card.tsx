import type { ReactNode, HTMLAttributes } from 'react';
import styles from './Card.module.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Allow content to overflow (e.g., for dropdowns, tabs) */
  overflow?: boolean;
}

export function Card({ children, overflow = false, className = '', ...props }: CardProps) {
  const classNames = [
    styles.card,
    overflow ? styles.overflow : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames} {...props}>
      {children}
    </div>
  );
}

export interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`${styles.header} ${className}`.trim()}>
      {children}
    </div>
  );
}

export interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

export function CardBody({ children, className = '' }: CardBodyProps) {
  return (
    <div className={`${styles.body} ${className}`.trim()}>
      {children}
    </div>
  );
}
