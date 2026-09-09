export const THEMES = {
  lovely: {
    id: 'lovely',
    name: 'Lovely Rose',
    colors: {
      primary: '#FF4D85',
      secondary: '#FFA3B5',
      accent: '#FFD4E0',
      background: '#FFF5F7',
      card: '#FFFFFF',
      textPrimary: '#2D1B2E',
      textSecondary: '#8B6B8D',
      heartRed: '#FF4D6D',
      partnerAccent: '#7C5CFC',
      success: '#4ECDC4',
      gradientStart: '#FF6B8A',
      gradientEnd: '#FF8E9E',
      surfaceOverlay: 'rgba(255, 107, 138, 0.08)',
    }
  },
  ocean: {
    id: 'ocean',
    name: 'Ocean Breeze',
    colors: {
      primary: '#0084FF',
      secondary: '#82C4E6',
      accent: '#D4F0FF',
      background: '#F0F8FF',
      card: '#FFFFFF',
      textPrimary: '#1E3B4D',
      textSecondary: '#6B8D9E',
      heartRed: '#FF4D6D',
      partnerAccent: '#FF9A3C',
      success: '#4ECDC4',
      gradientStart: '#4DA8DA',
      gradientEnd: '#7BC5EE',
      surfaceOverlay: 'rgba(77, 168, 218, 0.08)',
    }
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Purple',
    colors: {
      primary: '#A259FF',
      secondary: '#C77DFF',
      accent: '#E0AAFF',
      background: '#14121E',
      card: '#201C30',
      textPrimary: '#FFFFFF',
      textSecondary: '#A992C8',
      heartRed: '#FF4D6D',
      partnerAccent: '#F9A03F',
      success: '#4ECDC4',
      gradientStart: '#9D4EDD',
      gradientEnd: '#7B2CBF',
      surfaceOverlay: 'rgba(157, 78, 221, 0.15)',
    }
  },
  forest: {
    id: 'forest',
    name: 'Deep Forest',
    colors: {
      primary: '#2D6A4F',
      secondary: '#52B788',
      accent: '#B7E4C7',
      background: '#F1F8F2',
      card: '#FFFFFF',
      textPrimary: '#1B3B1D',
      textSecondary: '#74A57F',
      heartRed: '#FF4D6D',
      partnerAccent: '#D4A373',
      success: '#4ECDC4',
      gradientStart: '#2D6A4F',
      gradientEnd: '#40916C',
      surfaceOverlay: 'rgba(45, 106, 79, 0.08)',
    }
  }
};

export const SIZES = {
  pillRadius: 9999,
  cardRadius: 24,
  padding: 20,
};

export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 6,
  },
  glow: (color) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  }),
};

export const ANIMATION = {
  spring: {
    bouncy: { tension: 40, friction: 3 },
    smooth: { tension: 30, friction: 7 },
  },
  timing: {
    fast: 200,
    normal: 300,
    slow: 500,
  }
};
