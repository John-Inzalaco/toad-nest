/**
 * TypeScript by default doesn't refine `key` to be a key of `obj`
 * when using `in` or `hasOwnProperty`, making access after the
 * check a type error still. See https://github.com/microsoft/TypeScript/issues/34867
 */
function isKeyOfObject<T extends object>(
  key: string | number | symbol,
  obj: T,
): key is keyof T {
  return key in obj;
}

export default isKeyOfObject;
