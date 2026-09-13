import { HolidayType, type Holiday } from "../gen/common/v1/office_pb.js";
import type { Messages } from "../i18n/types.ts";

export type CalendarCell = {
  day: number;
  year: number;
  month: number;
  inMonth: boolean;
  dateKey: string;
  weekend: boolean;
  key: string;
};

export type DayMarks = {
  holidays: Holiday[];
  memorialDays: Holiday[];
};

export function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function dateKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function isWeekend(year: number, month: number, day: number): boolean {
  const weekday = new Date(year, month - 1, day).getDay();
  return weekday === 0 || weekday === 6;
}

export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

export function yearsForCalendarView(year: number, month: number): number[] {
  const years = [year];
  if (month === 1) years.push(year - 1);
  if (month === 12) years.push(year + 1);
  return years;
}

export function buildCalendarCells(
  year: number,
  month: number,
): CalendarCell[] {
  const first = new Date(year, month - 1, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const prev = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const daysInPrev = new Date(year, month - 1, 0).getDate();

  const cells: CalendarCell[] = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    const day = daysInPrev - i;
    cells.push(
      makeCell(prev.year, prev.month, day, false, `prev-${day}`),
    );
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(makeCell(year, month, day, true, `cur-${day}`));
  }

  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push(
      makeCell(next.year, next.month, nextDay, false, `next-${nextDay}`),
    );
    nextDay += 1;
  }

  return cells;
}

function makeCell(
  year: number,
  month: number,
  day: number,
  inMonth: boolean,
  key: string,
): CalendarCell {
  return {
    day,
    year,
    month,
    inMonth,
    dateKey: dateKey(year, month, day),
    weekend: isWeekend(year, month, day),
    key,
  };
}

export function emptyDayMarks(): DayMarks {
  return { holidays: [], memorialDays: [] };
}

export function indexDayMarks(
  holidays: Holiday[],
  memorialDays: Holiday[],
): Map<string, DayMarks> {
  const map = new Map<string, DayMarks>();

  function add(
    item: Holiday,
    kind: "holidays" | "memorialDays",
  ) {
    const key = item.date.trim();
    if (!key) return;
    const entry = map.get(key) ?? emptyDayMarks();
    entry[kind].push(item);
    map.set(key, entry);
  }

  for (const holiday of holidays) add(holiday, "holidays");
  for (const memorial of memorialDays) add(memorial, "memorialDays");
  return map;
}

export function marksForDay(
  index: Map<string, DayMarks>,
  key: string,
): DayMarks {
  return index.get(key) ?? emptyDayMarks();
}

export function isNonWorkingDay(cell: CalendarCell, marks: DayMarks): boolean {
  return cell.weekend || marks.holidays.length > 0;
}

export function holidayTypeLabel(
  type: HolidayType,
  t: Messages,
): string | null {
  switch (type) {
    case HolidayType.PUBLIC:
      return t.schedule.holidayType.public;
    case HolidayType.BANK:
      return t.schedule.holidayType.bank;
    case HolidayType.SCHOOL:
      return t.schedule.holidayType.school;
    case HolidayType.AUTHORITIES:
      return t.schedule.holidayType.authorities;
    case HolidayType.OPTIONAL:
      return t.schedule.holidayType.optional;
    case HolidayType.OBSERVANCE:
      return t.schedule.holidayType.observance;
    default:
      return null;
  }
}
