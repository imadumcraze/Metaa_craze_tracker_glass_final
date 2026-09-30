import React, { useState } from 'react';
import { ContentItem, Client, ContentType, ContentStatus, TabType } from '../types';
import { MONTH_NAMES, isContentOverdue } from '../lib/storage';
import { StatusBadge } from './StatusBadge';
import {
  CheckSquare,
  Search,
  Filter,
  Plus,
  ExternalLink,
  Edit2,
  Trash2,
  Calendar,
  AlertTriangle,
  Building2,
  Check,
  Link as LinkIcon,
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface ContentTrackerViewProps {
  contentItems: ContentItem[];
  clients: Client[];
  selectedMonth: number;
  selectedYear: number;
  initialClientFilter?: string;
  currentRole?: 'admin' | 'viewer' | 'client';
  onAddItem: (defaultClientId?: string) => void;
  onEditItem: (item: ContentItem) => void;
  onDeleteItem: (itemId: string) => void;
  onUpdateItemStatus: (itemId: string, newStatus: ContentStatus, actualPublishedDate?: string) => void;
  onUpdatePostUrl: (itemId: string, newUrl: string) => void;
}

export const ContentTrackerView: React.FC<ContentTrackerViewProps> = ({
  contentItems,
  clients,
  selectedMonth,
  selectedYear,
  initialClientFilter = '',
  currentRole = 'admin',
  onAddItem,
  onEditItem,
  onDeleteItem,
  onUpdateItemStatus,
  onUpdatePostUrl
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState(initialClientFilter);
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [timelineFilter, setTimelineFilter] = useState<'All' | 'Overdue' | 'Upcoming' | 'Published' | 'MissingDate' | 'OnHold'>('All');
  const [groupByClient, setGroupByClient] = useState(true);

  // Quick URL editing state
  const [editingUrlId, setEditingUrlId] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState('');

  const monthName = MONTH_NAMES[selectedMonth - 1];
  const todayStr = '2026-09-29'; // Context reference date

  // Filter content items
  const filteredItems = contentItems.filter(item => {
    // Month & Year filter
    if (item.month !== selectedMonth || item.year !== selectedYear) return false;

    // Client filter
    if (clientFilter && item.clientId !== clientFilter) return false;

    // Content Type filter
    if (contentTypeFilter !== 'All' && item.contentType !== contentTypeFilter) return false;

    // Status filter
    if (statusFilter !== 'All' && item.status !== statusFilter) return false;

    // Timeline / Category filter
    const isOverdue = isContentOverdue(item, todayStr);
    if (timelineFilter === 'Overdue' && !isOverdue) return false;
    if (timelineFilter === 'Published' && item.status !== 'Published') return false;
    if (timelineFilter === 'OnHold' && item.status !== 'On Hold') return false;
    if (timelineFilter === 'MissingDate' && item.plannedDate) return false;
    if (timelineFilter === 'Upcoming') {
      if (item.status === 'Published' || !item.plannedDate || item.plannedDate < todayStr) return false;
    }

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const client = clients.find(c => c.id === item.clientId);
      const matches =
        item.title.toLowerCase().includes(q) ||
        item.displayNumber.toLowerCase().includes(q) ||
        item.contentId.toLowerCase().includes(q) ||
        (item.remarks && item.remarks.toLowerCase().includes(q)) ||
        (client && client.name.toLowerCase().includes(q));
      if (!matches) return false;
    }

    return true;
  });

  const handleStartEditUrl = (item: ContentItem) => {
    setEditingUrlId(item.id);
    setUrlDraft(item.postUrl || '');
  };

  const handleSaveUrl = (itemId: string) => {
    onUpdatePostUrl(itemId, urlDraft.trim());
    setEditingUrlId(null);
    setUrlDraft('');
  };

  const handleInlineStatusChange = (item: ContentItem, newStatus: ContentStatus) => {
    let actualPubDate = item.actualPublishedDate;
    if (newStatus === 'Published' && !actualPubDate) {
      actualPubDate = item.plannedDate || todayStr;
    }
    onUpdateItemStatus(item.id, newStatus, actualPubDate);
  };

  // Group items by client if selected
  const clientsWithItems = clients.filter(c =>
    clientFilter ? c.id === clientFilter : true
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <CheckSquare className="w-6 h-6 text-amber-400" />
            <span>Content Production & Publishing Tracker</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Monitor and update status for every individual content piece for{' '}
            <strong className="text-white">{monthName} {selectedYear}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentRole === 'admin' ? (
            <button
              onClick={() => onAddItem(clientFilter || undefined)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-lg shadow-amber-400/20 shrink-0"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Content Item</span>
            </button>
          ) : (
            <span className="text-xs text-blue-400 bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20 font-semibold">
              Viewer Access (Read-Only)
            </span>
          )}
        </div>
      </div>

      {/* Search & Multi-Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        {/* Row 1: Search and Client Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, content # (e.g. Graphic Post 01), remarks, or client..."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <select
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
            >
              <option value="">All Clients ({clients.length})</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.status === 'Inactive' ? '(Inactive)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Secondary Dropdown Filters & Quick Category Tags */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-2">
            {/* Content Type Filter */}
            <select
              value={contentTypeFilter}
              onChange={(e) => setContentTypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="All">All Types</option>
              <option value="Graphic Post">Graphic Post</option>
              <option value="Video">Video</option>
              <option value="Special Day Post">Special Day Post</option>
              <option value="Cover Photo">Cover Photo</option>
              <option value="Other">Other</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="All">All Statuses</option>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Approved">Approved</option>
              <option value="Published">Published</option>
              <option value="On Hold">On Hold</option>
            </select>

            {/* Quick Timeline Filter Pills */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              {(
                [
                  { id: 'All', label: 'All', alert: false },
                  { id: 'Overdue', label: 'Overdue', alert: true },
                  { id: 'Upcoming', label: 'Upcoming', alert: false },
                  { id: 'Published', label: 'Published', alert: false },
                  { id: 'OnHold', label: 'On Hold', alert: false }
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setTimelineFilter(tab.id)}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                    timelineFilter === tab.id
                      ? tab.alert
                        ? 'bg-red-500 text-white'
                        : 'bg-amber-400 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grouping switch */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">View:</span>
            <button
              onClick={() => setGroupByClient(true)}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                groupByClient
                  ? 'bg-slate-800 text-amber-400 border-amber-400/30 font-semibold'
                  : 'text-slate-400 border-slate-800'
              }`}
            >
              By Client
            </button>
            <button
              onClick={() => setGroupByClient(false)}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                !groupByClient
                  ? 'bg-slate-800 text-amber-400 border-amber-400/30 font-semibold'
                  : 'text-slate-400 border-slate-800'
              }`}
            >
              Flat List
            </button>
          </div>
        </div>
      </div>

      {/* Results Count Banner */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span>
          Showing <strong className="text-white">{filteredItems.length}</strong> content records for{' '}
          {monthName} {selectedYear}
        </span>
        {(searchTerm || clientFilter || contentTypeFilter !== 'All' || statusFilter !== 'All' || timelineFilter !== 'All') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setClientFilter('');
              setContentTypeFilter('All');
              setStatusFilter('All');
              setTimelineFilter('All');
            }}
            className="text-amber-400 hover:underline"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Content Records */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-500">
          No content items match your current search and filter criteria.
        </div>
      ) : groupByClient ? (
        /* Grouped By Client View */
        <div className="space-y-6">
          {clientsWithItems.map((client) => {
            const clientRecords = filteredItems.filter(i => i.clientId === client.id);
            if (clientRecords.length === 0) return null;

            const publishedCount = clientRecords.filter(i => i.status === 'Published').length;

            return (
              <div
                key={client.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm"
              >
                {/* Client Section Header */}
                <div className="px-5 py-3.5 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                      {client.clientId}
                    </span>
                    <h2 className="font-bold text-white text-base">{client.name}</h2>
                    {client.companyName && (
                    <span className="text-xs text-slate-400 hidden sm:inline">
                      ({client.companyName})
                    </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-400">
                      <strong className="text-emerald-400">{publishedCount}</strong> / {clientRecords.length} Published
                    </span>
                    <button
                      onClick={() => onAddItem(client.id)}
                      className="px-2.5 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 text-xs font-semibold border border-amber-400/20 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                {/* Content Table for this Client */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider bg-slate-950/30">
                        <th className="py-2.5 px-4 font-semibold">Content # & ID</th>
                        <th className="py-2.5 px-4 font-semibold">Description / Title</th>
                        <th className="py-2.5 px-4 font-semibold">Planned Date</th>
                        <th className="py-2.5 px-4 font-semibold">Status Workflow</th>
                        <th className="py-2.5 px-4 font-semibold">Published Date</th>
                        <th className="py-2.5 px-4 font-semibold">Live URL</th>
                        <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {clientRecords.map((item) => (
                        <ContentRowItem
                          key={item.id}
                          item={item}
                          currentRole={currentRole}
                          onEditItem={onEditItem}
                          onDeleteItem={onDeleteItem}
                          onInlineStatusChange={handleInlineStatusChange}
                          editingUrlId={editingUrlId}
                          urlDraft={urlDraft}
                          setUrlDraft={setUrlDraft}
                          onStartEditUrl={handleStartEditUrl}
                          onSaveUrl={handleSaveUrl}
                          onCancelEditUrl={() => setEditingUrlId(null)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Flat List View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider bg-slate-950/50">
                  <th className="py-3 px-4 font-semibold">Client</th>
                  <th className="py-3 px-4 font-semibold">Content # & ID</th>
                  <th className="py-3 px-4 font-semibold">Description / Title</th>
                  <th className="py-3 px-4 font-semibold">Planned Date</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Published Date</th>
                  <th className="py-3 px-4 font-semibold">Live URL</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredItems.map((item) => {
                  const client = clients.find(c => c.id === item.clientId);
                  return (
                    <ContentRowItem
                      key={item.id}
                      item={item}
                      clientName={client?.name}
                      showClientColumn={true}
                      currentRole={currentRole}
                      onEditItem={onEditItem}
                      onDeleteItem={onDeleteItem}
                      onInlineStatusChange={handleInlineStatusChange}
                      editingUrlId={editingUrlId}
                      urlDraft={urlDraft}
                      setUrlDraft={setUrlDraft}
                      onStartEditUrl={handleStartEditUrl}
                      onSaveUrl={handleSaveUrl}
                      onCancelEditUrl={() => setEditingUrlId(null)}
                    />
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

interface ContentRowItemProps {
  item: ContentItem;
  clientName?: string;
  showClientColumn?: boolean;
  currentRole?: 'admin' | 'viewer' | 'client';
  onEditItem: (item: ContentItem) => void;
  onDeleteItem: (itemId: string) => void;
  onInlineStatusChange: (item: ContentItem, newStatus: ContentStatus) => void;
  editingUrlId: string | null;
  urlDraft: string;
  setUrlDraft: (val: string) => void;
  onStartEditUrl: (item: ContentItem) => void;
  onSaveUrl: (itemId: string) => void;
  onCancelEditUrl: () => void;
}

const ContentRowItem: React.FC<ContentRowItemProps> = ({
  item,
  clientName,
  showClientColumn = false,
  currentRole = 'admin',
  onEditItem,
  onDeleteItem,
  onInlineStatusChange,
  editingUrlId,
  urlDraft,
  setUrlDraft,
  onStartEditUrl,
  onSaveUrl,
  onCancelEditUrl
}) => {
  const isOverdue = isContentOverdue(item);
  const isAdmin = currentRole === 'admin';

  return (
    <tr className="hover:bg-slate-800/30 transition-colors">
      {/* Optional Client Column */}
      {showClientColumn && (
        <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
          {clientName || 'Unknown'}
        </td>
      )}

      {/* Content # & ID */}
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="font-bold text-white flex items-center gap-1.5">
          <span>{item.displayNumber}</span>
        </div>
        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
          {item.contentId}
        </div>
      </td>

      {/* Description / Title & Remarks */}
      <td className="py-3 px-4 max-w-xs">
        <p className="font-medium text-slate-200 line-clamp-2">
          {item.title || '(No description provided)'}
        </p>
        {item.remarks && (
          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 italic">
            Note: {item.remarks}
          </p>
        )}
      </td>

      {/* Planned Date */}
      <td className="py-3 px-4 whitespace-nowrap">
        {item.plannedDate ? (
          <div className="flex items-center gap-1.5 text-xs text-slate-300">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{item.plannedDate}</span>
          </div>
        ) : (
          <span className="text-slate-500 italic text-xs">Date not set</span>
        )}
      </td>

      {/* Status with Inline Dropdown Switcher (Admin only) or Badge (Viewer/Client) */}
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <StatusBadge status={item.status} isOverdue={isOverdue} size="sm" />
          {isAdmin && (
            <select
              value={item.status}
              onChange={(e) => onInlineStatusChange(item, e.target.value as ContentStatus)}
              className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[11px] text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
              title="Quick update status"
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Approved">Approved</option>
              <option value="Published">Published</option>
              <option value="On Hold">On Hold</option>
            </select>
          )}
        </div>
      </td>

      {/* Actual Published Date */}
      <td className="py-3 px-4 whitespace-nowrap text-xs">
        {item.status === 'Published' && item.actualPublishedDate ? (
          <span className="text-emerald-400 font-medium flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{item.actualPublishedDate}</span>
          </span>
        ) : (
          <span className="text-slate-500 italic">Not Published</span>
        )}
      </td>

      {/* Post URL */}
      <td className="py-3 px-4 whitespace-nowrap text-xs">
        {isAdmin && editingUrlId === item.id ? (
          <div className="flex items-center gap-1">
            <input
              type="url"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              placeholder="https://..."
              className="bg-slate-950 border border-amber-500 rounded px-2 py-0.5 text-xs text-white w-40 focus:outline-none"
              autoFocus
            />
            <button
              onClick={() => onSaveUrl(item.id)}
              className="p-1 bg-amber-400 text-slate-950 rounded hover:bg-amber-300"
              title="Save URL"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={onCancelEditUrl}
              className="p-1 bg-slate-800 text-slate-400 rounded hover:text-white"
              title="Cancel"
            >
              ✕
            </button>
          </div>
        ) : item.postUrl ? (
          <div className="flex items-center gap-2">
            <a
              href={item.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 hover:underline max-w-[130px] truncate"
              title={item.postUrl}
            >
              <ExternalLink className="w-3 h-3 shrink-0" />
              <span className="truncate">{item.postUrl.replace(/^https?:\/\/(www\.)?/, '')}</span>
            </a>
            {isAdmin && (
              <button
                onClick={() => onStartEditUrl(item)}
                className="text-slate-500 hover:text-slate-300 text-[10px]"
                title="Edit URL"
              >
                Edit
              </button>
            )}
          </div>
        ) : isAdmin ? (
          <button
            onClick={() => onStartEditUrl(item)}
            className="text-slate-500 hover:text-amber-400 text-xs flex items-center gap-1"
          >
            <LinkIcon className="w-3 h-3" />
            <span>+ Add URL</span>
          </button>
        ) : (
          <span className="text-slate-500">—</span>
        )}
      </td>

      {/* Actions (Admin only) */}
      <td className="py-3 px-4 whitespace-nowrap text-right">
        {isAdmin ? (
          <div className="flex items-center justify-end gap-1">
            <button
              onClick={() => onEditItem(item)}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Edit Item Details"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Delete ${item.displayNumber} (${item.title || 'Untitled'})?`)) {
                  onDeleteItem(item.id);
                }
              }}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Delete Item"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <span className="text-slate-600 text-xs">—</span>
        )}
      </td>
    </tr>
  );
};
