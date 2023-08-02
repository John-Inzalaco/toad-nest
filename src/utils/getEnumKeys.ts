/**
 * Typescript Enums compile to forward and backward indexed objects ex.
 * `enum MyEnum { foo = 1, bar = 2 }`
 * compiles roughly to
 * `const MyEnum = { 1 = 'foo', 2 = 'bar', 'foo' = 1, 'bar' = 2 }`
 * This means if it is used in Object.keys or Object.values
 * it'll return [ '1', '2', 'foo', 'bar'].
 * This helper will extract all the text/string-based values from the
 * compiled enum object. The result would be ['foo', 'bar'].
 */
export const getEnumKeys = <T extends object>(eNum: T): (keyof T)[] =>
  Object.keys(eNum).filter((v) => Number.isNaN(parseInt(v, 10))) as (keyof T)[];
