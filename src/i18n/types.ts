import type { EnMessages } from "./en/index.ts";

type DeepStringify<T> = T extends string
  ? string
  : T extends readonly unknown[]
    ? { [I in keyof T]: DeepStringify<T[I]> }
    : T extends object
      ? { [K in keyof T]: DeepStringify<T[K]> }
      : T;

export type Messages = DeepStringify<EnMessages>;
