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

type CalendarContextValue = {
  days: number;
  setDays: (value: number) => void;
};

const CalendarContext = createContext<CalendarContextValue | null>(null);

export function CalendarProvider({ children, initialDays = 14 }: { children: React.ReactNode; initialDays?: number }) {
  const [days, setDays] = useState(initialDays);
  const value = { days, setDays };
  return <CalendarContext.Provider value={value}>{children}</CalendarContext.Provider>;
}

export function useCalendarContext(): CalendarContextValue {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendarContext must be used within CalendarProvider');
  }
  return context;
}
