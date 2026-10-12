import type { HistoryPeriod, HistoryPeriodMode } from "../types";

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatMonth(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

export function startOfWeek(date: Date): Date {
  const start = startOfLocalDay(date);
  const day = start.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + mondayOffset);
  return start;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function addWeeks(date: Date, weeks: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + weeks * 7);
  return next;
}

export function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1);
}

export function resolveHistoryPeriod(mode: HistoryPeriodMode, anchorDate = new Date()): HistoryPeriod {
  if (mode === "week") {
    const start = startOfWeek(anchorDate);
    const end = addWeeks(start, 1);
    return {
      mode,
      start,
      end,
      label: `${formatDate(start)} - ${formatDate(new Date(end.getTime() - 1))}`,
    };
  }

  const start = startOfMonth(anchorDate);
  const end = addMonths(start, 1);
  return {
    mode,
    start,
    end,
    label: formatMonth(start),
  };
}

export function shiftHistoryPeriod(period: HistoryPeriod, offset: number): HistoryPeriod {
  const nextAnchor = period.mode === "week"
    ? addWeeks(period.start, offset)
    : addMonths(period.start, offset);
  return resolveHistoryPeriod(period.mode, nextAnchor);
}
