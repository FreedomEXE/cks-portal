/*-----------------------------------------------
  Property of CKS  (c) 2025
-----------------------------------------------*/
/**
 * File: CalendarProvider.tsx
 *
 * Description:
 * Feature-local calendar view state provider.
 *
 * Responsibilities:
 * - Hold the active agenda window size
 * - Expose calendar view state to child components
 *
 * Role in system:
 * - Wraps the read-only calendar tab content
 *
 * Notes:
 * - Kept local to avoid introducing global state for a simple feature
 */
/*-----------------------------------------------
  Manifested by Freedom_EXE
-----------------------------------------------*/
import { createContext, useContext, useState } from 'react';

export type CalendarView = 'agenda' | 'month' | 'week' | 'day';

export type CalendarRange = {
  start: string;
  end: string;
  label: string;
};

function startOfDay(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate(), 0, 0, 0, 0));
}

function addDays(value: Date, days: number): Date {
  const next = new Date(value.getTime());
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function startOfWeek(value: Date): Date {
  const normalized = startOfDay(value);
  const day = normalized.getUTCDay();
  const offset = day === 0 ? -6 : 1 - day;
  return addDays(normalized, offset);
}

function startOfMonth(value: Date): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), 1, 0, 0, 0, 0));
}

function shiftMonths(value: Date, amount: number): Date {
  return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth() + amount, 1, 0, 0, 0, 0));
}

function formatRangeLabel(start: Date, endExclusive: Date, view: CalendarView): string {
  if (view === 'day') {
    return start.toLocaleDateString('en-CA', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }
  if (view === 'month') {
    return start.toLocaleDateString('en-CA', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
  }
  const end = addDays(endExclusive, -1);
  const startText = start.toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
  const endText = end.toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return `${startText} - ${endText}`;
}

export function getCalendarRange(view: CalendarView, anchorDate: Date, days: number): CalendarRange {
  if (view === 'agenda') {
    const start = startOfDay(anchorDate);
    const end = addDays(start, days);
    return {
      start: start.toISOString(),
      end: end.toISOString(),
      label: formatRangeLabel(start, end, view),
    };
  }

  if (view === 'day') {
    const start = startOfDay(anchorDate);
    const end = addDays(start, 1);
    return {
      start: start.toISOString(),
      end: end.toISOString(),
      label: formatRangeLabel(start, end, view),
    };
  }

  if (view === 'week') {
    const start = startOfWeek(anchorDate);
    const end = addDays(start, 7);
    return {
      start: start.toISOString(),
      end: end.toISOString(),
      label: formatRangeLabel(start, end, view),
    };
  }

  const monthStart = startOfMonth(anchorDate);
  const gridStart = startOfWeek(monthStart);
  const gridEnd = addDays(gridStart, 42);
  return {
    start: gridStart.toISOString(),
    end: gridEnd.toISOString(),
    label: formatRangeLabel(monthStart, gridEnd, view),
  };
}

type CalendarContextValue = {
  days: number;
  setDays: (value: number) => void;
  view: CalendarView;
  setView: (value: CalendarView) => void;
  anchorDate: Date;
  setAnchorDate: (value: Date) => void;
  goToToday: () => void;
  shiftRange: (direction: -1 | 1) => void;
  focusDate: (value: Date, nextView?: CalendarView) => void;
};

const CalendarContext = createContext<CalendarContextValue | null>(null);

export function CalendarProvider({
  children,
  initialDays = 14,
  initialView = 'agenda',
}: {
  children: React.ReactNode;
  initialDays?: number;
  initialView?: CalendarView;
}) {
  const [days, setDays] = useState(initialDays);
  const [view, setView] = useState<CalendarView>(initialView);
  const [anchorDate, setAnchorDate] = useState(() => new Date());

  const value = {
    days,
    setDays,
    view,
    setView,
    anchorDate,
    setAnchorDate,
    goToToday: () => setAnchorDate(new Date()),
    shiftRange: (direction: -1 | 1) => {
      setAnchorDate((current) => {
        if (view === 'month') {
          return shiftMonths(current, direction);
        }
        if (view === 'week') {
          return addDays(current, direction * 7);
        }
        if (view === 'day') {
          return addDays(current, direction);
        }
        return addDays(current, direction * days);
      });
    },
    focusDate: (value: Date, nextView?: CalendarView) => {
      setAnchorDate(value);
      if (nextView) {
        setView(nextView);
      }
    },
  };

  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
}

export function useCalendarContext(): CalendarContextValue {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendarContext must be used within CalendarProvider');
  }
  return context;
}
