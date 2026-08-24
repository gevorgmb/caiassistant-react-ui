import type { Messages } from "../types.ts";

export const todos: Messages["todos"] = {
  title: "Անելիքներ",
  createTitle: "Ստեղծել անելիք",
  editTitle: "Խմբագրել անելիքը",
  needOffice: "Անելիքներ կառավարելու համար նախ պետք է գրասենյակ։",
  lede: "{name} գրասենյակի անելիքներ։",
  loading: "Անելիքները բեռնվում են…",
  empty: "Անելիքներ դեռ չկան։",
  name: "Անուն",
  description: "Նկարագրություն",
  status: "Կարգավիճակ",
  actions: "Գործողություններ",
  confirmDelete: "Ջնջե՞լ «{name}» անելիքը։",
  loadingTodo: "Անելիքը բեռնվում է…",
};

export const todoStatus: Messages["todoStatus"] = {
  pending: "Սպասում է",
  started: "Սկսված",
  paused: "Դադարեցված",
  cancelled: "Չեղարկված",
  completed: "Ավարտված",
  unspecified: "Չնշված",
};
