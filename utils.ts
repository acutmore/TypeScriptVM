// prepend & head & tail & reverse taken from
// https://github.com/pirix-gh/medium/blob/master/types-curry-ramda/src/index.ts

export type Prepend<V extends any, Arr extends any[]> = ((
  v: V,
  ...a: Arr
) => any) extends (...a: infer Args) => any
  ? Args
  : [];

export type Head<T extends any[]> = T extends [any, ...any[]] ? T[0] : never;

export type Tail<T extends any[]> = ((...t: T) => any) extends ((
  _: any,
  ...tail: infer TT
) => any)
  ? TT
  : [];

export type Reverse<
  T extends any[],
  R extends any[] = [],
  I extends any[] = []
> = {
  0: Reverse<T, Prepend<T[I["length"]], R>, Prepend<any, I>>;
  1: R;
}[I["length"] extends T["length"] ? 1 : 0];
