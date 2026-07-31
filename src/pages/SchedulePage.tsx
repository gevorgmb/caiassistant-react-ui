import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { timestampDate } from "@bufbuild/protobuf/wkt";
import type { OfficeSchedule } from "../gen/common/v1/office_pb.js";
import { useAuth } from "../auth/AuthContext.tsx";
import { officeClient } from "../api/client.ts";
import { errorMessage } from "../api/errors.ts";
import {
  AddIcon,
  DeleteIcon,
  EditIcon,
  SpinnerIcon,
} from "../components/ActionIcons.tsx";
import { ScheduleModal } from "../components/ScheduleModal.tsx";
import "../styles/ui.css";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type CalendarCell = {
  day: number;
  inMonth: boolean;
  key: string;
};

type ModalState =
  | { mode: "create"; day: number }
  | { mode: "edit"; schedule: OfficeSchedule };

function buildCalendarCells(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month - 1, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPrev = new Date(year, month - 1, 0).getDate();

  const cells: CalendarCell[] = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    const day = daysInPrev - i;
    cells.push({
      day,
      inMonth: false,
      key: `prev-${day}`,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({
      day,
      inMonth: true,
      key: `cur-${day}`,
    });
  }

  let nextDay = 1;
  while (cells.length % 7 !== 0) {
    cells.push({
      day: nextDay,
      inMonth: false,
      key: `next-${nextDay}`,
    });
    nextDay += 1;
  }

  return cells;
}

function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const date = new Date(year, month - 1 + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() + 1 };
}

function formatMonthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleString(undefined, {
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
  const { office, officeLoading } = useAuth();
  const initial = useMemo(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  }, []);

  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [schedules, setSchedules] = useState<OfficeSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);

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
    () => formatMonthLabel(year, month),
    [year, month],
  );

  const load = useCallback(async () => {
    if (!office) {
      setSchedules([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await officeClient.listOfficeSchedules({
        officeId: office.id,
        year,
        month,
      });
      setSchedules(res.schedules);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [office, year, month]);

  useEffect(() => {
    void load();
  }, [load]);

  function goToMonth(nextYear: number, nextMonth: number) {
    setYear(nextYear);
    setMonth(nextMonth);
    setModal(null);
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
      return inView ? [...without, saved] : without;
    });
  }

  async function onDelete(schedule: OfficeSchedule) {
    if (!window.confirm(`Delete event "${schedule.name}"?`)) {
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

  const showMissingOffice = !officeLoading && !office;

  return (
    <section className="page page--wide">
      <div className="page-header">
        <h1>Schedule</h1>
      </div>

      {showMissingOffice ? (
        <p className="empty-state">
          You are not related to an office.{" "}
          <Link to="/office">Create one</Link> to manage the schedule.
        </p>
      ) : null}

      <nav className="calendar-nav" aria-label="Month">
        <button
          type="button"
          className="calendar-nav__item calendar-nav__item--side"
          onClick={() => goToMonth(prev.year, prev.month)}
        >
          {formatMonthLabel(prev.year, prev.month)}
        </button>
        <span className="calendar-nav__item calendar-nav__item--current">
          {monthLabel}
        </span>
        <button
          type="button"
          className="calendar-nav__item calendar-nav__item--side"
          onClick={() => goToMonth(next.year, next.month)}
        >
          {formatMonthLabel(next.year, next.month)}
        </button>
      </nav>

      {error ? <p className="error">{error}</p> : null}

      {office && loading ? (
        <p className="page-lede">Loading schedule…</p>
      ) : (
        <div className="calendar" role="grid" aria-label={monthLabel}>
          <div className="calendar__weekdays" role="row">
            {WEEKDAYS.map((label) => (
              <div key={label} className="calendar__weekday" role="columnheader">
                {label}
              </div>
            ))}
          </div>
          <div className="calendar__grid" role="rowgroup">
            {cells.map((cell) => {
              const events =
                office && cell.inMonth ? (byDay.get(cell.day) ?? []) : [];
              const canAdd =
                !!office &&
                cell.inMonth &&
                !isDayBeforeToday(year, month, cell.day);
              return (
                <div
                  key={cell.key}
                  className={
                    cell.inMonth
                      ? "calendar__day"
                      : "calendar__day calendar__day--muted"
                  }
                  role="gridcell"
                >
                  <div className="calendar__day-header">
                    <span className="calendar__day-num">{cell.day}</span>
                    {canAdd ? (
                      <button
                        type="button"
                        className="calendar__day-add"
                        aria-label={`Add event on day ${cell.day}`}
                        title="Add event"
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
                            title={schedule.name}
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
                              aria-label={`Edit ${schedule.name}`}
                              title="Edit"
                            >
                              <EditIcon />
                            </button>
                            <button
                              type="button"
                              className="btn btn--sm btn--danger btn--icon"
                              disabled={busyId === schedule.id}
                              onClick={() => void onDelete(schedule)}
                              aria-label={`Delete ${schedule.name}`}
                              title="Delete"
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

      {modal && office ? (
        <ScheduleModal
          officeId={office.id}
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
