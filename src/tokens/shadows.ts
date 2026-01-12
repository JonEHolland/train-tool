export const shadows = {
  // Elevation system
  sm: '0 2px 8px rgba(0, 0, 0, 0.4)',
  md: '0 4px 16px rgba(0, 0, 0, 0.5)',
  lg: '0 8px 32px rgba(0, 0, 0, 0.6)',
  xl: '0 16px 48px rgba(0, 0, 0, 0.7)',

  // Glow effects
  glow: {
    accent: '0 0 20px rgba(95, 234, 212, 0.3)',
    danger: '0 0 20px rgba(255, 107, 107, 0.3)',
  },

  // Inner shadows for glassmorphism
  inner: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)',
} as const;
