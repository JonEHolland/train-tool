import type { ReactNode, HTMLAttributes } from 'react';
import styles from './Text.module.css';

// Label component - uppercase labels like "SERVICE ALERTS"
export interface LabelProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

export function Label({ children, className = '', ...props }: LabelProps) {
  return (
    <span className={`${styles.label} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}

// Heading component - for section headings
export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: ReactNode;
}

export function Heading({ level = 2, children, className = '', ...props }: HeadingProps) {
  const sizeClass = styles[`h${level}`];
  const combinedClassName = `${styles.heading} ${sizeClass} ${className}`.trim();

  // Use explicit tag components to maintain proper typing
  switch (level) {
    case 1: return <h1 className={combinedClassName} {...props}>{children}</h1>;
    case 2: return <h2 className={combinedClassName} {...props}>{children}</h2>;
    case 3: return <h3 className={combinedClassName} {...props}>{children}</h3>;
    case 4: return <h4 className={combinedClassName} {...props}>{children}</h4>;
    case 5: return <h5 className={combinedClassName} {...props}>{children}</h5>;
    case 6: return <h6 className={combinedClassName} {...props}>{children}</h6>;
    default: return <h2 className={combinedClassName} {...props}>{children}</h2>;
  }
}

// Caption component - secondary/muted text
export interface CaptionProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  muted?: boolean;
}

export function Caption({ children, muted = false, className = '', ...props }: CaptionProps) {
  const classNames = [
    styles.caption,
    muted ? styles.muted : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <span className={classNames} {...props}>
      {children}
    </span>
  );
}
