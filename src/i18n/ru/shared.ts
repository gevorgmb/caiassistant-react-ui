import type { Messages } from "../types.ts";

export const app: Messages["app"] = {
  title: "Clerk AI Assistant",
  signInSubtitle: "Войдите, чтобы управлять офисом",
};

export const language: Messages["language"] = {
  label: "Язык",
};

export const common: Messages["common"] = {
  save: "Сохранить",
  saving: "Сохранение…",
  cancel: "Отмена",
  edit: "Изменить",
  delete: "Удалить",
  create: "Создать",
  add: "Добавить",
  back: "Назад",
  dismiss: "Закрыть",
  yes: "Да",
  no: "Нет",
  empty: "—",
  user: "Пользователь",
  loading: "Загрузка…",
  unexpectedError: "Неожиданная ошибка",
  failedToSave: "Не удалось сохранить",
  goToOffice: "Перейти в офис",
  previous: "Назад",
  next: "Далее",
  pageInfo: "Страница {page} из {totalPages} (всего {totalCount})",
};

export const nav: Messages["nav"] = {
  main: "Главная",
  aiAssistant: "ИИ-помощник",
  schedule: "Расписание",
  todoList: "Список задач",
  office: "Офис",
  users: "Пользователи",
  positions: "Должности",
  settings: "Настройки",
};

export const header: Messages["header"] = {
  yourOffice: "Ваш офис:",
  loadingOffice: "Загрузка офиса…",
  notRelated: "Вы не привязаны к офису.",
  createOne: "Создать",
  logOut: "Выйти",
  signingOut: "Выход…",
};

export const auth: Messages["auth"] = {
  logIn: "Войти",
  register: "Регистрация",
  createAccount: "Создать аккаунт",
  name: "Имя",
  email: "Эл. почта",
  password: "Пароль",
  showPassword: "Показать пароль",
  hidePassword: "Скрыть пароль",
  working: "Подождите…",
};

export const settings: Messages["settings"] = {
  title: "Настройки",
  noProfile: "Профиль пользователя недоступен для этой сессии.",
  userId: "ID пользователя",
  name: "Имя",
  email: "Эл. почта",
  language: "Язык",
};
