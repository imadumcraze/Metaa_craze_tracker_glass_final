import { useState, useEffect } from 'react';
import { ContentItem, ContentStatus, TeamTask } from '../types';
import { isAssignedTo } from './assignees';

export const DAILY_TASK_LIMIT = 5;

export const NON_WORKING_WEEKDAYS: number[] = [0]; // 0 = Sunday

export const DONE_STATUSES: readonly ContentStatus[] = [
  'Completed',
  'Pending Approval',
  'Approved',
  'Published'
] as const;

export const isDoneStatus = (status?: string): boolean => {
  return !!status && DONE_STATUSES.includes(status as ContentStatus);
};

/**
 * Formats a Date object to local YYYY-MM-DD string using LOCAL device components.
 */
export const toLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Converts an ISO date-time string to a local YYYY-MM-DD string.
 */
export const isoToLocalDateString = (isoString?: string): string => {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '';
  return toLocalDateString(d);
};

/**
 * Returns false when the LOCAL weekday of dateStr is in NON_WORKING_WEEKDAYS.
 */
export const isWorkingDay = (dateStr: string): boolean => {
  if (!dateStr) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return !NON_WORKING_WEEKDAYS.includes(date.getDay());
};

/**
 * If the date is not a working day, returns the next working day's date (e.g. Sunday becomes Monday).
 * Adds days in local time, never with UTC.
 */
export const effectiveDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  let current = new Date(y, m - 1, d);
  while (NON_WORKING_WEEKDAYS.includes(current.getDay())) {
    current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1);
  }
  return toLocalDateString(current);
};

export interface CompletionInfo {
  completedAt: string;
  completedById: string;
}

/**
 * Determines the new completedAt and completedById based on status transition:
 * - If newStatus is not a done status: returns { completedAt: '', completedById: '' } (cleared).
 * - If newStatus is done and oldStatus was not done: returns { completedAt: new Date().toISOString(), completedById: actorUid || '' }.
 * - Otherwise: keeps existing completedAt and completedById unchanged.
 */
export const computeCompletion = (
  oldItemOrFields?: { status?: string; completedAt?: string; completedById?: string },
  newStatus?: string,
  actorUid?: string
): CompletionInfo => {
  if (!newStatus || !isDoneStatus(newStatus)) {
    return { completedAt: '', completedById: '' };
  }
  if (!isDoneStatus(oldItemOrFields?.status)) {
    return {
      completedAt: new Date().toISOString(),
      completedById: actorUid || ''
    };
  }
  return {
    completedAt: oldItemOrFields?.completedAt ?? '',
    completedById: oldItemOrFields?.completedById ?? ''
  };
};

export interface DailyContentItem extends ContentItem {
  isOverdue: boolean;
  isDone: boolean;
}

export interface DailyAdminTask extends TeamTask {
  isOverdue: boolean;
}

export type UpcomingTaskRow =
  | { type: 'content'; item: ContentItem; isOverdue: boolean; isDone: boolean }
  | { type: 'admin'; task: TeamTask; isOverdue: boolean; isDone: boolean };

export interface UpcomingDateGroup {
  date: string;
  items: UpcomingTaskRow[];
}

export interface MemberTasksResult {
  todayContent: DailyContentItem[];
  todayAdmin: DailyAdminTask[];
  upcoming: UpcomingDateGroup[];
  counts: {
    total: number;
    done: number;
  };
  isDayOff: boolean;
}

export interface BuildMemberTasksParams {
  memberId: string;
  contentItems: ContentItem[];
  adminTasks: TeamTask[];
  today: string;
}

/**
 * Pure function task engine to calculate daily and upcoming tasks for a team member.
 */
