import type { Messages } from "../types.ts";

export const schedule: Messages["schedule"] = {
  title: "Ժամանակացույց",
  missingOffice: "Դուք կապված չեք որևէ գրասենյակի հետ։",
  createOne: "Ստեղծել",
  toManage: " ժամանակացույցը կառավարելու համար։",
  monthNav: "Ամիս",
  loading: "Ժամանակացույցը բեռնվում է…",
  addEvent: "Ավելացնել իրադարձություն",
  addEventOnDay: "Ավելացնել իրադարձություն {day}-ին",
  editEvent: "Խմբագրել իրադարձությունը",
  confirmDelete: "Ջնջե՞լ «{name}» իրադարձությունը։",
  name: "Անուն",
  dateTime: "Ամսաթիվ և ժամ",
  description: "Նկարագրություն",
  pastEventError: "Իրադարձությունները չեն կարող նշանակվել այսօրվանից շուտ։",
  weekdays: ["Երկ", "Երք", "Չրք", "Հնգ", "Ուր", "Շբթ", "Կիր"],
};
