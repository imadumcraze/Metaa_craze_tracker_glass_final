import React, { useState } from 'react';
import {
  CheckSquare,
  CheckCircle2,
  Circle,
  Calendar,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ClipboardList
} from 'lucide-react';
import { TeamMember, ContentItem, Client, TeamTask } from '../types';
import { buildMemberTasks, useToday, DailyContentItem, DailyAdminTask, UpcomingTaskRow } from '../lib/dailyTasks';
import { StatusBadge } from './StatusBadge';

interface MyTasksPanelProps {
  currentTeamMember: TeamMember;
  contentItems: ContentItem[];
  clients: Client[];
  teamTasks: TeamTask[];
  onOpenTask: (item: ContentItem) => void;
  onToggleTaskDone: (taskId: string, done: boolean) => void;
}

export const MyTasksPanel: React.FC<MyTasksPanelProps> = ({
  currentTeamMember,
  contentItems,
  clients,
  teamTasks,
  onOpenTask,
  onToggleTaskDone
}) => {
  const today = useToday();
  const [isUpcomingOpen, setIsUpcomingOpen] = useState(true);

  const { todayContent, todayAdmin, upcoming, counts, isDayOff } = buildMemberTasks({
    memberId: currentTeamMember.uid,
    contentItems,
    adminTasks: teamTasks,
    today
  });

  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId);
    return client?.name || client?.companyName || 'Client';
  };

  // Format header date (e.g. "Friday, Oct 9, 2026")
  const formatHeaderDate = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Format weekday name for day off message (e.g. "Sunday")
  const getTodayWeekdayName = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString(undefined, { weekday: 'long' });
    } catch {
      return 'Sunday';
    }
  };

  // Format upcoming group date (e.g. "Monday, Oct 12")
  const formatUpcomingDateHeading = (dateStr: string) => {
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const totalUpcomingItems = upcoming.reduce((acc, g) => acc + g.items.length, 0);
  const progressPercent = counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0;
  const isTotallyEmpty = !isDayOff && todayContent.length === 0 && todayAdmin.length === 0 && upcoming.length === 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 mb-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>My Tasks</span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {formatHeaderDate(today)}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Display (Hidden on non-working day) */}
        {!isDayOff ? (
          <div className="flex flex-col sm:items-end gap-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-slate-400">Today's Progress:</span>
              <span className="text-white font-bold">
                {counts.done} of {counts.total} done
              </span>
              <span className="text-amber-400">({progressPercent}%)</span>
            </div>
            <div className="w-full sm:w-48 h-2 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
              Day Off
            </span>
          </div>
        )}
      </div>

      {/* Empty State */}
      {isTotallyEmpty ? (
        <div className="p-8 text-center bg-slate-950/40 border border-slate-800 rounded-xl space-y-2">
          <ClipboardList className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-medium text-slate-300">
            No tasks assigned yet. Ask the admin to assign content to you.
          </p>
          <p className="text-xs text-slate-500">
            Content deliverables and daily assignments will appear here once scheduled.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Today's Section or Calm Day-Off Card */}
          {isDayOff ? (
            <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-slate-200">
                {getTodayWeekdayName(today)}: day off. No daily tasks today. Anything unfinished moves to the next working day.
              </p>
              <p className="text-xs text-slate-500">
                Check below for the next working day's scheduled deliverables.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <span>Today's Tasks</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/15 text-amber-400 border border-amber-400/30">
                    {todayContent.length + todayAdmin.length}
                  </span>
                </h3>
              </div>

              {todayContent.length === 0 && todayAdmin.length === 0 ? (
                <div className="p-4 text-center bg-slate-950/40 border border-slate-800 rounded-xl text-xs text-slate-500">
                  No tasks scheduled for today. Check upcoming tasks below!
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Content Rows */}
                  {todayContent.map((item) => {
                    const clientName = getClientName(item.clientId);
                    return (
                      <div
                        key={`content-${item.id}`}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          item.isDone
                            ? 'bg-slate-950/40 border-slate-800/80 opacity-65'
                            : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                          {item.isDone ? (
                            <div className="mt-0.5 sm:mt-0 p-0.5 rounded-full text-teal-400 bg-teal-500/10 shrink-0">
                              <CheckCircle2 className="w-4 h-4 text-teal-400" />
                            </div>
                          ) : (
                            <div className="mt-0.5 sm:mt-0 p-0.5 text-slate-500 shrink-0">
                              <Circle className="w-4 h-4" />
                            </div>
                          )}

                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-bold text-amber-400">
                                {item.displayNumber}
                              </span>
                              <span className="font-semibold text-sm text-white break-words">
                                {item.title || '(Untitled Deliverable)'}
                              </span>
                              {item.isOverdue && !item.isDone && (
                                <span
                                  title="Carried over from a previous planned date"
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 shrink-0"
                                >
                                  <AlertTriangle className="w-2.5 h-2.5" />
                                  Carried over
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                              <span className="text-slate-300 font-medium">{clientName}</span>
                              <span className="text-slate-600">·</span>
                              <span className="flex items-center gap-1 text-slate-400">
                                <Calendar className="w-3 h-3 text-slate-500" />
                                <span>{item.plannedDate}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                          <StatusBadge status={item.status} size="sm" />
                          <button
                            onClick={() => onOpenTask(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Open in Content Tracker"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Admin Tasks Rows */}
                  {todayAdmin.map((task) => (
                    <div
                      key={`admin-${task.id}`}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        task.done
                          ? 'bg-slate-950/40 border-slate-800/80 opacity-65'
                          : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                        <div className="mt-0.5 sm:mt-0 flex items-center justify-center shrink-0">
                          <input
                            type="checkbox"
                            checked={task.done}
                            onChange={(e) => onToggleTaskDone(task.id, e.target.checked)}
                            className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-amber-500"
                          />
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30 shrink-0">
                              From admin
                            </span>
                            <span
                              className={`font-semibold text-sm break-words ${
                                task.done ? 'line-through text-slate-400' : 'text-white'
                              }`}
                            >
                              {task.title}
                            </span>
                            {task.done && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/15 text-teal-400 border border-teal-500/30">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                Done
                              </span>
                            )}
                          </div>

                          {task.notes && (
                            <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">
                              {task.notes}
                            </p>
                          )}

                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              <span>Date: {task.date}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Upcoming Section (Collapsible, Default Open) */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsUpcomingOpen((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider py-1 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-2">
                <span>Upcoming Tasks</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                  {totalUpcomingItems}
                </span>
              </div>
              {isUpcomingOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </button>

            {isUpcomingOpen && (
              upcoming.length === 0 ? (
                <div className="p-4 text-center bg-slate-950/40 border border-slate-800 rounded-xl text-xs text-slate-500">
                  No upcoming tasks in the next 14 days.
                </div>
              ) : (
                <div className="space-y-4 pt-1">
                  {upcoming.map((group) => (
                    <div key={group.date} className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-amber-400/90 pl-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                          {formatUpcomingDateHeading(group.date)} ({group.date})
                        </span>
                      </div>

                      <div className="space-y-2">
                        {group.items.map((rowItem, idx) => {
                          if (rowItem.type === 'content') {
                            const item = rowItem.item;
                            const clientName = getClientName(item.clientId);
                            return (
                              <div
                                key={`upcoming-content-${item.id}-${idx}`}
                                className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                              >
                                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                                  <div className="mt-0.5 sm:mt-0 p-0.5 text-slate-500 shrink-0">
                                    <Circle className="w-4 h-4" />
                                  </div>

                                  <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="font-mono text-xs font-bold text-amber-400">
                                        {item.displayNumber}
                                      </span>
                                      <span className="font-semibold text-sm text-white break-words">
                                        {item.title || '(Untitled Deliverable)'}
                                      </span>
                                      {rowItem.isOverdue && (
                                        <span
                                          title="Carried over from a previous planned date"
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30 shrink-0"
                                        >
                                          <AlertTriangle className="w-2.5 h-2.5" />
                                          Carried over
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                                      <span className="text-slate-300 font-medium">
                                        {clientName}
                                      </span>
                                      <span className="text-slate-600">·</span>
                                      <span className="flex items-center gap-1 text-slate-400">
                                        <Calendar className="w-3 h-3 text-slate-500" />
                                        <span>{item.plannedDate}</span>
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                                  <StatusBadge status={item.status} size="sm" />
                                  <button
                                    onClick={() => onOpenTask(item)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                    title="Open in Content Tracker"
                                  >
                                    <ArrowRight className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          } else {
                            const task = rowItem.task;
                            const isDisabled = group.date > today;
                            return (
                              <div
                                key={`upcoming-admin-${task.id}-${idx}`}
                                className="p-3.5 rounded-xl border border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                              >
                                <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                                  <div className="mt-0.5 sm:mt-0 flex items-center justify-center shrink-0">
                                    <input
                                      type="checkbox"
                                      checked={task.done}
                                      disabled={isDisabled}
                                      onChange={(e) => onToggleTaskDone(task.id, e.target.checked)}
                                      title={
                                        isDisabled
                                          ? 'Task can only be marked done on or after its scheduled date'
                                          : 'Mark task as done'
                                      }
                                      className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-0 focus:ring-offset-0 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer accent-amber-500"
                                    />
                                  </div>

                                  <div className="min-w-0 flex-1 space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30 shrink-0">
                                        From admin
                                      </span>
                                      <span className="font-semibold text-sm text-white break-words">
                                        {task.title}
                                      </span>
                                      {isDisabled && (
                                        <span className="text-[10px] text-slate-500 italic">
                                          (Available on {group.date})
                                        </span>
                                      )}
                                    </div>

                                    {task.notes && (
                                      <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">
                                        {task.notes}
                                      </p>
                                    )}

                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3 text-slate-500" />
                                        <span>Date: {task.date}</span>
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
};
