export enum VideoUpNextOrder {
  standard = 0,
  boosted = 1,
  excluded = 2,
}
export const videoUpNextOrderKeys = Object.keys(VideoUpNextOrder).filter(
  (key) => isNaN(Number(key)),
) as (keyof typeof VideoUpNextOrder)[];
