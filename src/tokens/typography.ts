export const typography = {
  // Font families
  fontFamily: {
    primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'SF Mono', 'Monaco', 'Courier New', monospace",
  },

  // Font sizes (using scale factor of 1.25)
  fontSize: {
    xs: '0.75rem',      // 12px - micro labels
    sm: '0.875rem',     // 14px - secondary text
    base: '1rem',       // 16px - body text
    lg: '1.125rem',     // 18px - emphasized text
    xl: '1.25rem',      // 20px - card headers
    '2xl': '1.5rem',    // 24px - section headers
    '3xl': '1.875rem',  // 30px - large display (train times)
    '4xl': '2.25rem',   // 36px - hero numbers
  },

  // Font weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Letter spacing
  letterSpacing: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.02em',
  },
} as const;
