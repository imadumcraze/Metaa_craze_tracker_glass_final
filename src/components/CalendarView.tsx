import React, { useState } from 'react';
import { ContentItem, Client, ContentStatus } from '../types';
import { MONTH_NAMES, isContentOverdue } from '../lib/storage';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  ThumbsUp,
  Clock,
  Sparkles,
  CircleDashed,
  PauseCircle,
  AlertTriangle,
  ExternalLink,
  Plus
} from 'lucide-react';

interface CalendarViewProps {
  contentItems: ContentItem[];
  clients: Client[];
  selectedMonth: number;
  selectedYear: number;
  currentRole?: 'admin' | 'viewer' | 'client';
  onSelectMonthYear: (month: number, year: number) => void;
  onEditItem: (item: ContentItem) => void;
  onAddItemForDate: (dateStr: string, clientId?: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  contentItems,
  clients,
  selectedMonth,
  selectedYear,
  currentRole = 'admin',
  onSelectMonthYear,
  onEditItem,
  onAddItemForDate
}) => {
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedDayModal, setSelectedDayModal] = useState<string | null>(null);

  const monthName = MONTH_NAMES[selectedMonth - 1];

  // Calendar math for selectedMonth and selectedYear
  const firstDayOfMonth = new Date(selectedYear, selectedMonth - 1, 1);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 is Sunday
  const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();

  // Filter content items with plannedDate in this month & year
  const monthItems = contentItems.filter(item => {
    if (selectedClientId && item.clientId !== selectedClientId) return false;
    if (!item.plannedDate) return false;
    const parts = item.plannedDate.split('-');
    if (parts.length < 3) return false;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    return y === selectedYear && m === selectedMonth;
  });

  // Group items by day (1..31)
  const itemsByDay: Record<number, ContentItem[]> = {};
  monthItems.forEach(item => {
    const day = parseInt(item.plannedDate.split('-')[2], 10);
    if (!itemsByDay[day]) itemsByDay[day] = [];
    itemsByDay[day].push(item);
  });

  const getStatusColor = (status: ContentStatus, isOverdue: boolean) => {
    if (isOverdue && status !== 'Published') {
      return 'bg-red-500/20 text-red-300 border-red-500/40';
    }
    switch (status) {
      case 'Published':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'Approved':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Pending Approval':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'In Progress':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'On Hold':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'Not Started':
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-amber-400" />
            <span>Content Publishing Calendar</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Visual publishing schedule for <strong className="text-white">{monthName} {selectedYear}</strong>
          </p>
        </div>

        {/* Client Filter */}
        <div className="flex items-center gap-3">
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
          >
            <option value="">All Clients ({clients.length})</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status Legend */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300">
        <span className="font-semibold text-slate-400">Legend:</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span>Published</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
          <span>Approved</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span>Pending Approval</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
          <span>In Progress</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
          <span>On Hold</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span>Overdue</span>
        </span>
      </div>

      {/* Calendar Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {/* Days of week header */}
        <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-950/70 text-center text-xs font-bold text-slate-400 uppercase tracking-wider py-3">
          {dayNames.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Calendar Day Cells */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-800/80 bg-slate-950/20">
          {/* Empty cells before month start */}
          {Array.from({ length: startingDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[110px] p-2 bg-slate-950/40 opacity-30" />
          ))}

          {/* Days of the month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const items = itemsByDay[dayNum] || [];
            const dateStr = `${selectedYear}-${selectedMonth < 10 ? '0' + selectedMonth : selectedMonth}-${dayNum < 10 ? '0' + dayNum : dayNum}`;

            const isToday =
              selectedYear === 2026 && selectedMonth === 9 && dayNum === 29;

            return (
              <div
                key={dayNum}
                className={`min-h-[110px] p-2 transition-colors flex flex-col justify-between group hover:bg-slate-800/30 ${
                  isToday ? 'bg-amber-400/5 ring-1 ring-inset ring-amber-400/30' : ''
                }`}
              >
                {/* Day Header */}
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday
                        ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                        : 'text-slate-300'
                    }`}
                  >
                    {dayNum}
                  </span>

                  {currentRole === 'admin' && (
                    <button
                      onClick={() => onAddItemForDate(dateStr, selectedClientId || undefined)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-opacity"
                      title={`Add post planned for ${dateStr}`}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Day's Content Items */}
                <div className="space-y-1 overflow-y-auto max-h-[85px] scrollbar-none">
                  {items.map((item) => {
                    const client = clients.find(c => c.id === item.clientId);
                    const isOverdue = isContentOverdue(item);
                    const colorClasses = getStatusColor(item.status, isOverdue);

                    return (
                      <div
                        key={item.id}
                        onClick={() => onEditItem(item)}
                        className={`px-1.5 py-1 rounded-md text-[11px] border font-medium cursor-pointer transition-all hover:scale-[1.02] ${colorClasses}`}
                        title={`${client?.name}: ${item.displayNumber} - ${item.title} (${item.status})`}
                      >
                        <div className="flex items-center justify-between gap-1 leading-tight">
                          <span className="font-bold truncate">{client?.name}</span>
                          <span className="text-[9px] shrink-0 font-mono opacity-80">
                            {item.status === 'Published' ? '✓' : ''}
                          </span>
                        </div>
                        <div className="text-[10px] truncate opacity-90">
                          {item.displayNumber}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {items.length === 0 && (
                  <div className="h-4" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