export function buildMemberTasks({
  memberId,
  contentItems,
  adminTasks,
  today
}: BuildMemberTasksParams): MemberTasksResult {
  const isDayOff = !isWorkingDay(today);

  // 1. Eligible content items
  const eligible = contentItems.filter(
    (item) => isAssignedTo(item, memberId) && !!item.plannedDate && item.status !== 'On Hold'
  );

  // Admin tasks for this member
  const memberAdminTasks = adminTasks.filter((task) => task.assignedToId === memberId);

  // Calculate upcoming date range (next 14 days from today)
  const [tYear, tMonth, tDay] = today.split('-').map(Number);
  const maxDateObj = new Date(tYear, tMonth - 1, tDay);
  maxDateObj.setDate(maxDateObj.getDate() + 14);
  const maxUpcomingDate = toLocalDateString(maxDateObj);

  if (isDayOff) {
    // If today is NOT a working day:
    // return todayContent = [] and todayAdmin = [], return isDayOff: true,
    // and let `upcoming` contain ALL pending content items and not-done admin tasks,
    // grouped by effective date within the 14-day window (the first group will be Monday).
    // Never create an upcoming group for a non-working date.
    const nextWorkingDay = effectiveDate(today);

    const pending = eligible.filter((item) => !isDoneStatus(item.status));
    pending.sort((a, b) => {
      const effA = effectiveDate(a.plannedDate);
      const effB = effectiveDate(b.plannedDate);
      if (effA !== effB) {
        return effA.localeCompare(effB);
      }
      if (a.plannedDate !== b.plannedDate) {
        return a.plannedDate.localeCompare(b.plannedDate);
      }
      return (a.contentId || '').localeCompare(b.contentId || '');
    });

    const notDoneAdmin = memberAdminTasks.filter((t) => !t.done);
    notDoneAdmin.sort((a, b) => {
      const effA = effectiveDate(a.date);
      const effB = effectiveDate(b.date);
      if (effA !== effB) {
        return effA.localeCompare(effB);
      }
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return (a.createdAt || '').localeCompare(b.createdAt || '');
    });

    const dateMap = new Map<string, UpcomingTaskRow[]>();

    for (const item of pending) {
      const rawEff = effectiveDate(item.plannedDate);
      const targetDate = rawEff <= nextWorkingDay ? nextWorkingDay : rawEff;
      if (targetDate > today && targetDate <= maxUpcomingDate) {
        if (!dateMap.has(targetDate)) {
          dateMap.set(targetDate, []);
        }
        dateMap.get(targetDate)!.push({
          type: 'content',
          item,
          isOverdue: effectiveDate(item.plannedDate) < today,
          isDone: false
        });
      }
    }

    for (const task of notDoneAdmin) {
      const rawEff = effectiveDate(task.date);
      const targetDate = rawEff <= nextWorkingDay ? nextWorkingDay : rawEff;
      if (targetDate > today && targetDate <= maxUpcomingDate) {
        if (!dateMap.has(targetDate)) {
          dateMap.set(targetDate, []);
        }
        dateMap.get(targetDate)!.push({
          type: 'admin',
          task,
          isOverdue: effectiveDate(task.date) < today,
          isDone: false
        });
      }
    }

    const sortedDates = Array.from(dateMap.keys()).sort();
    const upcoming: UpcomingDateGroup[] = sortedDates.map((date) => ({
      date,
      items: dateMap.get(date)!
    }));

    return {
      todayContent: [],
      todayAdmin: [],
      upcoming,
      counts: { total: 0, done: 0 },
      isDayOff: true
    };
  }

  // --- Working Day Flow ---
  // 2. Done today: in a done status whose completedAt converted to local date equals today.
  // Exclude any item completed by another team member (completedById is non-empty and !== memberId).
  const doneToday = eligible.filter((item) => {
    if (!isDoneStatus(item.status)) return false;
    if (isoToLocalDateString(item.completedAt) !== today) return false;
    if (item.completedById && item.completedById !== memberId) {
      return false;
    }
    return true;
  });

  // 3. Pending: eligible items NOT in a done status, sorted by effectiveDate, plannedDate, contentId
  const pending = eligible.filter((item) => !isDoneStatus(item.status));
  pending.sort((a, b) => {
    const effA = effectiveDate(a.plannedDate);
    const effB = effectiveDate(b.plannedDate);
    if (effA !== effB) {
      return effA.localeCompare(effB);
    }
    if (a.plannedDate !== b.plannedDate) {
      return a.plannedDate.localeCompare(b.plannedDate);
    }
    return (a.contentId || '').localeCompare(b.contentId || '');
  });

  // 4. Slots available for pending content items today
  const slots = Math.max(0, DAILY_TASK_LIMIT - doneToday.length);

  // 5. Today's content deliverables
  const todayContentRaw = [...doneToday, ...pending.slice(0, slots)];
  todayContentRaw.sort((a, b) => {
    const effA = effectiveDate(a.plannedDate);
    const effB = effectiveDate(b.plannedDate);
    if (effA !== effB) {
      return effA.localeCompare(effB);
    }
    if (a.plannedDate !== b.plannedDate) {
      return a.plannedDate.localeCompare(b.plannedDate);
    }
    return (a.contentId || '').localeCompare(b.contentId || '');
  });

  const todayContent: DailyContentItem[] = todayContentRaw.map((item) => ({
    ...item,
    isOverdue: effectiveDate(item.plannedDate) < today,
    isDone: isDoneStatus(item.status)
  }));

  // Pending items past the daily slots within the next 14 days
  const upcomingContent = pending
    .slice(slots)
    .filter((item) => {
      const eff = effectiveDate(item.plannedDate);
      return eff > today && eff <= maxUpcomingDate;
    });

  // todayAdmin = tasks that are (not done AND effectiveDate <= today) OR (done AND doneAt local date === today)
  const todayAdminRaw = memberAdminTasks.filter((t) => {
    const effDate = effectiveDate(t.date);
    if (!t.done && effDate <= today) return true;
    if (t.done && t.doneAt && isoToLocalDateString(t.doneAt) === today) return true;
    return false;
  });

  todayAdminRaw.sort((a, b) => {
    const effA = effectiveDate(a.date);
    const effB = effectiveDate(b.date);
    if (effA !== effB) {
      return effA.localeCompare(effB);
    }
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return (a.createdAt || '').localeCompare(b.createdAt || '');
  });

  const todayAdmin: DailyAdminTask[] = todayAdminRaw.map((t) => ({
    ...t,
    isOverdue: !t.done && effectiveDate(t.date) < today
  }));

  // Admin tasks with effectiveDate > today and not done (within 14 days)
  const upcomingAdmin = memberAdminTasks.filter(
    (t) => !t.done && effectiveDate(t.date) > today && effectiveDate(t.date) <= maxUpcomingDate
  );

  // 8. Merge into upcoming date groups using effectiveDate (never creates group for non-working day)
  const dateMap = new Map<string, UpcomingTaskRow[]>();

  for (const item of upcomingContent) {
    const d = effectiveDate(item.plannedDate);
    if (!dateMap.has(d)) {
      dateMap.set(d, []);
    }
    dateMap.get(d)!.push({
      type: 'content',
      item,
      isOverdue: effectiveDate(item.plannedDate) < today,
      isDone: isDoneStatus(item.status)
    });
  }

  for (const task of upcomingAdmin) {
    const d = effectiveDate(task.date);
    if (!dateMap.has(d)) {
      dateMap.set(d, []);
    }
    dateMap.get(d)!.push({
      type: 'admin',
      task,
      isOverdue: false,
      isDone: task.done
    });
  }

  const sortedDates = Array.from(dateMap.keys()).sort();
  const upcoming: UpcomingDateGroup[] = sortedDates.map((date) => ({
    date,
    items: dateMap.get(date)!
  }));

  // 9. Counts over todayContent + todayAdmin
  const doneContentCount = todayContent.filter((i) => i.isDone).length;
  const doneAdminCount = todayAdmin.filter((t) => t.done).length;
  const counts = {
    total: todayContent.length + todayAdmin.length,
    done: doneContentCount + doneAdminCount
  };

  return {
    todayContent,
    todayAdmin,
    upcoming,
    counts,
    isDayOff: false
  };
}

/**
 * Hook providing today's local date in YYYY-MM-DD, refreshing every minute
 * so tasks roll over across midnight.
 */
export function useToday(): string {
  const [today, setToday] = useState<string>(() => toLocalDateString());

  useEffect(() => {
    const interval = setInterval(() => {
      const current = toLocalDateString();
      setToday((prev) => (prev !== current ? current : prev));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return today;
}
