import React, { useState } from 'react';
import { Client, MonthlyPackage, ContentItem } from '../types';
import { MONTH_NAMES, isContentOverdue } from '../lib/storage';
import { StatusBadge } from './StatusBadge';
import { isGraphicsType, isVideosType } from './DashboardView';
import {
  Building2,
  Calendar,
  ExternalLink,
  CheckCircle2,
  Clock,
  Sparkles,
  FileSpreadsheet,
  Image as ImageIcon,
  Film,
  Lock,
  Check,
  CalendarDays
} from 'lucide-react';

interface ClientPortalViewProps {
  client: Client;
  packages: MonthlyPackage[];
  contentItems: ContentItem[];
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (month: number, year: number) => void;
  onOpenReport: () => void;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  client,
  packages,
  contentItems,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onOpenReport
}) => {
  const [activeTab, setActiveTab] = useState<'tracker' | 'calendar'>('tracker');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const monthName = MONTH_NAMES[selectedMonth - 1];

  // Client's package for this month
  const pkg = packages.find(
    p => p.clientId === client.id && p.month === selectedMonth && p.year === selectedYear
  );

  // Client's items for this month
  const items = contentItems.filter(
    i => i.clientId === client.id && i.month === selectedMonth && i.year === selectedYear
  );

  // Scope & Calculations
  const totalScope = pkg ? pkg.totalDeliverables : items.length;
  const publishedCount = items.filter(i => i.status === 'Published').length;
  const completionPercent = totalScope > 0 ? ((publishedCount / totalScope) * 100).toFixed(1) : '0';

  // Graphics breakdown
  const graphicsScope = pkg
    ? pkg.graphicPostQty + pkg.specialDayPostQty + pkg.coverPhotoQty + pkg.otherQty
    : items.filter(i => isGraphicsType(i.contentType)).length;
  const graphicsPub = items.filter(i => isGraphicsType(i.contentType) && i.status === 'Published').length;
  const graphicsPercent = graphicsScope > 0 ? ((graphicsPub / graphicsScope) * 100).toFixed(0) : 0;

  // Videos breakdown
  const videosScope = pkg ? pkg.videoQty : items.filter(i => isVideosType(i.contentType)).length;
  const videosPub = items.filter(i => isVideosType(i.contentType) && i.status === 'Published').length;
  const videosPercent = videosScope > 0 ? ((videosPub / videosScope) * 100).toFixed(0) : 0;

  // Filtered items
  const filteredItems = items.filter(item => {
    if (filterType === 'Graphics' && !isGraphicsType(item.contentType)) return false;
    if (filterType === 'Videos' && !isVideosType(item.contentType)) return false;
    if (filterStatus !== 'All' && item.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Client Portal Banner */}
      <div className="relative overflow-hidden rounded-2xl glass border border-emerald-500/30 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Official Client Delivery Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {client.name}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {client.companyName ? `${client.companyName} • ` : ''}Managed by <strong>Metaa Craze Productions (Pvt) Ltd.</strong>
            </p>
            <p className="text-xs text-emerald-300/90 mt-2 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Private Client Access: You are only viewing your company's progress and deliverables.</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenReport}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-md shadow-amber-400/20 flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 stroke-[2.5]" />
              <span>Download Monthly Report (PDF)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dual Category Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Completion */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-emerald-400 transition-all duration-1000 ease-out"
                strokeDasharray={`${completionPercent}, 100`}
                strokeLinecap="round"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-sm font-extrabold text-white">{completionPercent}%</span>
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Overall Delivery
            </span>
            <div className="text-xl font-black text-white">
              <span className="text-emerald-400">{publishedCount}</span>
              <span className="text-slate-500 font-normal"> / {totalScope} Published</span>
            </div>
            <span className="text-xs text-slate-500">
              {totalScope - publishedCount} remaining for {monthName} {selectedYear}
            </span>
          </div>
        </div>

        {/* Graphics Category */}
        <div className="bg-slate-900 border border-cyan-500/20 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-cyan-300 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4 text-cyan-400" />
              <span>Graphics Category</span>
            </span>
            <span className="text-white font-extrabold">
              <span className="text-cyan-400">{graphicsPub}</span> / {graphicsScope} Published ({graphicsPercent}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
            <div
              style={{ width: `${Math.min(100, (graphicsPub / (graphicsScope || 1)) * 100)}%` }}
              className="bg-cyan-400 h-full rounded-full transition-all"
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Includes Graphic Posts, Special Day Greetings & Cover Photos
          </p>
        </div>

        {/* Videos Category */}
        <div className="bg-slate-900 border border-purple-500/20 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-purple-300 flex items-center gap-1.5">
              <Film className="w-4 h-4 text-purple-400" />
              <span>Videos Category</span>
            </span>
            <span className="text-white font-extrabold">
              <span className="text-purple-400">{videosPub}</span> / {videosScope} Published ({videosPercent}%)
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
            <div
              style={{ width: `${Math.min(100, (videosPub / (videosScope || 1)) * 100)}%` }}
              className="bg-purple-400 h-full rounded-full transition-all"
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Includes Video Reels, TikToks & Promotional Shorts
          </p>
        </div>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-semibold">Filter:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Categories</option>
            <option value="Graphics">Graphics Only</option>
            <option value="Videos">Videos Only</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="All">All Statuses</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Pending Approval">Pending Approval</option>
            <option value="Approved">Approved</option>
            <option value="Published">Published</option>
            <option value="On Hold">On Hold</option>
          </select>
        </div>

        <span className="text-slate-400">
          Showing <strong className="text-white">{filteredItems.length}</strong> items for {monthName} {selectedYear}
        </span>
      </div>

      {/* Deliverables Table (Client View: Read-Only, Clickable Live URLs) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <h2 className="font-bold text-white text-sm">
            Content Deliverables Schedule & Publishing Record
          </h2>
          <span className="text-xs text-slate-400">
            Client Portal Verified View
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider bg-slate-950/40">
                <th className="py-3 px-4 font-semibold">Content Item</th>
                <th className="py-3 px-4 font-semibold">Title / Description</th>
                <th className="py-3 px-4 font-semibold">Planned Date</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Published Date</th>
                <th className="py-3 px-4 font-semibold">Live Social Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No deliverables found matching filter.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                      <div>{item.displayNumber}</div>
                      <span className="text-[10px] font-mono text-slate-500">{item.contentType}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-200 max-w-sm">
                      <p className="font-medium line-clamp-2">{item.title}</p>
                      {item.remarks && (
                        <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 italic">
                          Note: {item.remarks}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap text-xs">
                      {item.plannedDate || 'Pending Schedule'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-xs">
                      {item.status === 'Published' && item.actualPublishedDate ? (
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>{item.actualPublishedDate}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 italic">Not Published</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-xs">
                      {item.postUrl ? (
                        <a
                          href={item.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-medium hover:underline max-w-[150px] truncate"
                        >
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">View Live Post</span>
                        </a>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
