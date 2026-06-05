export const christoManifest = {
  themeKey: 'christo',
  displayName: 'Christo Premium Theme',
  version: '1.0.0',
  description: 'Premium modern visual system with dynamic accent-based presets.',
  settingsSchema: {
    type: 'object',
    properties: {
      accentPreset: {
        type: 'string',
        enum: [
          'orange-flame',
          'royal-blue',
          'deep-purple',
          'emerald-green',
          'crimson-red',
          'rose-pink',
          'charcoal-gray',
          'gold-glory'
        ],
        default: 'orange-flame'
      },
      colorMode: {
        type: 'string',
        enum: ['light', 'dark', 'system'],
        default: 'light'
      },
      edgeStyle: {
        type: 'string',
        enum: ['rounded', 'soft', 'sharp'],
        default: 'rounded'
      },
      buttonShape: {
        type: 'string',
        enum: ['pill', 'rounded', 'soft', 'sharp'],
        default: 'rounded'
      },
      cardShape: {
        type: 'string',
        enum: ['rounded', 'soft', 'sharp'],
        default: 'rounded'
      },
      imageShape: {
        type: 'string',
        enum: ['rounded', 'soft', 'sharp'],
        default: 'rounded'
      },
      formShape: {
        type: 'string',
        enum: ['rounded', 'soft', 'sharp'],
        default: 'rounded'
      },
      shadowStyle: {
        type: 'string',
        enum: ['soft', 'sharp', 'none'],
        default: 'soft'
      },
      gradientIntensity: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      },
      blobIntensity: {
        type: 'string',
        enum: ['low', 'medium', 'high'],
        default: 'medium'
      }
    }
  }
};
export type ChristoSettings = typeof christoManifest.settingsSchema.properties;
