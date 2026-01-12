export const colors = {
  // Base colors from inspiration
  background: {
    primary: '#0A1628',        // Deep navy blue (main background)
    secondary: '#111D31',      // Slightly lighter navy (cards)
    tertiary: '#1A2942',       // Card headers, elevated surfaces
  },

  // Accent colors (teal/mint gradient from inspiration)
  accent: {
    primary: '#5FEAD4',        // Bright teal (primary actions, highlights)
    secondary: '#4DD4BC',      // Darker teal (hover states)
    tertiary: '#7DF5E3',       // Light teal (subtle highlights)
    gradient: 'linear-gradient(135deg, #5FEAD4 0%, #4DD4BC 100%)',
  },

  // Text colors
  text: {
    primary: '#FFFFFF',        // White for main content
    secondary: '#A8B3CF',      // Muted blue-gray for secondary text
    tertiary: '#6B7A99',       // Even more muted for labels
    inverse: '#0A1628',        // Dark text on light backgrounds
  },

  // Semantic colors
  status: {
    success: '#4DD4BC',        // Teal for normal status
    warning: '#FFB84D',        // Amber for weekend notices
    danger: '#FF6B6B',         // Coral red for urgent/alerts
    info: '#4A90E2',           // Blue for informational
  },

  // Surfaces with transparency (glassmorphism)
  surface: {
    glass: 'rgba(26, 41, 66, 0.6)',           // Semi-transparent cards
    glassHover: 'rgba(26, 41, 66, 0.8)',      // Hover state
    glassBorder: 'rgba(95, 234, 212, 0.2)',   // Teal border with transparency
  },

  // Special states
  countdown: {
    normal: '#A8B3CF',         // Default countdown color
    soon: '#FFB84D',           // 15-30 min warning
    urgent: '#FF6B6B',         // < 15 min urgent
  },
} as const;
