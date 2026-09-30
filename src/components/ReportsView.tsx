import React, { useState } from 'react';
import { Client, MonthlyPackage, ContentItem } from '../types';
import { MONTH_NAMES } from '../lib/storage';
import { StatusBadge } from './StatusBadge';
import { exportReportToGoogleSheets } from '../lib/sheetsService';
import { getAccessToken, googleSignIn } from '../lib/firebaseAuth';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Share2,
  ExternalLink,
  Building2,
  CheckCircle2,
  ThumbsUp,
  Clock,
  Sparkles,
  CircleDashed,
  PauseCircle,
  AlertCircle,
  History,
  Check,
  FileDown
} from 'lucide-react';

interface ReportsViewProps {
  clients: Client[];
  packages: MonthlyPackage[];
  contentItems: ContentItem[];
  defaultClientId?: string;
  selectedMonth: number;
  selectedYear: number;
  currentRole?: 'admin' | 'viewer' | 'client';
  restrictedClientId?: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  clients,
  packages,
  contentItems,
  defaultClientId,
  selectedMonth,
  selectedYear,
  currentRole = 'admin',
  restrictedClientId
}) => {
  const effectiveClientId = restrictedClientId || defaultClientId || (clients.length > 0 ? clients[0].id : '');
  const [reportClientId, setReportClientId] = useState<string>(effectiveClientId);
  const [reportMonth, setReportMonth] = useState<number>(selectedMonth);
  const [reportYear, setReportYear] = useState<number>(selectedYear);

  const [csvDownloaded, setCsvDownloaded] = useState(false);

  // Google Sheets Export state
  const [isExportingSheets, setIsExportingSheets] = useState(false);
  const [sheetsExportSuccess, setSheetsExportSuccess] = useState<{ url: string } | null>(null);
  const [sheetsError, setSheetsError] = useState<string | null>(null);

  const selectedClient = clients.find(c => c.id === reportClientId) || clients[0];
  const monthName = MONTH_NAMES[reportMonth - 1];

  // Selected client's package for this month/year
  const pkg = packages.find(
    p => p.clientId === reportClientId && p.month === reportMonth && p.year === reportYear
  );

  // All individual content items for this client and month/year
  const items = contentItems.filter(
    i => i.clientId === reportClientId && i.month === reportMonth && i.year === reportYear
  );

  // Sorted items by type and contentNumber
  const sortedItems = [...items].sort((a, b) => {
    if (a.contentType !== b.contentType) {
      return a.contentType.localeCompare(b.contentType);
    }
    return a.contentNumber - b.contentNumber;
  });

  // Summary Metrics
  const totalAgreed = pkg ? pkg.totalDeliverables : items.length;
  const publishedCount = items.filter(i => i.status === 'Published').length;
  const approvedCount = items.filter(i => i.status === 'Approved').length;
  const pendingCount = items.filter(i => i.status === 'Pending Approval').length;
  const inProgressCount = items.filter(i => i.status === 'In Progress').length;
  const notStartedCount = items.filter(i => i.status === 'Not Started').length;
  const onHoldCount = items.filter(i => i.status === 'On Hold').length;

  const completionPercent = totalAgreed > 0
    ? ((publishedCount / totalAgreed) * 100).toFixed(1)
    : '0.0';

  // Available history months for this client
  const clientPackages = packages.filter(p => p.clientId === reportClientId);
  const clientContentMonths = Array.from(
    new Set(
      contentItems
        .filter(i => i.clientId === reportClientId)
        .map(i => `${i.year}-${i.month}`)
    )
  ).map(str => {
    const [y, m] = str.split('-').map(Number);
    return { year: y, month: m };
  });

  // Merge history months
  const allHistoryPeriods = Array.from(
    new Set([
      ...clientPackages.map(p => `${p.year}-${p.month}`),
      ...clientContentMonths.map(c => `${c.year}-${c.month}`),
      `${reportYear}-${reportMonth}`
    ])
  )
    .map(str => {
      const [y, m] = str.split('-').map(Number);
      return { year: y, month: m };
    })
    .sort((a, b) => b.year - a.year || b.month - a.month);

  const handlePrint = () => {
    window.print();
  };

  const handleExportToCsv = () => {
    if (!selectedClient) return;
    const clientNameClean = selectedClient.name.replace(/[^a-zA-Z0-9_-]/g, '_');
    const headers = [
      'No',
      'Content Code',
      'Title / Description',
      'Content Type',
      'Planned Date',
      'Published Date',
      'Status',
      'Post URL',
      'Remarks'
    ];

    const rows = sortedItems.map((item, index) => [
      index + 1,
      `"${(item.displayNumber || '').replace(/"/g, '""')}"`,
      `"${(item.title || '').replace(/"/g, '""')}"`,
      `"${(item.contentType || '').replace(/"/g, '""')}"`,
      `"${(item.plannedDate || '').replace(/"/g, '""')}"`,
      `"${(item.actualPublishedDate || '').replace(/"/g, '""')}"`,
      `"${(item.status || '').replace(/"/g, '""')}"`,
      `"${(item.postUrl || '').replace(/"/g, '""')}"`,
      `"${(item.remarks || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [
      `"METAA CRAZE PRODUCTIONS (PVT) LTD - CLIENT DELIVERY REPORT"`,
      `"Client: ${selectedClient.name}${selectedClient.companyName ? ` (${selectedClient.companyName})` : ''}"`,
      `"Period: ${monthName} ${reportYear}"`,
      `"Total Agreed: ${totalAgreed}"`,
      `"Published: ${publishedCount}"`,
      `"Completion Rate: ${completionPercent}%"`,
      '',
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${clientNameClean}_Delivery_Report_${monthName}_${reportYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setCsvDownloaded(true);
    setTimeout(() => setCsvDownloaded(false), 3000);
  };

  const handleExportToGoogleSheets = async () => {
    if (!selectedClient) return;
    setIsExportingSheets(true);
    setSheetsError(null);
    setSheetsExportSuccess(null);

    try {
      let token = getAccessToken();
      if (!token) {
        // Prompt Google Sign-In if token not cached
        const res = await googleSignIn();
        token = res.accessToken;
      }

      if (!token) {
        throw new Error('Google authorization token not available. Please sign in with Google.');
      }

      const result = await exportReportToGoogleSheets({
        client: selectedClient,
        pkg,
        month: reportMonth,
        year: reportYear,
        items: sortedItems,
        accessToken: token
      });

      setSheetsExportSuccess({ url: result.spreadsheetUrl });
    } catch (err: any) {
      console.error('Failed to export to Google Sheets:', err);
      setSheetsError(err.message || 'Failed to export to Google Sheets.');
    } finally {
      setIsExportingSheets(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configuration & Action Bar (Hidden during Print) */}
      <div className="print:hidden space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-amber-400" />
              <span>Monthly Client Delivery Report</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              Official client-ready delivery report with itemized audit and export capabilities
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Offline CSV Export Button */}
            <button
              onClick={handleExportToCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 transition-all shadow-sm"
              title="Download raw delivery data as CSV (opens in Excel/Numbers without Google Sheets)"
            >
              <FileDown className="w-4 h-4 text-sky-400" />
              <span>{csvDownloaded ? 'CSV Downloaded!' : 'Export CSV (Offline)'}</span>
            </button>

            {/* Google Sheets Export Button */}
            <button
              onClick={handleExportToGoogleSheets}
              disabled={isExportingSheets}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all shadow-sm disabled:opacity-50"
              title="Export formatted report to Google Sheets"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>{isExportingSheets ? 'Exporting...' : 'Export to Sheets'}</span>
            </button>

            {/* Print / Save PDF Button */}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-md shadow-amber-400/20"
              title="Open browser print dialog to print or save as PDF"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Download / Print PDF</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert for Google Sheets */}
        {sheetsExportSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs sm:text-sm text-emerald-300">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Report successfully exported to Google Sheets!
              </span>
            </div>
            <a
              href={sheetsExportSuccess.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-emerald-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-emerald-400 transition-colors flex items-center gap-1 shrink-0"
            >
              <span>Open Spreadsheet</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {sheetsError && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{sheetsError}</span>
          </div>
        )}

        {/* Client & Period Selection Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Select Client {restrictedClientId ? '(Locked to Your Account)' : ''}
              </label>
              <select
                value={restrictedClientId || reportClientId}
                disabled={!!restrictedClientId}
                onChange={(e) => {
                  setReportClientId(e.target.value);
                  setSheetsExportSuccess(null);
                }}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500 font-semibold disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {clients
                  .filter(c => (restrictedClientId ? c.id === restrictedClientId : true))
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {c.companyName ? `${c.name} (${c.companyName})` : c.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Reporting Month
              </label>
              <select
                value={reportMonth}
                onChange={(e) => {
                  setReportMonth(Number(e.target.value));
                  setSheetsExportSuccess(null);
                }}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx + 1}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Reporting Year
              </label>
              <select
                value={reportYear}
                onChange={(e) => {
                  setReportYear(Number(e.target.value));
                  setSheetsExportSuccess(null);
                }}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              >
                {[2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Historical Months Navigation */}
          {allHistoryPeriods.length > 1 && (
            <div className="flex flex-col items-start md:items-end">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <History className="w-3 h-3 text-amber-400" />
                <span>Historical Periods</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {allHistoryPeriods.map(p => {
                  const isCurrent = p.month === reportMonth && p.year === reportYear;
                  return (
                    <button
                      key={`${p.year}-${p.month}`}
                      onClick={() => {
                        setReportMonth(p.month);
                        setReportYear(p.year);
                        setSheetsExportSuccess(null);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        isCurrent
                          ? 'bg-amber-400 text-slate-950 border-amber-400 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {MONTH_NAMES[p.month - 1].slice(0, 3)} {p.year}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* OFFICIAL PRINTABLE CLIENT REPORT DOCUMENT */}
      {/* ========================================================================= */}
      <div
        id="printable-report"
        className="bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-10 max-w-5xl mx-auto print:p-0 print:border-none print:shadow-none print:max-w-none print:text-black"
      >
        {/* Document Header with Metaa Craze Branding */}
        <div className="border-b-2 border-slate-900 pb-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center print:border print:border-black">
                  MC
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-slate-950 uppercase">
                    METAA CRAZE PRODUCTIONS (PVT) LTD.
                  </h2>
                  <p className="text-xs text-slate-600 font-medium">
                    Creative Media, Social Media Management & Brand Strategy
                  </p>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-block bg-slate-900 text-amber-400 font-mono font-bold text-xs uppercase px-3 py-1 rounded print:bg-slate-100 print:text-slate-900 print:border">
                MONTHLY DELIVERY REPORT
              </span>
              <p className="text-xs text-slate-500 mt-1">
                Ref: {pkg?.packageId || `REP-${reportYear}${reportMonth < 10 ? '0' + reportMonth : reportMonth}`}
              </p>
            </div>
          </div>

          {/* Client & Period Information Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-5 border-t border-slate-200 text-xs">
            <div>
              <span className="text-slate-500 uppercase font-semibold block text-[10px]">Client</span>
              <span className="text-sm font-bold text-slate-900 block">{selectedClient?.name}</span>
              {selectedClient?.companyName && (
                <span className="text-slate-600 block">{selectedClient.companyName}</span>
              )}
            </div>

            <div>
              <span className="text-slate-500 uppercase font-semibold block text-[10px]">Reporting Period</span>
              <span className="text-sm font-bold text-slate-900 block">{monthName} {reportYear}</span>
              <span className="text-slate-600 block">Monthly Campaign</span>
            </div>

            <div>
              <span className="text-slate-500 uppercase font-semibold block text-[10px]">Contact Person</span>
              <span className="text-sm font-bold text-slate-900 block">{selectedClient?.contactPerson || '—'}</span>
              <span className="text-slate-600 block">{selectedClient?.email || selectedClient?.contactNumber}</span>
            </div>

            <div>
              <span className="text-slate-500 uppercase font-semibold block text-[10px]">Generated Date</span>
              <span className="text-sm font-bold text-slate-900 block">
                {new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              <span className="text-slate-600 block">Internal Verified Audit</span>
            </div>
          </div>
        </div>

        {/* Section 14: Report Summary Metrics */}
        <div className="mb-8">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3 flex items-center justify-between">
            <span>Monthly Delivery Summary & Performance</span>
            <span className="text-amber-600 font-bold">
              Completion Rate: {completionPercent}%
            </span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Agreed</span>
              <span className="text-base font-black text-slate-900">{totalAgreed}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[10px] uppercase font-bold text-emerald-700 block">Published</span>
              <span className="text-base font-black text-emerald-800">{publishedCount}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
              <span className="text-[10px] uppercase font-bold text-blue-700 block">Approved</span>
              <span className="text-base font-black text-blue-800">{approvedCount}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[10px] uppercase font-bold text-amber-700 block">Pending Appr.</span>
              <span className="text-base font-black text-amber-800">{pendingCount}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-purple-50 border border-purple-200">
              <span className="text-[10px] uppercase font-bold text-purple-700 block">In Progress</span>
              <span className="text-base font-black text-purple-800">{inProgressCount}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Not Started</span>
              <span className="text-base font-black text-slate-700">{notStartedCount}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-orange-50 border border-orange-200">
              <span className="text-[10px] uppercase font-bold text-orange-700 block">On Hold</span>
              <span className="text-base font-black text-orange-800">{onHoldCount}</span>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-100 border border-amber-300">
              <span className="text-[10px] uppercase font-bold text-amber-900 block">Completion</span>
              <span className="text-base font-black text-amber-900">{completionPercent}%</span>
            </div>
          </div>
        </div>

        {/* Section 13 & 15: Content Delivery Details Table */}
        <div className="mb-8">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3">
            Content Delivery Details ({sortedItems.length} Items)
          </h3>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-[11px] uppercase tracking-wider font-bold">
                  <th className="py-2.5 px-3 w-10 text-center">No.</th>
                  <th className="py-2.5 px-3">Content Item</th>
                  <th className="py-2.5 px-3">Content Description / Title</th>
                  <th className="py-2.5 px-3">Planned Date</th>
                  <th className="py-2.5 px-3">Published Date</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Live URL / Link</th>
                  <th className="py-2.5 px-3">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {sortedItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 italic">
                      No content items recorded for {selectedClient?.name} in {monthName} {reportYear}.
                    </td>
                  </tr>
                ) : (
                  sortedItems.map((item, index) => {
                    const isPublished = item.status === 'Published';
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                          {index + 1}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                          {item.displayNumber}
                        </td>
                        <td className="py-2.5 px-3 text-slate-800 max-w-xs font-medium">
                          {item.title || '(No description provided)'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                          {item.plannedDate || 'Not set'}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap font-medium">
                          {isPublished && item.actualPublishedDate ? (
                            <span className="text-emerald-700 font-semibold">
                              {item.actualPublishedDate}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">Not Published</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold border ${
                            item.status === 'Published'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : item.status === 'Approved'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : item.status === 'Pending Approval'
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : item.status === 'In Progress'
                              ? 'bg-purple-100 text-purple-800 border-purple-200'
                              : item.status === 'On Hold'
                              ? 'bg-orange-100 text-orange-800 border-orange-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-xs max-w-[140px] truncate">
                          {item.postUrl ? (
                            <a
                              href={item.postUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline font-medium truncate block print:text-black"
                              title={item.postUrl}
                            >
                              {item.postUrl}
                            </a>
                          ) : (
                            <span className="text-slate-400 italic">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 text-[11px] max-w-[160px]">
                          {item.remarks || '—'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Document Footer & Sign-off */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <p className="font-bold text-slate-800">
              Metaa Craze Productions (Pvt) Ltd.
            </p>
            <p>
              Colombo, Sri Lanka • Official Content Delivery Verification Document
            </p>
          </div>

          <div className="text-left sm:text-right">
            <div className="h-8 border-b border-slate-400 w-48 mb-1" />
            <p className="text-[11px] text-slate-500">
              Authorized Signature & Agency Seal
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
