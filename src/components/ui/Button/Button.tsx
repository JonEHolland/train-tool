import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'segment' | 'tab' | 'ghost' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  active?: boolean;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  active = false,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const classNames = [
    styles.button,
    styles[variant],
    active ? styles.active : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={classNames} {...props}>
      {children}
    </button>
  );
}
