const ASPECT_RATIOS = [
  { min: 0, max: 0.65, ratio: '9:16' },
  { min: 0.65, max: 0.8, ratio: '3:4' },
  { min: 0.8, max: 1.2, ratio: '1:1' },
  { min: 1.2, max: 1.6, ratio: '4:3' },
];

export const calculateAspectRatio = (
  width: number | null | undefined,
  height: number | null | undefined,
): string => {
  if (width && height) {
    for (const r in ASPECT_RATIOS) {
      const ratio = width / height;
      if (ratio >= ASPECT_RATIOS[r].min && ASPECT_RATIOS[r].max >= ratio) {
        return ASPECT_RATIOS[r].ratio;
      }
    }
  }
  return '16:9';
};
