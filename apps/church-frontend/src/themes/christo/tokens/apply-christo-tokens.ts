import { accentPresets } from './accent-presets';
import { radiusPresets } from './radius';
import { lightModeTokens } from './light-mode';
import { darkModeTokens } from './dark-mode';
import { typographyTokens } from './typography';
import { spacingTokens } from './spacing';
import { shadowPresets } from './shadows';
import { motionTokens, getMotionStyles } from './motion';

export function getChristoAccentPreset(presetKey: string) {
  return accentPresets[presetKey] || accentPresets['orange-flame'];
}

export function resolveChristoTokens(settings: {
  accentPreset?: string;
  colorMode?: 'light' | 'dark' | 'system';
  edgeStyle?: 'rounded' | 'soft' | 'sharp';
  buttonShape?: 'pill' | 'rounded' | 'soft' | 'sharp';
  cardShape?: 'rounded' | 'soft' | 'sharp';
  imageShape?: 'rounded' | 'soft' | 'sharp';
  formShape?: 'rounded' | 'soft' | 'sharp';
  shadowStyle?: 'soft' | 'sharp' | 'none';
  gradientIntensity?: 'low' | 'medium' | 'high';
  blobIntensity?: 'low' | 'medium' | 'high';
  customAccentColor?: string;
}) {
  // 1. Resolve Color Mode
  let isDark = false;
  const mode = settings.colorMode || 'light';
  if (mode === 'system') {
    if (typeof window !== 'undefined') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  } else {
    isDark = mode === 'dark';
  }

  const baseColors = isDark ? darkModeTokens : lightModeTokens;

  // 2. Resolve Accent Preset
  const presetKey = settings.accentPreset || 'orange-flame';
  const recipe = { ...getChristoAccentPreset(presetKey) };

  // Apply dark/light overrides
  if (isDark && recipe.darkModeAccentAdjustments) {
    Object.assign(recipe, recipe.darkModeAccentAdjustments);
  } else if (!isDark && recipe.lightModeAccentAdjustments) {
    Object.assign(recipe, recipe.lightModeAccentAdjustments);
  }

  // Custom accent override
  if (settings.customAccentColor) {
    recipe.accent = settings.customAccentColor;
    recipe.icon = settings.customAccentColor;
    recipe.buttonBg = settings.customAccentColor;
    recipe.cardHighlight = settings.customAccentColor;
  }

  // 3. Resolve Shape
  const edgeStyle = settings.edgeStyle || 'rounded';
  const baseShape = radiusPresets[edgeStyle] || radiusPresets['rounded'];

  const resolveShapeRadius = (
    presetKey: string | undefined,
    element: 'button' | 'card' | 'input' | 'image' | 'modal' | 'panel' | 'pill',
    fallbackValue: string
  ): string => {
    if (!presetKey) return fallbackValue;
    if (presetKey === 'pill') return '9999px';
    const pr = radiusPresets[presetKey as 'rounded' | 'soft' | 'sharp'];
    if (!pr) return fallbackValue;
    return pr[element] || pr.md;
  };

  const buttonRadius = resolveShapeRadius(settings.buttonShape, 'button', baseShape.button);
  const cardRadius = resolveShapeRadius(settings.cardShape, 'card', baseShape.card);
  const inputRadius = resolveShapeRadius(settings.formShape, 'input', baseShape.input);
  const imageRadius = resolveShapeRadius(settings.imageShape, 'image', baseShape.image);

  // 4. Intensity Factor Multipliers
  const gradientIntensity = settings.gradientIntensity || 'medium';
  const gradientAlpha = gradientIntensity === 'low' ? 0.3 : gradientIntensity === 'high' ? 1.0 : 0.75;

  const blobIntensity = settings.blobIntensity || 'medium';
  const blobAlphaMult = blobIntensity === 'low' ? 0.4 : blobIntensity === 'high' ? 1.5 : 1.0;

  // Modify blobs and overlay based on intensity
  const scaleRgba = (rgbaStr: string, mult: number) => {
    const match = rgbaStr.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (match) {
      const [_, r, g, b, a] = match;
      const newA = Math.min(1.0, Math.max(0.0, parseFloat(a) * mult));
      return `rgba(${r}, ${g}, ${b}, ${newA})`;
    }
    return rgbaStr;
  };

  const finalBlobPrimary = scaleRgba(recipe.blobPrimary, blobAlphaMult);
  const finalBlobSecondary = scaleRgba(recipe.blobSecondary, blobAlphaMult);

  // 5. Shadows Preset
  const shadowPresetKey = settings.shadowStyle || 'soft';
  const shadows = shadowPresets[shadowPresetKey] || shadowPresets.soft;

  // 6. Motion (Checking preferences)
  let reducedMotion = false;
  if (typeof window !== 'undefined') {
    reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  const motion = getMotionStyles(reducedMotion);

  // 7. Compile Semantic CSS Tokens
  return {
    '--christo-bg': baseColors.bg,
    '--christo-surface': baseColors.surface,
    '--christo-surface-soft': baseColors.surfaceSoft,
    '--christo-text': baseColors.text,
    '--christo-muted': baseColors.muted,
    '--christo-border': baseColors.border,

    '--christo-accent': recipe.accent,
    '--christo-accent-soft': recipe.accentSoft,
    '--christo-accent-muted': recipe.accentMuted,
    '--christo-accent-strong': recipe.accentStrong,
    '--christo-accent-foreground': recipe.accentForeground,
    '--christo-accent-ring': recipe.ring,
    '--christo-accent-glow': recipe.glow,

    '--christo-gradient-start': recipe.gradientStart,
    '--christo-gradient-mid': recipe.gradientMid,
    '--christo-gradient-end': recipe.gradientEnd,
    '--christo-gradient-alpha': `${gradientAlpha}`,

    '--christo-hero-glow': recipe.glow,
    '--christo-blob-primary': finalBlobPrimary,
    '--christo-blob-secondary': finalBlobSecondary,
    '--christo-card-highlight': recipe.cardHighlight,

    '--christo-button-bg': recipe.buttonBg,
    '--christo-button-hover': recipe.buttonHover,
    '--christo-link': recipe.accent,
    '--christo-icon': recipe.icon,

    '--christo-live': baseColors.live,
    '--christo-success': baseColors.success,
    '--christo-warning': baseColors.warning,
    '--christo-danger': baseColors.danger,

    // Typography
    '--christo-font-sans': typographyTokens.fontSans,
    '--christo-font-serif': typographyTokens.fontSerif,
    '--christo-text-xs': typographyTokens.sizeXs,
    '--christo-text-sm': typographyTokens.sizeSm,
    '--christo-text-base': typographyTokens.sizeBase,
    '--christo-text-lg': typographyTokens.sizeLg,
    '--christo-text-xl': typographyTokens.sizeXl,
    '--christo-text-2xl': typographyTokens.size2xl,
    '--christo-text-3xl': typographyTokens.size3xl,
    '--christo-text-4xl': typographyTokens.size4xl,

    // Spacing
    '--christo-spacing-xs': spacingTokens.xs,
    '--christo-spacing-sm': spacingTokens.sm,
    '--christo-spacing-md': spacingTokens.md,
    '--christo-spacing-lg': spacingTokens.lg,
    '--christo-spacing-xl': spacingTokens.xl,
    '--christo-spacing-2xl': spacingTokens['2xl'],
    '--christo-spacing-3xl': spacingTokens['3xl'],

    // Radius
    '--christo-radius-xs': baseShape.xs,
    '--christo-radius-sm': baseShape.sm,
    '--christo-radius-md': baseShape.md,
    '--christo-radius-lg': baseShape.lg,
    '--christo-radius-xl': baseShape.xl,
    '--christo-radius-2xl': baseShape['2xl'],
    '--christo-radius-card': cardRadius,
    '--christo-radius-button': buttonRadius,
    '--christo-radius-input': inputRadius,
    '--christo-radius-image': imageRadius,
    '--christo-radius-modal': baseShape.modal,
    '--christo-radius-panel': baseShape.panel,
    '--christo-radius-pill': baseShape.pill,

    // Shadows
    '--christo-shadow-sm': shadows.sm,
    '--christo-shadow-md': shadows.md,
    '--christo-shadow-lg': shadows.lg,
    '--christo-shadow-xl': shadows.xl,

    // Motion
    '--christo-transition-fast': motion.transitionFast,
    '--christo-transition-normal': motion.transitionNormal,
    '--christo-transition-slow': motion.transitionSlow,
    '--christo-transition-bounce': motion.transitionBounce,
  };
}

export function applyChristoCssVariables(tokens: Record<string, string>) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  for (const [key, value] of Object.entries(tokens)) {
    root.style.setProperty(key, value);
  }
}
