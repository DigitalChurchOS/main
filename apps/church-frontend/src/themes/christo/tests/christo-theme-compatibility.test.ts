import { validateThemeCompatibility } from '@churchos/frontend-contracts';
import { christoTheme } from '../christo.adapter';

describe('Christo Theme Compatibility tests', () => {
  it('should validate and report 100% compatibility for Christo Theme', () => {
    const report = validateThemeCompatibility(christoTheme);
    expect(report.themeKey).toBe('christo');
    expect(report.displayName).toBe('Christo Premium Theme');
    expect(report.version).toBe('1.0.0');
    expect(report.implementedSlotsCount).toBe(report.totalSlotsCount);
    expect(report.compatibilityScore).toBe(100);
    expect(report.fallbackSlots.length).toBe(0);
  });
});
