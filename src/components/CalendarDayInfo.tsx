import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Holiday } from "../gen/common/v1/office_pb.js";
import { useI18n } from "../i18n/I18nContext.tsx";
import { holidayTypeLabel } from "../lib/calendar.ts";
import { InfoIcon } from "./ActionIcons.tsx";

type CalendarDayInfoProps = {
  dateLabel: string;
  isWorking: boolean;
  holidays: Holiday[];
  memorialDays: Holiday[];
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
};

type PopoverPos = {
  top: number;
  left: number;
};

export function CalendarDayInfo({
  dateLabel,
  isWorking,
  holidays,
  memorialDays,
  open,
  onToggle,
  onClose,
}: CalendarDayInfoProps) {
  const { t } = useI18n();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<PopoverPos>({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open) return;

    function place() {
      const trigger = buttonRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const width = popoverRef.current?.offsetWidth ?? 260;
      const height = popoverRef.current?.offsetHeight ?? 0;
      const margin = 8;
      const left = Math.min(
        Math.max(margin, rect.left),
        window.innerWidth - width - margin,
      );
      const below = rect.bottom + 6;
      const top =
        below + height + margin > window.innerHeight
          ? Math.max(margin, rect.top - height - 6)
          : below;
      setPos({ top, left });
    }

    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open, holidays, memorialDays]);

  useEffect(() => {
    if (!open) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    function onPointer(event: MouseEvent) {
      const target = event.target as Node | null;
      if (!target) return;
      if (buttonRef.current?.contains(target)) return;
      if (popoverRef.current?.contains(target)) return;
      onClose();
    }

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open, onClose]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="calendar__day-info"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t.schedule.dayInfo}
        title={t.schedule.dayInfo}
        onClick={onToggle}
      >
        <InfoIcon />
      </button>
      {open
        ? createPortal(
            <div
              ref={popoverRef}
              className="calendar-day-popover"
              role="dialog"
              aria-label={t.schedule.dayInfo}
              style={{ top: pos.top, left: pos.left }}
            >
              <p className="calendar-day-popover__date">{dateLabel}</p>
              <p
                className={
                  isWorking
                    ? "calendar-day-popover__status calendar-day-popover__status--working"
                    : "calendar-day-popover__status calendar-day-popover__status--off"
                }
              >
                {isWorking
                  ? t.schedule.workingDay
                  : t.schedule.nonWorkingDay}
              </p>
              {holidays.length > 0 ? (
                <HolidayGroup
                  title={t.schedule.holidays}
                  items={holidays}
                />
              ) : null}
              {memorialDays.length > 0 ? (
                <HolidayGroup
                  title={t.schedule.memorialDays}
                  items={memorialDays}
                />
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function HolidayGroup({
  title,
  items,
}: {
  title: string;
  items: Holiday[];
}) {
  const { t } = useI18n();
  return (
    <section className="calendar-day-popover__group">
      <h3>{title}</h3>
      <ul>
        {items.map((item, index) => {
          const types = item.types
            .map((type) => holidayTypeLabel(type, t))
            .filter((label): label is string => Boolean(label));
          const scope = item.national
            ? t.schedule.national
            : item.subdivisionCodes.length > 0
              ? `${t.schedule.regional}: ${item.subdivisionCodes.join(", ")}`
              : t.schedule.regional;
          const meta = [scope, ...types].join(" · ");
          return (
            <li key={`${item.date}-${item.name}-${index}`}>
              <span className="calendar-day-popover__name">{item.name}</span>
              {meta ? (
                <span className="calendar-day-popover__meta">{meta}</span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
