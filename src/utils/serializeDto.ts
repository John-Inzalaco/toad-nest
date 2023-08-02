export type SerializeDto<T> = T extends Date
  ? string
  : T extends object
  ? { [key in keyof T]: SerializeDto<T[key]> }
  : T;
