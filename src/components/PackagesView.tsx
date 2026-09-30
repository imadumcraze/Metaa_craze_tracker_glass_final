import React, { useState } from 'react';
import { MonthlyPackage, Client, ContentItem, TabType } from '../types';
import { MONTH_NAMES } from '../lib/storage';
import {
  Package,
  Plus,
  Sparkles,
  Calculator,
  Edit2,
  Calendar,
  Building2,
  ArrowRight,
  Layers,
  FileCheck
} from 'lucide-react';

interface PackagesViewProps {
  packages: MonthlyPackage[];
  clients: Client[];
  contentItems: ContentItem[];
  selectedMonth: number;
  selectedYear: number;
  currentRole?: 'admin' | 'viewer' | 'client';
  onAddPackage: () => void;
  onEditPackage: (pkg: MonthlyPackage) => void;
  onGenerateContentForPackage: (pkg: MonthlyPackage) => void;
  onNavigateTab: (tab: TabType, clientIdFilter?: string) => void;
}

export const PackagesView: React.FC<PackagesViewProps> = ({
  packages,
  clients,
  contentItems,
  selectedMonth,
  selectedYear,
  currentRole = 'admin',
  onAddPackage,
  onEditPackage,
  onGenerateContentForPackage,
  onNavigateTab
}) => {
  const [filterMonthOnly, setFilterMonthOnly] = useState(true);
  const monthName = MONTH_NAMES[selectedMonth - 1];

  const filteredPackages = packages.filter(pkg => {
    if (filterMonthOnly) {
      return pkg.month === selectedMonth && pkg.year === selectedYear;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-400" />
            <span>Monthly Content Packages</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Deliverable quotas defined per client for{' '}
            <strong className="text-white">{monthName} {selectedYear}</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilterMonthOnly(!filterMonthOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              filterMonthOnly
                ? 'bg-slate-800 text-amber-400 border-amber-400/30'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
          >
            {filterMonthOnly ? `Showing: ${monthName} ${selectedYear}` : 'Showing: All Months'}
          </button>

          {currentRole === 'admin' ? (
            <button
              onClick={onAddPackage}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-lg shadow-amber-400/20 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Package</span>
            </button>
          ) : (
            <span className="text-xs text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20 font-semibold">
              Viewer Access (Read-Only)
            </span>
          )}
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPackages.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-500">
            No monthly packages found for {monthName} {selectedYear}. Click "New Package" to create one.
          </div>
        ) : (
          filteredPackages.map((pkg) => {
            const client = clients.find(c => c.id === pkg.clientId);
            const clientItems = contentItems.filter(
              i => i.clientId === pkg.clientId && i.month === pkg.month && i.year === pkg.year
            );
            const publishedCount = clientItems.filter(i => i.status === 'Published').length;
            const completionPercent = pkg.totalDeliverables > 0
              ? ((publishedCount / pkg.totalDeliverables) * 100).toFixed(0)
              : 0;

            const hasGeneratedItems = clientItems.length > 0;

            return (
              <div
                key={pkg.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                        {pkg.packageId}
                      </span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>{MONTH_NAMES[pkg.month - 1]} {pkg.year}</span>
                      </span>
                    </div>

                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                      pkg.status === 'Active'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : pkg.status === 'Completed'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}>
                      {pkg.status}
                    </span>
                  </div>

                  {/* Client Name */}
                  <h3 className="font-bold text-lg text-white">
                    {client?.name || 'Unknown Client'}
                  </h3>
                  {client?.companyName && (
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>{client.companyName}</span>
                  </div>
                  )}

                  {/* Deliverables Breakdown Box */}
                  <div className="mt-4 p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                      <span className="font-semibold text-slate-400">Total Monthly Deliverables</span>
                      <span className="font-black text-base text-amber-400">
                        {pkg.totalDeliverables} Items
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-[10px] uppercase text-slate-500 block">Graphic Posts</span>
                        <span className="text-sm font-bold text-white">{pkg.graphicPostQty}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-[10px] uppercase text-slate-500 block">Videos / Reels</span>
                        <span className="text-sm font-bold text-white">{pkg.videoQty}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-[10px] uppercase text-slate-500 block">Special Day</span>
                        <span className="text-sm font-bold text-white">{pkg.specialDayPostQty}</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                        <span className="text-[10px] uppercase text-slate-500 block">Cover Photo</span>
                        <span className="text-sm font-bold text-white">{pkg.coverPhotoQty}</span>
                      </div>
                    </div>

                    {pkg.otherQty > 0 && (
                      <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                        <span>Other Content:</span>
                        <span className="font-bold text-white">{pkg.otherQty} items</span>
                      </div>
                    )}
                  </div>

                  {/* Tracking Status */}
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-slate-400">
                      Existing records in tracker: <strong className="text-white">{clientItems.length}</strong> / {pkg.totalDeliverables}
                    </span>
                    <span className="text-emerald-400 font-bold">
                      {publishedCount} Published ({completionPercent}%)
                    </span>
                  </div>

                  {pkg.notes && (
                    <p className="text-xs text-slate-400 mt-2 italic bg-slate-950/40 p-2 rounded-lg border border-slate-800/40">
                      "{pkg.notes}"
                    </p>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="mt-5 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  {currentRole === 'admin' ? (
                    <button
                      onClick={() => onEditPackage(pkg)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-xs flex items-center gap-1.5"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Scope</span>
                    </button>
                  ) : (
                    <span className="text-slate-500 text-xs italic">Read-only scope</span>
                  )}

                  <div className="flex items-center gap-2">
                    {currentRole === 'admin' && clientItems.length < pkg.totalDeliverables && (
                      <button
                        onClick={() => onGenerateContentForPackage(pkg)}
                        className="px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 rounded-xl transition-colors flex items-center gap-1.5"
                        title="Auto-create missing numbered items"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                        <span>Generate Missing ({pkg.totalDeliverables - clientItems.length})</span>
                      </button>
                    )}

                    <button
                      onClick={() => onNavigateTab('tracker', pkg.clientId)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-1"
                    >
                      <span>Track ({clientItems.length})</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
