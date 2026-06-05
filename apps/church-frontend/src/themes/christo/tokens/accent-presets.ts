export interface AccentPresetRecipe {
  accent: string;
  accentSoft: string;
  accentMuted: string;
  accentStrong: string;
  accentForeground: string;
  gradientStart: string;
  gradientMid: string;
  gradientEnd: string;
  blobPrimary: string;
  blobSecondary: string;
  glow: string;
  ring: string;
  icon: string;
  buttonBg: string;
  buttonHover: string;
  cardHighlight: string;
  heroOverlay: string;
  darkModeAccentAdjustments?: Partial<Omit<AccentPresetRecipe, 'darkModeAccentAdjustments' | 'lightModeAccentAdjustments'>>;
  lightModeAccentAdjustments?: Partial<Omit<AccentPresetRecipe, 'darkModeAccentAdjustments' | 'lightModeAccentAdjustments'>>;
}

export const accentPresets: Record<string, AccentPresetRecipe> = {
  'orange-flame': {
    accent: '#f97316', // Warm Orange
    accentSoft: '#ffedd5',
    accentMuted: '#fdba74',
    accentStrong: '#ea580c',
    accentForeground: '#ffffff',
    gradientStart: '#f97316',
    gradientMid: '#fdba74',
    gradientEnd: '#ea580c',
    blobPrimary: 'rgba(249, 115, 22, 0.15)',
    blobSecondary: 'rgba(234, 88, 12, 0.08)',
    glow: 'rgba(249, 115, 22, 0.35)',
    ring: 'rgba(249, 115, 22, 0.5)',
    icon: '#ea580c',
    buttonBg: '#f97316',
    buttonHover: '#ea580c',
    cardHighlight: '#f97316',
    heroOverlay: 'rgba(249, 115, 22, 0.04)',
    darkModeAccentAdjustments: {
      accentSoft: '#2c1a0e',
      accentMuted: '#ea580c',
      blobPrimary: 'rgba(249, 115, 22, 0.08)',
      blobSecondary: 'rgba(234, 88, 12, 0.04)',
    }
  },
  'royal-blue': {
    accent: '#2563eb', // Trustworthy Blue
    accentSoft: '#dbeafe',
    accentMuted: '#93c5fd',
    accentStrong: '#1d4ed8',
    accentForeground: '#ffffff',
    gradientStart: '#2563eb',
    gradientMid: '#60a5fa',
    gradientEnd: '#1d4ed8',
    blobPrimary: 'rgba(37, 99, 235, 0.15)',
    blobSecondary: 'rgba(29, 78, 216, 0.08)',
    glow: 'rgba(37, 99, 235, 0.35)',
    ring: 'rgba(37, 99, 235, 0.5)',
    icon: '#1d4ed8',
    buttonBg: '#2563eb',
    buttonHover: '#1d4ed8',
    cardHighlight: '#2563eb',
    heroOverlay: 'rgba(37, 99, 235, 0.04)',
    darkModeAccentAdjustments: {
      accentSoft: '#0f1f42',
      accentMuted: '#1d4ed8',
      blobPrimary: 'rgba(37, 99, 235, 0.08)',
      blobSecondary: 'rgba(29, 78, 216, 0.04)',
    }
  },
  'deep-purple': {
    accent: '#7c3aed', // Spiritual Violet
    accentSoft: '#ede9fe',
    accentMuted: '#c4b5fd',
    accentStrong: '#6d28d9',
    accentForeground: '#ffffff',
    gradientStart: '#7c3aed',
    gradientMid: '#a78bfa',
    gradientEnd: '#6d28d9',
    blobPrimary: 'rgba(124, 58, 237, 0.15)',
    blobSecondary: 'rgba(109, 40, 217, 0.08)',
    glow: 'rgba(124, 58, 237, 0.35)',
    ring: 'rgba(124, 58, 237, 0.5)',
    icon: '#6d28d9',
    buttonBg: '#7c3aed',
    buttonHover: '#6d28d9',
    cardHighlight: '#7c3aed',
    heroOverlay: 'rgba(124, 58, 237, 0.04)',
    darkModeAccentAdjustments: {
      accentSoft: '#1e113a',
      accentMuted: '#6d28d9',
      blobPrimary: 'rgba(124, 58, 237, 0.08)',
      blobSecondary: 'rgba(109, 40, 217, 0.04)',
    }
  },
  'emerald-green': {
    accent: '#059669', // Growth-focused Green
    accentSoft: '#d1fae5',
    accentMuted: '#6ee7b7',
    accentStrong: '#047857',
    accentForeground: '#ffffff',
    gradientStart: '#059669',
    gradientMid: '#34d399',
    gradientEnd: '#047857',
    blobPrimary: 'rgba(5, 150, 105, 0.15)',
    blobSecondary: 'rgba(4, 120, 87, 0.08)',
    glow: 'rgba(5, 150, 105, 0.35)',
    ring: 'rgba(5, 150, 105, 0.5)',
    icon: '#047857',
    buttonBg: '#059669',
    buttonHover: '#047857',
    cardHighlight: '#059669',
    heroOverlay: 'rgba(5, 150, 105, 0.04)',
    darkModeAccentAdjustments: {
      accentSoft: '#0a2e21',
      accentMuted: '#047857',
      blobPrimary: 'rgba(5, 150, 105, 0.08)',
      blobSecondary: 'rgba(4, 120, 87, 0.04)',
    }
  },
  'crimson-red': {
    accent: '#dc2626', // Revival Red
    accentSoft: '#fee2e2',
    accentMuted: '#fca5a5',
    accentStrong: '#b91c1c',
    accentForeground: '#ffffff',
    gradientStart: '#dc2626',
    gradientMid: '#f87171',
    gradientEnd: '#b91c1c',
    blobPrimary: 'rgba(220, 38, 38, 0.15)',
    blobSecondary: 'rgba(185, 28, 28, 0.08)',
    glow: 'rgba(220, 38, 38, 0.35)',
    ring: 'rgba(220, 38, 38, 0.5)',
    icon: '#b91c1c',
    buttonBg: '#dc2626',
    buttonHover: '#b91c1c',
    cardHighlight: '#dc2626',
    heroOverlay: 'rgba(220, 38, 38, 0.04)',
    darkModeAccentAdjustments: {
      accentSoft: '#370e0e',
      accentMuted: '#b91c1c',
      blobPrimary: 'rgba(220, 38, 38, 0.08)',
      blobSecondary: 'rgba(185, 28, 28, 0.04)',
    }
  },
  'rose-pink': {
    accent: '#db2777', // Soft Pink
    accentSoft: '#fce7f3',
    accentMuted: '#fbcfe8',
    accentStrong: '#be185d',
    accentForeground: '#ffffff',
    gradientStart: '#db2777',
    gradientMid: '#f472b6',
    gradientEnd: '#be185d',
    blobPrimary: 'rgba(219, 39, 119, 0.15)',
    blobSecondary: 'rgba(190, 24, 93, 0.08)',
    glow: 'rgba(219, 39, 119, 0.35)',
    ring: 'rgba(219, 39, 119, 0.5)',
    icon: '#be185d',
    buttonBg: '#db2777',
    buttonHover: '#be185d',
    cardHighlight: '#db2777',
    heroOverlay: 'rgba(219, 39, 119, 0.04)',
    darkModeAccentAdjustments: {
      accentSoft: '#370d23',
      accentMuted: '#be185d',
      blobPrimary: 'rgba(219, 39, 119, 0.08)',
      blobSecondary: 'rgba(190, 24, 93, 0.04)',
    }
  },
  'charcoal-gray': {
    accent: '#4b5563', // Editorial Gray
    accentSoft: '#f3f4f6',
    accentMuted: '#d1d5db',
    accentStrong: '#374151',
    accentForeground: '#ffffff',
    gradientStart: '#4b5563',
    gradientMid: '#9ca3af',
    gradientEnd: '#1f2937',
    blobPrimary: 'rgba(75, 85, 99, 0.15)',
    blobSecondary: 'rgba(55, 65, 81, 0.08)',
    glow: 'rgba(75, 85, 99, 0.3)',
    ring: 'rgba(75, 85, 99, 0.4)',
    icon: '#374151',
    buttonBg: '#4b5563',
    buttonHover: '#374151',
    cardHighlight: '#4b5563',
    heroOverlay: 'rgba(75, 85, 99, 0.04)',
    darkModeAccentAdjustments: {
      accentSoft: '#1e2530',
      accentMuted: '#9ca3af',
      blobPrimary: 'rgba(75, 85, 99, 0.08)',
      blobSecondary: 'rgba(55, 65, 81, 0.04)',
    }
  },
  'gold-glory': {
    accent: '#d97706', // Dignified Gold
    accentSoft: '#fef3c7',
    accentMuted: '#fcd34d',
    accentStrong: '#b45309',
    accentForeground: '#ffffff',
    gradientStart: '#d97706',
    gradientMid: '#fbbf24',
    gradientEnd: '#b45309',
    blobPrimary: 'rgba(217, 119, 6, 0.15)',
    blobSecondary: 'rgba(180, 83, 9, 0.08)',
    glow: 'rgba(217, 119, 6, 0.35)',
    ring: 'rgba(217, 119, 6, 0.5)',
    icon: '#b45309',
    buttonBg: '#d97706',
    buttonHover: '#b45309',
    cardHighlight: '#d97706',
    heroOverlay: 'rgba(217, 119, 6, 0.04)',
    darkModeAccentAdjustments: {
      accentSoft: '#2d1902',
      accentMuted: '#b45309',
      blobPrimary: 'rgba(217, 119, 6, 0.08)',
      blobSecondary: 'rgba(180, 83, 9, 0.04)',
    }
  }
};
