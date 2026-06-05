export const motionTokens = {
  transitionFast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  transitionNormal: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
  transitionSlow: '350ms cubic-bezier(0.4, 0, 0.2, 1)',
  transitionBounce: '300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
};
export const getMotionStyles = (reducedMotion: boolean) => {
  if (reducedMotion) {
    return {
      transitionFast: '0s',
      transitionNormal: '0s',
      transitionSlow: '0s',
      transitionBounce: '0s',
    };
  }
  return motionTokens;
};
