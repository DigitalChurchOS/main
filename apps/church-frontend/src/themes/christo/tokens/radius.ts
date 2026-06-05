export interface ShapePreset {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  card: string;
  button: string;
  input: string;
  image: string;
  modal: string;
  panel: string;
  pill: string;
}

export const radiusPresets: Record<'rounded' | 'soft' | 'sharp', ShapePreset> = {
  rounded: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    card: '20px',
    button: '9999px', // Pill shape for rounded button shape
    input: '12px',
    image: '16px',
    modal: '24px',
    panel: '16px',
    pill: '9999px'
  },
  soft: {
    xs: '2px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '20px',
    card: '12px',
    button: '6px',
    input: '6px',
    image: '8px',
    modal: '12px',
    panel: '8px',
    pill: '9999px'
  },
  sharp: {
    xs: '0px',
    sm: '0px',
    md: '0px',
    lg: '0px',
    xl: '0px',
    '2xl': '0px',
    card: '0px',
    button: '0px',
    input: '0px',
    image: '0px',
    modal: '0px',
    panel: '0px',
    pill: '0px'
  }
};
