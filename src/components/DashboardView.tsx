import React, { useState } from 'react';
import { Client, MonthlyPackage, ContentItem, TabType, ContentType } from '../types';
import { MONTH_NAMES, isContentOverdue } from '../lib/storage';
import { StatusBadge } from './StatusBadge';
import {
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  ThumbsUp,
  CircleDashed,
  PauseCircle,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Calendar,
  ExternalLink,
  Image as ImageIcon,
  Film,
  Layers,
  ChevronRight
} from 'lucide-react';

interface DashboardViewProps {
  selectedMonth: number;
  selectedYear: number;
  clients: Client[];
  packages: MonthlyPackage[];
  contentItems: ContentItem[];
  onNavigateTab: (tab: TabType, clientIdFilter?: string) => void;
  onOpenReportForClient: (clientId: string) => void;
}

export const isGraphicsType = (type: ContentType): boolean => {
  return type === 'Graphic Post' || type === 'Special Day Post' || type === 'Cover Photo' || type === 'Other';
};

export const isVideosType = (type: ContentType): boolean => {
  return type === 'Video';
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  selectedMonth,
  selectedYear,
  clients,
  packages,
  contentItems,
  onNavigateTab,
  onOpenReportForClient
}) => {
  const [activeCategoryTab, setActiveCategoryTab] = useState<'All' | 'Graphics' | 'Videos'>('All');

  const monthName = MONTH_NAMES[selectedMonth - 1];

  // Active clients
  const activeClients = clients.filter(c => c.status === 'Active');
  const activeClientIds = new Set(activeClients.map(c => c.id));

  // Filter content items for selected month and year, only for active clients
  const monthContent = contentItems.filter(
    item => item.month === selectedMonth && item.year === selectedYear && activeClientIds.has(item.clientId)
  );

  // Filter packages for selected month and year
  const monthPackages = packages.filter(
    pkg => pkg.month === selectedMonth && pkg.year === selectedYear && activeClientIds.has(pkg.clientId)
  );

  // ==========================================
  // 1. COMBINED OVERALL METRICS
  // ==========================================
  const totalAgreedDeliverables = monthPackages.reduce((acc, p) => acc + p.totalDeliverables, 0) || monthContent.length;
  const overallPublished = monthContent.filter(i => i.status === 'Published').length;
  const overallCompletionPercentage = totalAgreedDeliverables > 0
    ? ((overallPublished / totalAgreedDeliverables) * 100).toFixed(1)
    : '0.0';

  // ==========================================
  // 2. CATEGORY 1: "GRAPHICS"
  // (Graphic Posts, Special Day Posts, Cover Photos, Other)
  // ==========================================
  const totalAgreedGraphics = monthPackages.reduce(
    (acc, p) => acc + (p.graphicPostQty + p.specialDayPostQty + p.coverPhotoQty + p.otherQty),
    0
  ) || monthContent.filter(i => isGraphicsType(i.contentType)).length;

  const graphicsItems = monthContent.filter(i => isGraphicsType(i.contentType));
  const graphicsPublished = graphicsItems.filter(i => i.status === 'Published').length;
  const graphicsApproved = graphicsItems.filter(i => i.status === 'Approved').length;
  const graphicsPending = graphicsItems.filter(i => i.status === 'Pending Approval').length;
  const graphicsInProgress = graphicsItems.filter(i => i.status === 'In Progress').length;
  const graphicsNotStarted = graphicsItems.filter(i => i.status === 'Not Started').length;
  const graphicsOnHold = graphicsItems.filter(i => i.status === 'On Hold').length;
  const graphicsOverdue = graphicsItems.filter(i => isContentOverdue(i)).length;
  const graphicsRemaining = Math.max(0, totalAgreedGraphics - graphicsPublished);
  const graphicsPercent = totalAgreedGraphics > 0
    ? ((graphicsPublished / totalAgreedGraphics) * 100).toFixed(1)
    : '0.0';

  // ==========================================
  // 3. CATEGORY 2: "VIDEOS"
  // (Videos / Reels / TikToks)
  // ==========================================
  const totalAgreedVideos = monthPackages.reduce(
    (acc, p) => acc + p.videoQty,
    0
  ) || monthContent.filter(i => isVideosType(i.contentType)).length;

  const videoItems = monthContent.filter(i => isVideosType(i.contentType));
  const videosPublished = videoItems.filter(i => i.status === 'Published').length;
  const videosApproved = videoItems.filter(i => i.status === 'Approved').length;
  const videosPending = videoItems.filter(i => i.status === 'Pending Approval').length;
  const videosInProgress = videoItems.filter(i => i.status === 'In Progress').length;
  const videosNotStarted = videoItems.filter(i => i.status === 'Not Started').length;
  const videosOnHold = videoItems.filter(i => i.status === 'On Hold').length;
  const videosOverdue = videoItems.filter(i => isContentOverdue(i)).length;
  const videosRemaining = Math.max(0, totalAgreedVideos - videosPublished);
  const videosPercent = totalAgreedVideos > 0
    ? ((videosPublished / totalAgreedVideos) * 100).toFixed(1)
    : '0.0';

  // Combined Overdue count
  const overdueItems = monthContent.filter(i => isContentOverdue(i));
  const overdueCount = overdueItems.length;

  return (
    <div className="space-y-6">
      {/* Dashboard Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Agency Overview & Progress Tracking</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Metaa Craze Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Production pipeline for <strong className="text-white font-semibold">{monthName} {selectedYear}</strong> across{' '}
              <strong className="text-amber-400 font-semibold">{activeClients.length} Active Clients</strong>.
            </p>
            <div className="mt-3 flex items-center gap-3 text-xs text-slate-300">
              <span className="bg-slate-950/70 px-2.5 py-1 rounded-lg border border-slate-800">
                Total Scope: <strong className="text-white">{totalAgreedDeliverables} Items</strong>
              </span>
              <span className="bg-slate-950/70 px-2.5 py-1 rounded-lg border border-slate-800">
                Total Published: <strong className="text-emerald-400">{overallPublished}</strong> ({overallCompletionPercentage}%)
              </span>
            </div>
          </div>

          {/* DUAL CATEGORY SEPARATE SUMMARY CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 shrink-0">
            {/* 1. GRAPHICS Category Card */}
            <div className="bg-slate-950/90 border border-cyan-500/30 p-4 rounded-2xl flex items-center gap-4 shadow-lg min-w-[260px]">
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
                    className="text-cyan-400 transition-all duration-1000 ease-out"
                    strokeDasharray={`${graphicsPercent}, 100`}
                    strokeLinecap="round"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm font-extrabold text-white">{graphicsPercent}%</span>
                  <span className="text-[8px] uppercase tracking-wider text-cyan-300 font-bold">Done</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Graphics Category</span>
                </div>
                <div className="text-base font-black text-white">
                  <span className="text-cyan-300">{graphicsPublished}</span>
                  <span className="text-slate-500 font-normal"> / {totalAgreedGraphics}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  <span className="text-emerald-400 font-medium">{graphicsRemaining} remaining</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                  Posts, Special Day, Cover
                </div>
              </div>
            </div>

            {/* 2. VIDEOS Category Card */}
            <div className="bg-slate-950/90 border border-purple-500/30 p-4 rounded-2xl flex items-center gap-4 shadow-lg min-w-[260px]">
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
                    className="text-purple-400 transition-all duration-1000 ease-out"
                    strokeDasharray={`${videosPercent}, 100`}
                    strokeLinecap="round"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-sm font-extrabold text-white">{videosPercent}%</span>
                  <span className="text-[8px] uppercase tracking-wider text-purple-300 font-bold">Done</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-400 uppercase tracking-wider">
                  <Film className="w-3.5 h-3.5" />
                  <span>Videos Category</span>
                </div>
                <div className="text-base font-black text-white">
                  <span className="text-purple-300">{videosPublished}</span>
                  <span className="text-slate-500 font-normal"> / {totalAgreedVideos}</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  <span className="text-emerald-400 font-medium">{videosRemaining} remaining</span>
                </div>
                <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                  Reels, TikToks, Shorts
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overdue Alert Banner if any */}
      {overdueCount > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20 text-red-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-red-300">
                {overdueCount} {overdueCount === 1 ? 'content item is' : 'content items are'} past planned publishing date
              </p>
              <p className="text-xs text-red-400/80">
                {graphicsOverdue} Graphics overdue • {videosOverdue} Videos overdue
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('tracker')}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-red-500 text-white hover:bg-red-400 transition-colors shrink-0"
          >
            Review Overdue Items
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEPARATE CATEGORY PERFORMANCE SECTIONS */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CATEGORY 1: GRAPHICS BREAKDOWN CARD */}
        <div className="bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-all rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Graphics Category</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                    {totalAgreedGraphics} Scope
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Graphic Posts, Special Day Posts & Cover Photos
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-lg font-black text-cyan-400">{graphicsPercent}%</span>
              <span className="text-[11px] text-slate-400 block font-medium">
                {graphicsPublished} / {totalAgreedGraphics} Published
              </span>
            </div>
          </div>

          {/* Graphics Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Delivery Status Breakdown</span>
              <span>{graphicsRemaining} remaining</span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
              {graphicsPublished > 0 && (
                <div
                  style={{ width: `${(graphicsPublished / (totalAgreedGraphics || 1)) * 100}%` }}
                  className="bg-emerald-500 h-full"
                  title={`Published: ${graphicsPublished}`}
                />
              )}
              {graphicsApproved > 0 && (
                <div
                  style={{ width: `${(graphicsApproved / (totalAgreedGraphics || 1)) * 100}%` }}
                  className="bg-blue-500 h-full"
                  title={`Approved: ${graphicsApproved}`}
                />
              )}
              {graphicsPending > 0 && (
                <div
                  style={{ width: `${(graphicsPending / (totalAgreedGraphics || 1)) * 100}%` }}
                  className="bg-amber-500 h-full"
                  title={`Pending: ${graphicsPending}`}
                />
              )}
              {graphicsInProgress > 0 && (
                <div
                  style={{ width: `${(graphicsInProgress / (totalAgreedGraphics || 1)) * 100}%` }}
                  className="bg-purple-500 h-full"
                  title={`In Progress: ${graphicsInProgress}`}
                />
              )}
              {graphicsOnHold > 0 && (
                <div
                  style={{ width: `${(graphicsOnHold / (totalAgreedGraphics || 1)) * 100}%` }}
                  className="bg-orange-500 h-full"
                  title={`On Hold: ${graphicsOnHold}`}
                />
              )}
              {graphicsNotStarted > 0 && (
                <div
                  style={{ width: `${(graphicsNotStarted / (totalAgreedGraphics || 1)) * 100}%` }}
                  className="bg-slate-700 h-full"
                  title={`Not Started: ${graphicsNotStarted}`}
                />
              )}
            </div>
          </div>

          {/* Detailed Graphics Metric Pills */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-emerald-400 font-semibold uppercase block">Published</span>
              <span className="text-base font-black text-white">{graphicsPublished}</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-blue-400 font-semibold uppercase block">Approved</span>
              <span className="text-base font-black text-white">{graphicsApproved}</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-amber-400 font-semibold uppercase block">Pending</span>
              <span className="text-base font-black text-white">{graphicsPending}</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-purple-400 font-semibold uppercase block">In Prog</span>
              <span className="text-base font-black text-white">{graphicsInProgress}</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Not Start</span>
              <span className="text-base font-black text-white">{graphicsNotStarted}</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-red-400 font-semibold uppercase block">Overdue</span>
              <span className="text-base font-black text-red-400">{graphicsOverdue}</span>
            </div>
          </div>
        </div>

        {/* CATEGORY 2: VIDEOS BREAKDOWN CARD */}
        <div className="bg-slate-900 border border-slate-800 hover:border-purple-500/40 transition-all rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Film className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Videos Category</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                    {totalAgreedVideos} Scope
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Video Reels, TikToks, Shorts & Showcase Videos
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-lg font-black text-purple-400">{videosPercent}%</span>
              <span className="text-[11px] text-slate-400 block font-medium">
                {videosPublished} / {totalAgreedVideos} Published
              </span>
            </div>
          </div>

          {/* Videos Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
              <span>Delivery Status Breakdown</span>
              <span>{videosRemaining} remaining</span>
            </div>
            <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
              {videosPublished > 0 && (
                <div
                  style={{ width: `${(videosPublished / (totalAgreedVideos || 1)) * 100}%` }}
                  className="bg-emerald-500 h-full"
                  title={`Published: ${videosPublished}`}
                />
              )}
              {videosApproved > 0 && (
                <div
                  style={{ width: `${(videosApproved / (totalAgreedVideos || 1)) * 100}%` }}
                  className="bg-blue-500 h-full"
                  title={`Approved: ${videosApproved}`}
                />
              )}
              {videosPending > 0 && (
                <div
                  style={{ width: `${(videosPending / (totalAgreedVideos || 1)) * 100}%` }}
                  className="bg-amber-500 h-full"
                  title={`Pending: ${videosPending}`}
                />
              )}
              {videosInProgress > 0 && (
                <div
                  style={{ width: `${(videosInProgress / (totalAgreedVideos || 1)) * 100}%` }}
                  className="bg-purple-500 h-full"
                  title={`In Progress: ${videosInProgress}`}
                />
              )}
              {videosOnHold > 0 && (
                <div
                  style={{ width: `${(videosOnHold / (totalAgreedVideos || 1)) * 100}%` }}
                  className="bg-orange-500 h-full"
                  title={`On Hold: ${videosOnHold}`}
                />
              )}
              {videosNotStarted > 0 && (
                <div
                  style={{ width: `${(videosNotStarted / (totalAgreedVideos || 1)) * 100}%` }}
                  className="bg-slate-700 h-full"
                  title={`Not Started: ${videosNotStarted}`}
                />
              )}
            </div>
          </div>

          {/* Detailed Videos Metric Pills */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-emerald-400 font-semibold uppercase block">Published</span>
              <span className="text-base font-black text-white">{videosPublished}</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-blue-400 font-semibold uppercase block">Approved</span>
              <span className="text-base font-black text-white">{videosApproved}</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-amber-400 font-semibold uppercase block">Pending</span>
              <span className="text-base font-black text-white">{videosPending}</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-purple-400 font-semibold uppercase block">In Prog</span>
              <span className="text-base font-black text-white">{videosInProgress}</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Not Start</span>
              <span className="text-base font-black text-white">{videosNotStarted}</span>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-red-400 font-semibold uppercase block">Overdue</span>
              <span className="text-base font-black text-red-400">{videosOverdue}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* CLIENT-WISE PROGRESS SECTION WITH SEPARATE GRAPHICS & VIDEOS TRACKS */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <span>Client-Wise Deliverables: Graphics & Videos Breakdown</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Production progress calculated separately for Graphics and Videos per client
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {activeClients.length} Active Accounts
          </span>
        </div>

        <div className="divide-y divide-slate-800">
          {activeClients.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">
              No active clients found. Add a client to begin tracking.
            </div>
          ) : (
            activeClients.map((client) => {
              // Find package
              const pkg = packages.find(
                p => p.clientId === client.id && p.month === selectedMonth && p.year === selectedYear
              );

              // Content for this client
              const clientItems = contentItems.filter(
                i => i.clientId === client.id && i.month === selectedMonth && i.year === selectedYear
              );

              // 1. Client Graphics Scope & Progress
              const clientGraphicsScope = pkg
                ? pkg.graphicPostQty + pkg.specialDayPostQty + pkg.coverPhotoQty + pkg.otherQty
                : clientItems.filter(i => isGraphicsType(i.contentType)).length;

              const clientGraphicsItems = clientItems.filter(i => isGraphicsType(i.contentType));
              const clientGraphicsPub = clientGraphicsItems.filter(i => i.status === 'Published').length;
              const clientGraphicsPercent = clientGraphicsScope > 0
                ? ((clientGraphicsPub / clientGraphicsScope) * 100).toFixed(0)
                : 0;

              // 2. Client Videos Scope & Progress
              const clientVideosScope = pkg
                ? pkg.videoQty
                : clientItems.filter(i => isVideosType(i.contentType)).length;

              const clientVideosItems = clientItems.filter(i => isVideosType(i.contentType));
              const clientVideosPub = clientVideosItems.filter(i => i.status === 'Published').length;
              const clientVideosPercent = clientVideosScope > 0
                ? ((clientVideosPub / clientVideosScope) * 100).toFixed(0)
                : 0;

              const clientOverdueCount = clientItems.filter(i => isContentOverdue(i)).length;

              return (
                <div
                  key={client.id}
                  className="p-5 hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
                    {/* Client Identity */}
                    <div className="min-w-[240px]">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                          {client.clientId}
                        </span>
                        <h3
                          className="font-bold text-white text-base hover:text-amber-400 transition-colors cursor-pointer"
                          onClick={() => onNavigateTab('tracker', client.id)}
                        >
                          {client.name}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 truncate">
                        {client.companyName} • Contact: {client.contactPerson}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[11px] text-slate-400 bg-slate-950/60 px-2 py-0.5 rounded border border-slate-800">
                          Fee: {client.monthlyPackageFee || 'Standard'}
                        </span>
                        {clientOverdueCount > 0 && (
                          <span className="text-[11px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 font-semibold">
                            {clientOverdueCount} Overdue
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dual Category Separate Tracks */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Graphics Category Track */}
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-cyan-500/20 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Graphics</span>
                          </span>
                          <span className="font-extrabold text-white">
                            <span className="text-cyan-400">{clientGraphicsPub}</span> / {clientGraphicsScope} Pub
                            <span className="text-slate-400 ml-1.5 font-normal">({clientGraphicsPercent}%)</span>
                          </span>
                        </div>

                        {/* Progress Bar for Graphics */}
                        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                          <div
                            style={{ width: `${Math.min(100, (clientGraphicsPub / (clientGraphicsScope || 1)) * 100)}%` }}
                            className="bg-cyan-400 h-full rounded-full transition-all"
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>
                            {clientGraphicsScope - clientGraphicsPub} remaining
                          </span>
                          <span className="text-slate-500 text-[10px]">
                            {pkg ? `${pkg.graphicPostQty} Posts, ${pkg.specialDayPostQty} Special, ${pkg.coverPhotoQty} Cover` : 'Graphic deliverables'}
                          </span>
                        </div>
                      </div>

                      {/* Videos Category Track */}
                      <div className="bg-slate-950/60 p-3 rounded-xl border border-purple-500/20 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-purple-300 flex items-center gap-1.5">
                            <Film className="w-3.5 h-3.5 text-purple-400" />
                            <span>Videos</span>
                          </span>
                          <span className="font-extrabold text-white">
                            <span className="text-purple-400">{clientVideosPub}</span> / {clientVideosScope} Pub
                            <span className="text-slate-400 ml-1.5 font-normal">({clientVideosPercent}%)</span>
                          </span>
                        </div>

                        {/* Progress Bar for Videos */}
                        <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden flex border border-slate-800">
                          <div
                            style={{ width: `${Math.min(100, (clientVideosPub / (clientVideosScope || 1)) * 100)}%` }}
                            className="bg-purple-400 h-full rounded-full transition-all"
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>
                            {clientVideosScope - clientVideosPub} remaining
                          </span>
                          <span className="text-slate-500 text-[10px]">
                            {pkg ? `${pkg.videoQty} Video Reels` : 'Video deliverables'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onNavigateTab('tracker', client.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors"
                      >
                        <span>View Content</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onOpenReportForClient(client.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/20 transition-colors"
                        title="Generate Monthly Client Report"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Report</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
