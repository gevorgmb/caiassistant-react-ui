import { TodoListStatus } from "../gen/common/v1/office_pb.js";
import type { Messages } from "../i18n/types.ts";

export function todoListStatusLabel(
  status: TodoListStatus,
  t: Messages,
): string {
  switch (status) {
    case TodoListStatus.PENDING:
      return t.todoStatus.pending;
    case TodoListStatus.STARTED:
      return t.todoStatus.started;
    case TodoListStatus.PAUSED:
      return t.todoStatus.paused;
    case TodoListStatus.CANCELLED:
      return t.todoStatus.cancelled;
    case TodoListStatus.COMPLETED:
      return t.todoStatus.completed;
    default:
      return t.todoStatus.unspecified;
  }
}

export const EDITABLE_TODO_STATUSES: TodoListStatus[] = [
  TodoListStatus.PENDING,
  TodoListStatus.STARTED,
  TodoListStatus.PAUSED,
  TodoListStatus.CANCELLED,
  TodoListStatus.COMPLETED,
];
