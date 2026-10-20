import React, { useState, useEffect } from 'react';
import { ContentItem, Client, ContentType, ContentStatus, TabType, TeamMember, UserRole, ContentNote } from '../types';
import { MONTH_NAMES, isContentOverdue } from '../lib/storage';
import { getSriLankaToday } from '../lib/dateUtils';
import { getItemAssignees, isAssignedTo } from '../lib/assignees';
import { StatusBadge } from './StatusBadge';
import { ItemNotesCell } from './ItemNotesCell';
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
  ChevronDown,
  UserCheck,
  User,
  MessageSquare
} from 'lucide-react';

interface ContentTrackerViewProps {
  contentItems: ContentItem[];
  clients: Client[];
  teamMembers?: TeamMember[];
  currentTeamMember?: TeamMember | null;
  selectedMonth: number;
  selectedYear: number;
  initialClientFilter?: string;
  currentRole?: UserRole;
  onAddItem: (defaultClientId?: string) => void;
  onEditItem: (item: ContentItem) => void;
  onDeleteItem: (itemId: string) => void;
  onUpdateItemStatus: (itemId: string, newStatus: ContentStatus, actualPublishedDate?: string) => void;
  onUpdatePostUrl: (itemId: string, newUrl: string) => void;
  onUpdateStatusFields?: (
    itemId: string,
    fields: {
      status?: ContentStatus;
      actualPublishedDate?: string;
      postUrl?: string;
      remarks?: string;
    }
  ) => void;
  focusItemId?: string;
  onFocusHandled?: () => void;
  contentNotes?: ContentNote[];
  onAddNote?: (itemId: string, text: string) => void | Promise<void>;
  onUpdateNote?: (noteId: string, text: string) => void | Promise<void>;
  onDeleteNote?: (noteId: string) => void | Promise<void>;
  currentUserId?: string;
}

