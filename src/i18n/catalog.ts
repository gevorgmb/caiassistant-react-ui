import { en } from "./en/index.ts";
import { hy } from "./hy/index.ts";
import type { Locale } from "./locales.ts";
import type { Messages } from "./types.ts";

export const messages: Record<Locale, Messages> = { en, hy };
