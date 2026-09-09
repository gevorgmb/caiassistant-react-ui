import type { Messages } from "../types.ts";

export const todos: Messages["todos"] = {
  title: "Список задач",
  createTitle: "Создать задачу",
  editTitle: "Редактировать задачу",
  needOffice: "Сначала нужен офис, чтобы управлять задачами.",
  lede: "Задачи офиса {name}.",
  loading: "Загрузка задач…",
  empty: "Задач пока нет.",
  name: "Название",
  description: "Описание",
  status: "Статус",
  actions: "Действия",
  confirmDelete: "Удалить задачу «{name}»?",
  loadingTodo: "Загрузка задачи…",
};

export const todoStatus: Messages["todoStatus"] = {
  pending: "Ожидает",
  started: "Начата",
  paused: "Приостановлена",
  cancelled: "Отменена",
  completed: "Выполнена",
  unspecified: "Не указано",
};
