import type { Messages } from "../types.ts";

export const schedule: Messages["schedule"] = {
  title: "Расписание",
  missingOffice: "Вы не привязаны к офису.",
  createOne: "Создайте его",
  toManage: ", чтобы управлять расписанием.",
  monthNav: "Месяц",
  loading: "Загрузка расписания…",
  addEvent: "Добавить событие",
  addEventOnDay: "Добавить событие на {day}-е число",
  editEvent: "Редактировать событие",
  confirmDelete: "Удалить событие «{name}»?",
  name: "Название",
  dateTime: "Дата и время",
  description: "Описание",
  pastEventError: "События нельзя планировать раньше сегодняшнего дня.",
  weekdays: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"],
};
