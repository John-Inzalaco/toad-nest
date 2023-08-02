export function refineStringToLiteralUnion<T extends string>(
  value: string | null | undefined,
  possibleValues: readonly T[],
): T | null {
  if (possibleValues.includes(value as T)) {
    return value as T;
  }
  return null;
}
