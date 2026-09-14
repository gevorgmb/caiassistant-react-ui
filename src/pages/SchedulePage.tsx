import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { timestampDate } from "@bufbuild/protobuf/wkt";
import type { Holiday, OfficeSchedule } from "../gen/common/v1/office_pb.js";
import { useAuth } from "../auth/AuthContext.tsx";
import { officeClient } from "../api/client.ts";
import { errorMessage } from "../api/errors.ts";
import {
  AddIcon,
  DeleteIcon,
  EditIcon,
  SpinnerIcon,
} from "../components/ActionIcons.tsx";
import { CalendarDayInfo } from "../components/CalendarDayInfo.tsx";
import { ScheduleModal } from "../components/ScheduleModal.tsx";
import {
  OwnerFilterSelect,
  ownerLabel,
} from "../components/OwnerSelect.tsx";
import { useI18n } from "../i18n/I18nContext.tsx";
import {
  buildCalendarCells,
  indexDayMarks,
  isNonWorkingDay,
  marksForDay,
  shiftMonth,
  yearsForCalendarView,
  type DayMarks,
} from "../lib/calendar.ts";
import { suggestedCountryCode } from "../lib/countries.ts";
import {
  defaultCreateOfficeId,
  listByOwnerFilter,
  ownerMatches,
  type OwnerFilter,
} from "../lib/ownership.ts";
import "../styles/ui.css";

type ModalState =
  | { mode: "create"; day: number }
  | { mode: "edit"; schedule: OfficeSchedule };

function formatMonthLabel(
  year: number,
  month: number,
  localeTag: string,
): string {
  return new Date(year, month - 1, 1).toLocaleString(localeTag, {
    month: "long",
    year: "numeric",
  });
}