export const ContentTrackerView: React.FC<ContentTrackerViewProps> = ({
  contentItems,
  clients,
  teamMembers = [],
  currentTeamMember,
  selectedMonth,
  selectedYear,
  initialClientFilter = '',
  currentRole = 'admin',
  onAddItem,
  onEditItem,
  onDeleteItem,
  onUpdateItemStatus,
  onUpdatePostUrl,
  onUpdateStatusFields,
  focusItemId,
  onFocusHandled,
  contentNotes = [],
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  currentUserId = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState(initialClientFilter);
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('All');
  const [assignedToMeOnly, setAssignedToMeOnly] = useState<boolean>(false);
  const [timelineFilter, setTimelineFilter] = useState<
    'All' | 'Overdue' | 'Upcoming' | 'Published' | 'MissingDate' | 'OnHold'
  >('All');
  const [groupByClient, setGroupByClient] = useState(true);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  // If selected client is no longer present in clients list, reset to All
  useEffect(() => {
    if (clientFilter && !clients.some((c) => c.id === clientFilter)) {
      setClientFilter('');
    }
  }, [clients, clientFilter]);

  // Focus item jump & highlight effect
  useEffect(() => {
    if (!focusItemId) return;

    // Reset filters to defaults
    setSearchTerm('');
    setClientFilter('');
    setContentTypeFilter('All');
    setStatusFilter('All');
    setAssigneeFilter('All');
    setAssignedToMeOnly(false);
    setTimelineFilter('All');

    // Wait until the row is rendered, scroll it into view (center), highlight it for about 3 seconds
    const scrollTimer = setTimeout(() => {
      const el = document.getElementById(`tracker-row-${focusItemId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedId(focusItemId);
      }
    }, 120);

    const clearTimer = setTimeout(() => {
      setHighlightedId(null);
      if (onFocusHandled) {
        onFocusHandled();
      }
    }, 3120);

    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearTimer);
    };
  }, [focusItemId]);

  // Quick URL editing state
  const [editingUrlId, setEditingUrlId] = useState<string | null>(null);
  const [urlDraft, setUrlDraft] = useState('');

  // Quick Remarks editing state
  const [editingRemarksId, setEditingRemarksId] = useState<string | null>(null);
  const [remarksDraft, setRemarksDraft] = useState('');

  // Quick Date editing state
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [dateDraft, setDateDraft] = useState('');

  const monthName = MONTH_NAMES[selectedMonth - 1];
  const todayStr = getSriLankaToday();

  const canEditStatusFields = currentRole === 'admin' || currentRole === 'moderator';
  const isAdmin = currentRole === 'admin';

  // Filter content items
  const filteredItems = contentItems.filter((item) => {
    // Month & Year filter
    if (item.month !== selectedMonth || item.year !== selectedYear) return false;

    // Client filter
    if (clientFilter && item.clientId !== clientFilter) return false;

    // Content Type filter
    if (contentTypeFilter !== 'All' && item.contentType !== contentTypeFilter) return false;

    // Status filter
    if (statusFilter !== 'All' && item.status !== statusFilter) return false;

    // Assignee filter
    if (assignedToMeOnly && currentTeamMember) {
      if (!isAssignedTo(item, currentTeamMember.uid)) return false;
    } else if (assigneeFilter === 'unassigned') {
      if (getItemAssignees(item).length > 0) return false;
    } else if (assigneeFilter !== 'All') {
      if (!isAssignedTo(item, assigneeFilter)) return false;
    }

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
      const client = clients.find((c) => c.id === item.clientId);
      const assignees = getItemAssignees(item);
      const itemNotes = contentNotes.filter((n) => n.contentItemId === item.id);
      const matches =
        item.title.toLowerCase().includes(q) ||
        item.displayNumber.toLowerCase().includes(q) ||
        item.contentId.toLowerCase().includes(q) ||
        (item.remarks && item.remarks.toLowerCase().includes(q)) ||
        assignees.some((a) => a.name.toLowerCase().includes(q)) ||
        (client && client.name.toLowerCase().includes(q)) ||
        itemNotes.some(
          (n) =>
            n.text.toLowerCase().includes(q) ||
            n.authorName.toLowerCase().includes(q)
        );
      if (!matches) return false;
    }

    return true;
  });

  const handleStartEditUrl = (item: ContentItem) => {
    setEditingUrlId(item.id);
    setUrlDraft(item.postUrl || '');
  };

  const handleSaveUrl = (itemId: string) => {
    const trimmed = urlDraft.trim();
    if (onUpdateStatusFields) {
      onUpdateStatusFields(itemId, { postUrl: trimmed });
    } else {
      onUpdatePostUrl(itemId, trimmed);
    }
    setEditingUrlId(null);
    setUrlDraft('');
  };

  const handleStartEditRemarks = (item: ContentItem) => {
    setEditingRemarksId(item.id);
    setRemarksDraft(item.remarks || '');
  };

  const handleSaveRemarks = (itemId: string) => {
    const trimmed = remarksDraft.trim();
    if (onUpdateStatusFields) {
      onUpdateStatusFields(itemId, { remarks: trimmed });
    }
    setEditingRemarksId(null);
    setRemarksDraft('');
  };

  const handleStartEditDate = (item: ContentItem) => {
    setEditingDateId(item.id);
    setDateDraft(item.actualPublishedDate || todayStr);
  };

  const handleSaveDate = (itemId: string) => {
    if (onUpdateStatusFields) {
      onUpdateStatusFields(itemId, { actualPublishedDate: dateDraft });
    }
    setEditingDateId(null);
    setDateDraft('');
  };

  const handleInlineStatusChange = (item: ContentItem, newStatus: ContentStatus) => {
    let actualPubDate = item.actualPublishedDate;
    if (newStatus === 'Published' && !actualPubDate) {
      actualPubDate = item.plannedDate || todayStr;
    }

    if (onUpdateStatusFields) {
      onUpdateStatusFields(item.id, {
        status: newStatus,
        actualPublishedDate: actualPubDate
      });
    } else {
      onUpdateItemStatus(item.id, newStatus, actualPubDate);
    }
  };

  // Group items by client if selected
  const clientsWithItems = clients.filter((c) =>
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
            <strong className="text-white">
              {monthName} {selectedYear}
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin ? (
            <button
              onClick={() => onAddItem(clientFilter || undefined)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-lg shadow-amber-400/20 shrink-0 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Content Item</span>
            </button>
          ) : currentRole === 'moderator' ? (
            <span className="text-xs text-indigo-300 bg-indigo-500/15 px-3 py-1.5 rounded-xl border border-indigo-500/30 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Moderator Access (Inline Live Editing)</span>
            </span>
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
              placeholder="Search by title, content # (e.g. Graphic Post 01), remarks, notes, assignee, or client..."
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
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
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
              <option value="Completed">Completed</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Approved">Approved</option>
              <option value="Published">Published</option>
              <option value="On Hold">On Hold</option>
            </select>

            {/* Assignee Filter Dropdown */}
            <select
              value={assigneeFilter}
              onChange={(e) => {
                setAssigneeFilter(e.target.value);
                setAssignedToMeOnly(false);
              }}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-amber-500"
            >
              <option value="All">All Assignees</option>
              <option value="unassigned">Unassigned Only</option>
              {teamMembers.map((m) => (
                <option key={m.uid} value={m.uid}>
                  {m.name} ({m.roleTitle})
                </option>
              ))}
            </select>

            {/* "Assigned to me" quick toggle for logged-in moderators */}
            {currentRole === 'moderator' && currentTeamMember && (
              <button
                type="button"
                onClick={() => setAssignedToMeOnly(!assignedToMeOnly)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  assignedToMeOnly
                    ? 'bg-indigo-500 text-slate-950 border-indigo-400 font-bold shadow-sm'
                    : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Assigned to me</span>
              </button>
            )}

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
          {assignedToMeOnly && currentTeamMember && (
            <span className="text-indigo-400 font-semibold ml-1">
              (assigned to {currentTeamMember.name})
            </span>
          )}
        </span>
        {(searchTerm ||
          clientFilter ||
          contentTypeFilter !== 'All' ||
          statusFilter !== 'All' ||
          assigneeFilter !== 'All' ||
          assignedToMeOnly ||
          timelineFilter !== 'All') && (
          <button
            onClick={() => {
              setSearchTerm('');
              setClientFilter('');
              setContentTypeFilter('All');
              setStatusFilter('All');
              setAssigneeFilter('All');
              setAssignedToMeOnly(false);
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
            const clientRecords = filteredItems.filter((i) => i.clientId === client.id);
            if (clientRecords.length === 0) return null;

            const publishedCount = clientRecords.filter((i) => i.status === 'Published').length;

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
                      <strong className="text-emerald-400">{publishedCount}</strong> /{' '}
                      {clientRecords.length} Published
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => onAddItem(client.id)}
                        className="px-2.5 py-1 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 text-xs font-semibold border border-amber-400/20 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Content Table for this Client */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider bg-slate-950/30">
                        <th className="py-2.5 px-4 font-semibold">Content # & ID</th>
                        <th className="py-2.5 px-4 font-semibold">Description</th>
                        {currentRole !== 'client' && (
                          <th className="py-2.5 px-4 font-semibold min-w-[260px]">Notes</th>
                        )}
                        <th className="py-2.5 px-4 font-semibold">Assigned To</th>
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
                          isHighlighted={highlightedId === item.id}
                          currentRole={currentRole}
                          canEditStatusFields={canEditStatusFields}
                          isAdmin={isAdmin}
                          notes={contentNotes.filter((n) => n.contentItemId === item.id)}
                          showNotesColumn={currentRole !== 'client'}
                          currentUserId={currentUserId}
                          onAddNote={(text) => onAddNote && onAddNote(item.id, text)}
                          onUpdateNote={onUpdateNote}
                          onDeleteNote={onDeleteNote}
                          onEditItem={onEditItem}
                          onDeleteItem={onDeleteItem}
                          onInlineStatusChange={handleInlineStatusChange}
                          editingUrlId={editingUrlId}
                          urlDraft={urlDraft}
                          setUrlDraft={setUrlDraft}
                          onStartEditUrl={handleStartEditUrl}
                          onSaveUrl={handleSaveUrl}
                          onCancelEditUrl={() => setEditingUrlId(null)}
                          editingRemarksId={editingRemarksId}
                          remarksDraft={remarksDraft}
                          setRemarksDraft={setRemarksDraft}
                          onStartEditRemarks={handleStartEditRemarks}
                          onSaveRemarks={handleSaveRemarks}
                          onCancelEditRemarks={() => setEditingRemarksId(null)}
                          editingDateId={editingDateId}
                          dateDraft={dateDraft}
                          setDateDraft={setDateDraft}
                          onStartEditDate={handleStartEditDate}
                          onSaveDate={handleSaveDate}
                          onCancelEditDate={() => setEditingDateId(null)}
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
                  <th className="py-3 px-4 font-semibold">Description</th>
                  {currentRole !== 'client' && (
                    <th className="py-3 px-4 font-semibold min-w-[260px]">Notes</th>
                  )}
                  <th className="py-3 px-4 font-semibold">Assigned To</th>
                  <th className="py-3 px-4 font-semibold">Planned Date</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Published Date</th>
                  <th className="py-3 px-4 font-semibold">Live URL</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredItems.map((item) => {
                  const client = clients.find((c) => c.id === item.clientId);
                  return (
                    <ContentRowItem
                      key={item.id}
                      item={item}
                      isHighlighted={highlightedId === item.id}
                      clientName={client?.name}
                      showClientColumn={true}
                      currentRole={currentRole}
                      canEditStatusFields={canEditStatusFields}
                      isAdmin={isAdmin}
                      notes={contentNotes.filter((n) => n.contentItemId === item.id)}
                      showNotesColumn={currentRole !== 'client'}
                      currentUserId={currentUserId}
                      onAddNote={(text) => onAddNote && onAddNote(item.id, text)}
                      onUpdateNote={onUpdateNote}
                      onDeleteNote={onDeleteNote}
                      onEditItem={onEditItem}
                      onDeleteItem={onDeleteItem}
                      onInlineStatusChange={handleInlineStatusChange}
                      editingUrlId={editingUrlId}
                      urlDraft={urlDraft}
                      setUrlDraft={setUrlDraft}
                      onStartEditUrl={handleStartEditUrl}
                      onSaveUrl={handleSaveUrl}
                      onCancelEditUrl={() => setEditingUrlId(null)}
                      editingRemarksId={editingRemarksId}
                      remarksDraft={remarksDraft}
                      setRemarksDraft={setRemarksDraft}
                      onStartEditRemarks={handleStartEditRemarks}
                      onSaveRemarks={handleSaveRemarks}
                      onCancelEditRemarks={() => setEditingRemarksId(null)}
                      editingDateId={editingDateId}
                      dateDraft={dateDraft}
                      setDateDraft={setDateDraft}
                      onStartEditDate={handleStartEditDate}
                      onSaveDate={handleSaveDate}
                      onCancelEditDate={() => setEditingDateId(null)}
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
  isHighlighted?: boolean;
  currentRole?: UserRole;
  canEditStatusFields: boolean;
  isAdmin: boolean;
  notes?: ContentNote[];
  showNotesColumn?: boolean;
  currentUserId?: string;
  onAddNote?: (text: string) => void | Promise<void>;
  onUpdateNote?: (noteId: string, text: string) => void | Promise<void>;
  onDeleteNote?: (noteId: string) => void | Promise<void>;
  onEditItem: (item: ContentItem) => void;
  onDeleteItem: (itemId: string) => void;
  onInlineStatusChange: (item: ContentItem, newStatus: ContentStatus) => void;
  editingUrlId: string | null;
  urlDraft: string;
  setUrlDraft: (val: string) => void;
  onStartEditUrl: (item: ContentItem) => void;
  onSaveUrl: (itemId: string) => void;
  onCancelEditUrl: () => void;
  editingRemarksId: string | null;
  remarksDraft: string;
  setRemarksDraft: (val: string) => void;
  onStartEditRemarks: (item: ContentItem) => void;
  onSaveRemarks: (itemId: string) => void;
  onCancelEditRemarks: () => void;
  editingDateId: string | null;
  dateDraft: string;
  setDateDraft: (val: string) => void;
  onStartEditDate: (item: ContentItem) => void;
  onSaveDate: (itemId: string) => void;
  onCancelEditDate: () => void;
}

const ContentRowItem: React.FC<ContentRowItemProps> = ({
  item,
  clientName,
  showClientColumn = false,
  isHighlighted = false,
  currentRole,
  canEditStatusFields,
  isAdmin,
  notes = [],
  showNotesColumn = false,
  currentUserId = '',
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onEditItem,
  onDeleteItem,
  onInlineStatusChange,
  editingUrlId,
  urlDraft,
  setUrlDraft,
  onStartEditUrl,
  onSaveUrl,
  onCancelEditUrl,
  editingRemarksId,
  remarksDraft,
  setRemarksDraft,
  onStartEditRemarks,
  onSaveRemarks,
  onCancelEditRemarks,
  editingDateId,
  dateDraft,
  setDateDraft,
  onStartEditDate,
  onSaveDate,
  onCancelEditDate
}) => {
  const isOverdue = isContentOverdue(item);

  return (
    <tr
      id={`tracker-row-${item.id}`}
      className={`transition-all duration-300 ${
        isHighlighted
          ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-slate-950 bg-red-950/40'
          : 'hover:bg-slate-800/30'
      }`}
    >
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
        <div className="text-[11px] font-mono text-slate-500 mt-0.5">{item.contentId}</div>
      </td>

      {/* Description / Title & Remarks */}
      <td className="py-3 px-4 max-w-md">
        <p className="font-medium text-slate-200 line-clamp-2">
          {item.title || '(No description provided)'}
        </p>

        {/* Remarks Editor / Display */}
        {canEditStatusFields && editingRemarksId === item.id ? (
          <div className="mt-1 flex items-center gap-1">
            <input
              type="text"
              value={remarksDraft}
              onChange={(e) => setRemarksDraft(e.target.value)}
              placeholder="Add remark or note..."
              className="bg-slate-950 border border-amber-500 rounded px-2 py-0.5 text-xs text-white w-48 focus:outline-none"
              autoFocus
            />
            <button
              onClick={() => onSaveRemarks(item.id)}
              className="p-1 bg-amber-400 text-slate-950 rounded hover:bg-amber-300"
              title="Save Note"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={onCancelEditRemarks}
              className="p-1 bg-slate-800 text-slate-400 rounded hover:text-white"
              title="Cancel"
            >
              ✕
            </button>
          </div>
        ) : item.remarks ? (
          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400 italic">
            <span className="line-clamp-1">Remark: {item.remarks}</span>
            {canEditStatusFields && (
              <button
                onClick={() => onStartEditRemarks(item)}
                className="text-slate-500 hover:text-amber-400 not-italic shrink-0 text-[10px]"
                title="Edit remarks"
              >
                edit
              </button>
            )}
          </div>
        ) : canEditStatusFields ? (
          <button
            onClick={() => onStartEditRemarks(item)}
            className="text-[10px] text-slate-500 hover:text-amber-400 mt-0.5 flex items-center gap-1"
          >
            <MessageSquare className="w-2.5 h-2.5" />
            <span>+ Add remark</span>
          </button>
        ) : null}
      </td>

      {/* Notes Column */}
      {showNotesColumn && (
        <td className="py-3 px-4 min-w-[260px] align-top">
          <ItemNotesCell
            notes={notes}
            role={currentRole}
            currentUserId={currentUserId}
            onAdd={(text) => onAddNote && onAddNote(text)}
            onUpdate={(noteId, text) => onUpdateNote && onUpdateNote(noteId, text)}
            onDelete={(noteId) => onDeleteNote && onDeleteNote(noteId)}
          />
        </td>
      )}

      {/* Assigned To Tag */}
      <td className="py-3 px-4 whitespace-nowrap">
        {(() => {
          const assignees = getItemAssignees(item);
          if (assignees.length === 0) {
            return <span className="text-slate-500 text-xs italic">Unassigned</span>;
          }
          return (
            <div
              className="flex items-center gap-1.5 flex-wrap"
              title={assignees
                .map(
                  (a) =>
                    `${a.name}${a.roleTitle ? ` (${a.roleTitle})` : ''}${
                      a.active === false ? ' [inactive]' : ''
                    }`
                )
                .join('\n')}
            >
              {assignees.slice(0, 2).map((a) => (
                <span
                  key={a.uid}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                    a.active === false
                      ? 'bg-slate-800/80 text-slate-400 border-slate-700'
                      : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                  }`}
                  title={a.roleTitle || 'Assigned member'}
                >
                  <UserCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="font-semibold">{a.name}</span>
                  {a.roleTitle && (
                    <span className="text-slate-400 text-[10px] hidden sm:inline">
                      ({a.roleTitle})
                    </span>
                  )}
                  {a.active === false && (
                    <span className="text-amber-400 font-semibold text-[10px] ml-0.5">
                      (inactive)
                    </span>
                  )}
                </span>
              ))}
              {assignees.length > 2 && (
                <span
                  className="px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700 cursor-default"
                  title={assignees
                    .slice(2)
                    .map((a) => `${a.name}${a.roleTitle ? ` (${a.roleTitle})` : ''}`)
                    .join('\n')}
                >
                  +{assignees.length - 2}
                </span>
              )}
            </div>
          );
        })()}
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

      {/* Status with Inline Dropdown Switcher (Admin & Moderator) or Badge (Viewer/Client) */}
      <td className="py-3 px-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <StatusBadge status={item.status} isOverdue={isOverdue} size="sm" />
          {canEditStatusFields && (
            <select
              value={item.status}
              onChange={(e) => onInlineStatusChange(item, e.target.value as ContentStatus)}
              className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[11px] text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
              title="Quick update status"
            >
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
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
        {canEditStatusFields && editingDateId === item.id ? (
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={dateDraft}
              onChange={(e) => setDateDraft(e.target.value)}
              className="bg-slate-950 border border-amber-500 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
              autoFocus
            />
            <button
              onClick={() => onSaveDate(item.id)}
              className="p-1 bg-amber-400 text-slate-950 rounded hover:bg-amber-300"
              title="Save Published Date"
            >
              <Check className="w-3 h-3" />
            </button>
            <button
              onClick={onCancelEditDate}
              className="p-1 bg-slate-800 text-slate-400 rounded hover:text-white"
              title="Cancel"
            >
              ✕
            </button>
          </div>
        ) : item.status === 'Published' && item.actualPublishedDate ? (
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>{item.actualPublishedDate}</span>
            </span>
            {canEditStatusFields && (
              <button
                onClick={() => onStartEditDate(item)}
                className="text-slate-500 hover:text-slate-300 text-[10px]"
                title="Edit date"
              >
                edit
              </button>
            )}
          </div>
        ) : canEditStatusFields ? (
          <button
            onClick={() => onStartEditDate(item)}
            className="text-slate-500 hover:text-amber-400 text-xs italic flex items-center gap-1"
          >
            <span>Not Published</span>
          </button>
        ) : (
          <span className="text-slate-500 italic">Not Published</span>
        )}
      </td>

      {/* Post URL */}
      <td className="py-3 px-4 whitespace-nowrap text-xs">
        {canEditStatusFields && editingUrlId === item.id ? (
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
            {canEditStatusFields && (
              <button
                onClick={() => onStartEditUrl(item)}
                className="text-slate-500 hover:text-slate-300 text-[10px]"
                title="Edit URL"
              >
                Edit
              </button>
            )}
          </div>
        ) : canEditStatusFields ? (
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

      {/* Actions (Admin only - edit full item, delete) */}
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
