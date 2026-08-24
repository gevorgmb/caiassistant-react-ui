import type { Messages } from "../types.ts";
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

export const hy: Messages = {
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
