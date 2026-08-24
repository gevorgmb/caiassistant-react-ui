export const DOCUMENT_TYPES = [
  "memo",
  "letter",
  "report",
  "policy",
  "notice",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const CHECK_FOCUSES = [
  "grammar",
  "tone",
  "completeness",
  "clarity",
] as const;
export type CheckFocus = (typeof CHECK_FOCUSES)[number];

export const EVENT_FOCUSES = ["both", "past", "planned"] as const;
export type EventFocus = (typeof EVENT_FOCUSES)[number];
