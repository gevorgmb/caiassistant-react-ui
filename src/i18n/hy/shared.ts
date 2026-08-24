import type { Messages } from "../types.ts";

export const app: Messages["app"] = {
  title: "Clerk AI Assistant",
  signInSubtitle: "Մուտք գործեք՝ ձեր գրասենյակը կառավարելու համար",
};

export const language: Messages["language"] = {
  label: "Լեզու",
};

export const common: Messages["common"] = {
  save: "Պահպանել",
  saving: "Պահպանվում է…",
  cancel: "Չեղարկել",
  edit: "Խմբագրել",
  delete: "Ջնջել",
  create: "Ստեղծել",
  add: "Ավելացնել",
  back: "Հետ",
  dismiss: "Փակել",
  yes: "Այո",
  no: "Ոչ",
  empty: "—",
  user: "Օգտատեր",
  loading: "Բեռնվում է…",
  unexpectedError: "Անսպասելի սխալ",
  failedToSave: "Չհաջողվեց պահպանել",
  goToOffice: "Անցնել գրասենյակ",
  previous: "Նախորդ",
  next: "Հաջորդ",
  pageInfo: "Էջ {page} / {totalPages} (ընդամենը {totalCount})",
};

export const nav: Messages["nav"] = {
  main: "Հիմնական",
  aiAssistant: "ԱԲ Օգնական",
  schedule: "Ժամանակացույց",
  todoList: "Անելիքներ",
  office: "Գրասենյակ",
  users: "Օգտատերեր",
  positions: "Պաշտոններ",
  settings: "Կարգավորումներ",
};

export const header: Messages["header"] = {
  yourOffice: "Ձեր գրասենյակը՝",
  loadingOffice: "Գրասենյակը բեռնվում է…",
  notRelated: "Դուք կապված չեք որևէ գրասենյակի հետ։",
  createOne: "Ստեղծել",
  logOut: "Ելք",
  signingOut: "Ելք…",
};

export const auth: Messages["auth"] = {
  logIn: "Մուտք",
  register: "Գրանցում",
  createAccount: "Ստեղծել հաշիվ",
  name: "Անուն",
  email: "Էլ․ փոստ",
  password: "Գաղտնաբառ",
  showPassword: "Ցույց տալ գաղտնաբառը",
  hidePassword: "Թաքցնել գաղտնաբառը",
  working: "Խնդրում ենք սպասել…",
};

export const settings: Messages["settings"] = {
  title: "Կարգավորումներ",
  noProfile: "Այս նիստի համար օգտատիրոջ պրոֆիլ չկա։",
  userId: "Օգտատիրոջ ID",
  name: "Անուն",
  email: "Էլ․ փոստ",
  language: "Լեզու",
};
