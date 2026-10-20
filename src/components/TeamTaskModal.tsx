import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Plus, Trash2, Calendar, AlertCircle, CheckCircle2, Clock, Info } from 'lucide-react';
import { TeamMember, TeamTask } from '../types';
import { toLocalDateString, isWorkingDay } from '../lib/dailyTasks';

interface TeamTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMember | null;
  tasks: TeamTask[];
  onAddTask: (data: {
    assignedToId: string;
    assignedToName: string;
    title: string;
    notes?: string;
    date: string;
  }) => Promise<void> | void;
  onDeleteTask: (taskId: string) => Promise<void> | void;
}

export const TeamTaskModal: React.FC<TeamTaskModalProps> = ({
  isOpen,
  onClose,
  member,
  tasks,
  onAddTask,
  onDeleteTask
}) => {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(() => toLocalDateString());
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle('');
      setNotes('');
      setDate(toLocalDateString());
      setError(null);
    }
  }, [isOpen, member?.uid]);

  if (!isOpen || !member) return null;

  // Filter tasks for this member and sort: not-done first, then date ascending, then createdAt
  const memberTasks = tasks.filter((t) => t.assignedToId === member.uid);
  memberTasks.sort((a, b) => {
    if (a.done !== b.done) {
      return a.done ? 1 : -1;
    }
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please enter a task title.');
      return;
    }

    if (!date) {
      setError('Please select a date for this task.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onAddTask({
        assignedToId: member.uid,
        assignedToName: member.name,
        title: title.trim(),
        notes: notes.trim() || undefined,
        date
      });
      setTitle('');
      setNotes('');
      setDate(toLocalDateString());
    } catch (err: any) {
      setError(err.message || 'Failed to add task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Daily tasks for {member.name}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Assign extra tasks to @{member.username} ({member.roleTitle})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Add Task Form */}
          <form onSubmit={handleSubmit} className="space-y-4 bg-slate-950/60 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>Add New Daily Task</span>
            </h3>

            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Task Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Export 3 carousel slides for campaign"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional instructions, link or details..."
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Task Date (Local) *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
                {!isWorkingDay(date) && (
                  <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1 font-medium">
                    <Info className="w-3.5 h-3.5 shrink-0" />
                    <span>This is a day off. The task will appear on the next working day.</span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-md shadow-amber-400/20 disabled:opacity-50 shrink-0"
              >
                {isSubmitting ? 'Adding...' : 'Add task'}
              </button>
            </div>
          </form>

          {/* Existing Tasks List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Assigned Admin Tasks ({memberTasks.length})
              </h3>
              <span className="text-[11px] text-slate-500">
                {memberTasks.filter((t) => t.done).length} completed
              </span>
            </div>

            {memberTasks.length === 0 ? (
              <div className="p-6 text-center bg-slate-950/40 border border-slate-800 rounded-xl text-xs text-slate-500">
                No extra tasks assigned to {member.name} yet.
              </div>
            ) : (
              <div className="space-y-2">
                {memberTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-xl border transition-colors flex items-start justify-between gap-3 ${
                      task.done
                        ? 'bg-slate-950/40 border-slate-800/80 opacity-75'
                        : 'bg-slate-950/80 border-slate-800'
                    }`}
                  >
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm font-medium break-words ${
                            task.done ? 'line-through text-slate-400' : 'text-white'
                          }`}
                        >
                          {task.title}
                        </span>
                        {task.done ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Done</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <Clock className="w-3 h-3" />
                            <span>Pending</span>
                          </span>
                        )}
                      </div>

                      {task.notes && (
                        <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">
                          {task.notes}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>For: {task.date}</span>
                        </span>
                        {!isWorkingDay(task.date) && (
                          <span className="text-[10px] text-amber-400 font-medium flex items-center gap-1">
                            <Info className="w-3 h-3 shrink-0" />
                            <span>This is a day off. The task will appear on the next working day.</span>
                          </span>
                        )}
                        {task.done && task.doneAt && (
                          <span>
                            Done: {new Date(task.doneAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete task "${task.title}"?`)) {
                          onDeleteTask(task.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors shrink-0"
                      title="Delete task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