function formatDayLabel(
  year: number,
  month: number,
  day: number,
  localeTag: string,
): string {
  return new Date(year, month - 1, day).toLocaleDateString(localeTag, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function isDayBeforeToday(year: number, month: number, day: number): boolean {
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date < startOfToday();
}

function eventTimeMs(schedule: OfficeSchedule): number {
  if (!schedule.eventDate) return 0;
  return timestampDate(schedule.eventDate).getTime();
}

function dayKeyFromSchedule(schedule: OfficeSchedule): number | null {
  if (!schedule.eventDate) return null;
  return timestampDate(schedule.eventDate).getDate();
}

export function SchedulePage() {
  const { office, officeLoading, session } = useAuth();
  const { t, fmt, localeTag } = useI18n();
  const initial = useMemo(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }, []);

  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [schedules, setSchedules] = useState<OfficeSchedule[]>([]);
  const [dayMarks, setDayMarks] = useState<Map<string, DayMarks>>(
    () => new Map(),
  );
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);
  const [infoDate, setInfoDate] = useState<string | null>(null);
  const [ownerFilter, setOwnerFilter] = useState<OwnerFilter>("all");
  const holidayCache = useRef(
    new Map<string, { holidays: Holiday[]; memorialDays: Holiday[] }>(),
  );

  const country = useMemo(() => {
    const fromOffice = office?.country?.trim();
    if (fromOffice) return fromOffice.toUpperCase();
    return suggestedCountryCode(session?.user?.country);
  }, [office?.country, session?.user?.country]);

  const prev = useMemo(() => shiftMonth(year, month, -1), [year, month]);
  const next = useMemo(() => shiftMonth(year, month, 1), [year, month]);

  const cells = useMemo(() => buildCalendarCells(year, month), [year, month]);

  const byDay = useMemo(() => {
    const map = new Map<number, OfficeSchedule[]>();
    for (const schedule of schedules) {
      const day = dayKeyFromSchedule(schedule);
      if (day === null) continue;
      const list = map.get(day) ?? [];
      list.push(schedule);
      map.set(day, list);
    }
    for (const list of map.values()) {
      list.sort((a, b) => eventTimeMs(a) - eventTimeMs(b));
    }
    return map;
  }, [schedules]);

  const monthLabel = useMemo(
    () => formatMonthLabel(year, month, localeTag),
    [year, month, localeTag],
  );

  const load = useCallback(async () => {
    if (officeLoading) return;
    setLoading(true);
    setError(null);
    try {
      const listed = await listByOwnerFilter(
        ownerFilter,
        office?.id,
        async (officeId) => {
          const res = await officeClient.listOfficeSchedules({
            officeId,
            year,
            month,
          });
          return res.schedules;
        },
      );
      setSchedules(listed);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [office, officeLoading, ownerFilter, year, month]);

  const loadHolidays = useCallback(async () => {
    if (!country) {
      setDayMarks(new Map());
      return;
    }

    const years = yearsForCalendarView(year, month);
    try {
      const bundles = await Promise.all(
        years.map(async (holidayYear) => {
          const cacheKey = `${country}:${holidayYear}`;
          const cached = holidayCache.current.get(cacheKey);
          if (cached) return cached;
          const res = await officeClient.listHolidays({
            year: holidayYear,
            country,
          });
          const bundle = {
            holidays: res.holidays,
            memorialDays: res.memorialDays,
          };
          holidayCache.current.set(cacheKey, bundle);
          return bundle;
        }),
      );
      const holidays = bundles.flatMap((bundle) => bundle.holidays);
      const memorialDays = bundles.flatMap((bundle) => bundle.memorialDays);
      setDayMarks(indexDayMarks(holidays, memorialDays));
    } catch {
      setDayMarks(new Map());
    }
  }, [country, year, month]);

  useEffect(() => {
    holidayCache.current.clear();
  }, [country]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadHolidays();
  }, [loadHolidays]);

  useEffect(() => {
    if (!office && ownerFilter === "office") {
      setOwnerFilter("all");
    }
  }, [office, ownerFilter]);

  function goToMonth(nextYear: number, nextMonth: number) {
    setYear(nextYear);
    setMonth(nextMonth);
    setModal(null);
    setInfoDate(null);
  }

  function onSaved(saved: OfficeSchedule) {
    const inView =
      !!saved.eventDate &&
      (() => {
        const d = timestampDate(saved.eventDate!);
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      })();
    setSchedules((prevSchedules) => {
      const without = prevSchedules.filter((s) => s.id !== saved.id);
      if (!inView || !ownerMatches(saved.officeId, ownerFilter)) {
        return without;
      }
      return [...without, saved];
    });
  }

  async function onDelete(schedule: OfficeSchedule) {
    if (!window.confirm(fmt(t.schedule.confirmDelete, { name: schedule.name }))) {
      return;
    }
    setBusyId(schedule.id);
    setError(null);
    try {
      await officeClient.deleteOfficeSchedule({ id: schedule.id });
      setSchedules((prevSchedules) =>
        prevSchedules.filter((s) => s.id !== schedule.id),
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="page page--wide">
      <div className="page-header">
        <h1>{t.schedule.title}</h1>
      </div>

      <OwnerFilterSelect
        value={ownerFilter}
        onChange={setOwnerFilter}
        office={office}
        disabled={officeLoading}
      />

      <nav className="calendar-nav" aria-label={t.schedule.monthNav}>
        <button
          type="button"
          className="calendar-nav__item calendar-nav__item--side"
          onClick={() => goToMonth(prev.year, prev.month)}
        >
          {formatMonthLabel(prev.year, prev.month, localeTag)}
        </button>
        <span className="calendar-nav__item calendar-nav__item--current">
          {monthLabel}
        </span>
        <button
          type="button"
          className="calendar-nav__item calendar-nav__item--side"
          onClick={() => goToMonth(next.year, next.month)}
        >
          {formatMonthLabel(next.year, next.month, localeTag)}
        </button>
      </nav>

      <ul className="calendar-legend" aria-label={t.schedule.legend}>
        <li>
          <span className="calendar-legend__swatch calendar-legend__swatch--working" />
          {t.schedule.workingDay}
        </li>
        <li>
          <span className="calendar-legend__swatch calendar-legend__swatch--off" />
          {t.schedule.nonWorkingDay}
        </li>
      </ul>

      {error ? <p className="error">{error}</p> : null}

      {officeLoading || loading ? (
        <p className="page-lede">{t.schedule.loading}</p>
      ) : (
        <div className="calendar" role="grid" aria-label={monthLabel}>
          <div className="calendar__weekdays" role="row">
            {t.schedule.weekdays.map((label: string, index: number) => (
              <div
                key={label}
                className={
                  index >= 5
                    ? "calendar__weekday calendar__weekday--off"
                    : "calendar__weekday"
                }
                role="columnheader"
              >
                {label}
              </div>
            ))}
          </div>
          <div className="calendar__grid" role="rowgroup">
            {cells.map((cell) => {
              const events = cell.inMonth ? (byDay.get(cell.day) ?? []) : [];
              const marks = marksForDay(dayMarks, cell.dateKey);
              const nonWorking = isNonWorkingDay(cell, marks);
              const hasDayInfo =
                marks.holidays.length > 0 || marks.memorialDays.length > 0;
              const canAdd =
                cell.inMonth && !isDayBeforeToday(year, month, cell.day);
              const dayClass = [
                "calendar__day",
                cell.inMonth ? "" : "calendar__day--muted",
                nonWorking ? "calendar__day--off" : "calendar__day--working",
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <div key={cell.key} className={dayClass} role="gridcell">
                  <div className="calendar__day-header">
                    <div className="calendar__day-heading">
                      <span className="calendar__day-num">{cell.day}</span>
                      {hasDayInfo ? (
                        <CalendarDayInfo
                          dateLabel={formatDayLabel(
                            cell.year,
                            cell.month,
                            cell.day,
                            localeTag,
                          )}
                          isWorking={!nonWorking}
                          holidays={marks.holidays}
                          memorialDays={marks.memorialDays}
                          open={infoDate === cell.dateKey}
                          onToggle={() =>
                            setInfoDate((current) =>
                              current === cell.dateKey ? null : cell.dateKey,
                            )
                          }
                          onClose={() => setInfoDate(null)}
                        />
                      ) : null}
                    </div>
                    {canAdd ? (
                      <button
                        type="button"
                        className="calendar__day-add"
                        aria-label={fmt(t.schedule.addEventOnDay, {
                          day: cell.day,
                        })}
                        title={t.schedule.addEvent}
                        onClick={() =>
                          setModal({ mode: "create", day: cell.day })
                        }
                      >
                        <AddIcon />
                      </button>
                    ) : null}
                  </div>
                  {events.length > 0 ? (
                    <ul className="calendar__events">
                      {events.map((schedule) => (
                        <li key={schedule.id} className="calendar__event">
                          <span
                            className="calendar__event-name"
                            title={`${schedule.name} · ${ownerLabel(
                              schedule.officeId,
                              office,
                              t.common.personal,
                              t.nav.office,
                            )}`}
                          >
                            {schedule.name}
                          </span>
                          <div className="calendar__event-actions">
                            <button
                              type="button"
                              className="btn btn--sm btn--ghost btn--icon"
                              onClick={() =>
                                setModal({ mode: "edit", schedule })
                              }
                              aria-label={`${t.common.edit} ${schedule.name}`}
                              title={t.common.edit}
                            >
                              <EditIcon />
                            </button>
                            <button
                              type="button"
                              className="btn btn--sm btn--danger btn--icon"
                              disabled={busyId === schedule.id}
                              onClick={() => void onDelete(schedule)}
                              aria-label={`${t.common.delete} ${schedule.name}`}
                              title={t.common.delete}
                            >
                              {busyId === schedule.id ? (
                                <SpinnerIcon />
                              ) : (
                                <DeleteIcon />
                              )}
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {modal ? (
        <ScheduleModal
          office={office}
          defaultOfficeId={defaultCreateOfficeId(ownerFilter, office?.id)}
          officeLoading={officeLoading}
          day={modal.mode === "create" ? modal.day : null}
          year={year}
          month={month}
          schedule={modal.mode === "edit" ? modal.schedule : null}
          onClose={() => setModal(null)}
          onSaved={onSaved}
        />
      ) : null}
    </section>
  );
}
