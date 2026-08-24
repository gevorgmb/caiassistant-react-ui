import { assistant } from "./assistant.ts";
import { office, positions, roles, users } from "./office.ts";
import { schedule } from "./schedule.ts";
import {
  app,
  auth,
  common,
  header,
  language,
  nav,
  settings,
} from "./shared.ts";
import { todoStatus, todos } from "./todos.ts";

export const en = {
  app,
  language,
  common,
  nav,
  header,
  auth,
  settings,
  office,
  users,
  positions,
  todos,
  todoStatus,
  roles,
  schedule,
  assistant,
};

export type EnMessages = typeof en;
