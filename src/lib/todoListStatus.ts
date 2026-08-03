import { TodoListStatus } from "../gen/common/v1/office_pb.js";

export function todoListStatusLabel(status: TodoListStatus): string {
  switch (status) {
    case TodoListStatus.PENDING:
      return "Pending";
    case TodoListStatus.STARTED:
      return "Started";
    case TodoListStatus.PAUSED:
      return "Paused";
    case TodoListStatus.CANCELLED:
      return "Cancelled";
    case TodoListStatus.COMPLETED:
      return "Completed";
    default:
      return "Unspecified";
  }
}

export const EDITABLE_TODO_STATUSES: {
  value: TodoListStatus;
  label: string;
}[] = [
  { value: TodoListStatus.PENDING, label: "Pending" },
  { value: TodoListStatus.STARTED, label: "Started" },
  { value: TodoListStatus.PAUSED, label: "Paused" },
  { value: TodoListStatus.CANCELLED, label: "Cancelled" },
  { value: TodoListStatus.COMPLETED, label: "Completed" },
];
