export const animations = {
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
  },

  easing: {
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
  },
} as const;
