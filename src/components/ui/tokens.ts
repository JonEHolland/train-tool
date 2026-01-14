/**
 * Design Tokens
 * TypeScript exports for CSS custom properties defined in App.css
 * Enables programmatic access to design system values
 */

export const colors = {
  bg: {
    primary: 'var(--color-bg-primary)',
    secondary: 'var(--color-bg-secondary)',
    tertiary: 'var(--color-bg-tertiary)',
  },
  accent: {
    primary: 'var(--color-accent-primary)',
    secondary: 'var(--color-accent-secondary)',
    tertiary: 'var(--color-accent-tertiary)',
  },
  text: {
    primary: 'var(--color-text-primary)',
    secondary: 'var(--color-text-secondary)',
    tertiary: 'var(--color-text-tertiary)',
  },
  status: {
    success: 'var(--color-status-success)',
    warning: 'var(--color-status-warning)',
    comfortable: 'var(--color-status-comfortable)',
    danger: 'var(--color-status-danger)',
    info: 'var(--color-status-info)',
  },
  surface: {
    glass: 'var(--color-surface-glass)',
    glassHover: 'var(--color-surface-glass-hover)',
    glassBorder: 'var(--color-surface-glass-border)',
  },
} as const;

export const spacing = {
  2: 'var(--spacing-2)',
  3: 'var(--spacing-3)',
  4: 'var(--spacing-4)',
  5: 'var(--spacing-5)',
  6: 'var(--spacing-6)',
  8: 'var(--spacing-8)',
} as const;

export const radius = {
  md: 'var(--radius-md)',
  lg: 'var(--radius-lg)',
  xl: 'var(--radius-xl)',
  full: 'var(--radius-full)',
} as const;

export const shadows = {
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  glowAccent: 'var(--shadow-glow-accent)',
  glowDanger: 'var(--shadow-glow-danger)',
  inner: 'var(--shadow-inner)',
} as const;

export const transitions = {
  fast: 'var(--transition-fast)',
  normal: 'var(--transition-normal)',
  slow: 'var(--transition-slow)',
} as const;

export const typography = {
  fontFamily: 'var(--font-family-primary)',
} as const;

// Severity type for components that need it
export type Severity = 'danger' | 'warning' | 'info' | 'success' | 'comfortable';

// Map severity to status colors
export const severityColors: Record<Severity, string> = {
  danger: colors.status.danger,
  warning: colors.status.warning,
  info: colors.status.info,
  success: colors.status.success,
  comfortable: colors.status.comfortable,
};
