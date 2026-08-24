import { useEffect, useState, type SubmitEvent } from "react";
import { timestampDate, timestampFromDate } from "@bufbuild/protobuf/wkt";
import type { OfficeSchedule } from "../gen/common/v1/office_pb.js";
import { officeClient } from "../api/client.ts";
import { errorMessage } from "../api/errors.ts";
import { useI18n } from "../i18n/I18nContext.tsx";
import "../styles/ui.css";

function toLocalInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function minDateTimeLocal(): string {
  return toLocalInputValue(startOfToday());
}

function defaultDateForDay(year: number, month: number, day: number): Date {
  const now = new Date();
  const candidate = new Date(
    year,
    month - 1,
    day,
    now.getHours(),
    now.getMinutes(),
    0,
    0,
  );
  const today = startOfToday();
  if (candidate < today) {
    return new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      now.getHours(),
      now.getMinutes(),
      0,
      0,
    );
  }
  return candidate;
}

type ScheduleModalProps = {
  officeId: string;
  /** Preselected calendar day for create. Ignored when editing. */
  day: number | null;
  year: number;
  month: number;
  schedule: OfficeSchedule | null;
  onClose: () => void;
  onSaved: (schedule: OfficeSchedule) => void;
};

export function ScheduleModal({
  officeId,
  day,
  year,
  month,
  schedule,
  onClose,
  onSaved,
}: ScheduleModalProps) {
  const { t } = useI18n();
  const isCreate = schedule === null;
  const minLocal = minDateTimeLocal();
  const [name, setName] = useState(schedule?.name ?? "");
  const [description, setDescription] = useState(
    schedule?.description ?? "",
  );
  const [eventLocal, setEventLocal] = useState(() => {
    if (schedule?.eventDate) {
      return toLocalInputValue(timestampDate(schedule.eventDate));
    }
    if (day !== null) {
      return toLocalInputValue(defaultDateForDay(year, month, day));
    }
    return toLocalInputValue(new Date());
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function onSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const trimmed = name.trim();
      const selected = new Date(eventLocal);
      const today = startOfToday();
      if (selected < today) {
        setError(t.schedule.pastEventError);
        setBusy(false);
        return;
      }
      const eventDate = timestampFromDate(selected);
      const desc = description.trim() || undefined;
      const saved = isCreate
        ? await officeClient.createOfficeSchedule({
            officeId,
            name: trimmed,
            description: desc,
            eventDate,
          })
        : await officeClient.updateOfficeSchedule({
            id: schedule.id,
            name: trimmed,
            description: desc,
            eventDate,
          });
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-modal-title"
      >
        <h2 id="schedule-modal-title">
          {isCreate ? t.schedule.addEvent : t.schedule.editEvent}
        </h2>
        <form className="stack-form" onSubmit={onSubmit}>
          <label>
            {t.schedule.name}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </label>
          <label>
            {t.schedule.dateTime}
            <input
              type="datetime-local"
              value={eventLocal}
              min={minLocal}
              onChange={(e) => setEventLocal(e.target.value)}
              required
            />
          </label>
          <label>
            {t.schedule.description}
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          {error ? <p className="error">{error}</p> : null}
          <div className="modal__actions">
            <button
              type="button"
              className="btn btn--ghost"
              disabled={busy}
              onClick={onClose}
            >
              {t.common.cancel}
            </button>
            <button type="submit" className="btn" disabled={busy}>
              {busy ? t.common.saving : t.common.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
