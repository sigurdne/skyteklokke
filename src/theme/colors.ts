export const colors = {
  primary: '#2C3E50',      // Professional dark blue
  secondary: '#E74C3C',    // Red (stop/cease fire)
  success: '#27AE60',      // Green (start/fire)
  warning: '#F39C12',      // Orange (prepare)
  danger: '#E74C3C',       // Red (stop)
  background: '#FFFFFF',   // White background
  surface: '#F8F9FA',      // Light gray cards
  text: '#2C3E50',         // Dark text
  textSecondary: '#7F8C8D', // Gray description
  border: '#DFE6E9',       // Light border
  
  // Timer specific colors
  idle: '#95A5A6',         // Gray for idle
  ready: '#F39C12',        // Orange for ready/prepare
  active: '#27AE60',       // Green for active shooting
  cease: '#E74C3C',        // Red for cease fire
  
  // Duel light colors
  redLight: '#E74C3C',
  greenLight: '#27AE60',
};

export type ColorName = keyof typeof colors;
