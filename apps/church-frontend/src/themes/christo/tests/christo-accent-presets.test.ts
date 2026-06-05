import { resolveChristoTokens } from '../tokens/apply-christo-tokens';

describe('Christo Accent Presets and Token Resolution', () => {
  it('should compile orange-flame accent preset correctly in light mode', () => {
    const tokens = resolveChristoTokens({
      accentPreset: 'orange-flame',
      colorMode: 'light'
    });

    expect(tokens['--christo-accent']).toBe('#f97316');
    expect(tokens['--christo-bg']).toBe('#faf9f6');
    expect(tokens['--christo-text']).toBe('#1c1917');
  });

  it('should compile royal-blue accent preset correctly in dark mode with dark adjustments', () => {
    const tokens = resolveChristoTokens({
      accentPreset: 'royal-blue',
      colorMode: 'dark'
    });

    expect(tokens['--christo-accent']).toBe('#2563eb');
    expect(tokens['--christo-accent-soft']).toBe('#0f1f42'); // Adjusted in dark mode
    expect(tokens['--christo-bg']).toBe('#141416');
    expect(tokens['--christo-text']).toBe('#f3f4f6');
  });

  it('should resolve sharp shape preset border radius values to 0px', () => {
    const tokens = resolveChristoTokens({
      edgeStyle: 'sharp'
    });

    expect(tokens['--christo-radius-card']).toBe('0px');
    expect(tokens['--christo-radius-button']).toBe('0px');
    expect(tokens['--christo-radius-input']).toBe('0px');
  });

  it('should resolve rounded shape preset border radius values with button shape pill override', () => {
    const tokens = resolveChristoTokens({
      edgeStyle: 'rounded',
      buttonShape: 'pill'
    });

    expect(tokens['--christo-radius-card']).toBe('20px');
    expect(tokens['--christo-radius-button']).toBe('9999px');
  });
});
