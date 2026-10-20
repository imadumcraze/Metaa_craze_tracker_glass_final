import React, { useState, useEffect } from 'react';
import { ContentItem, ContentType, ContentStatus, Client, MonthlyPackage, TeamMember, ContentAssignee } from '../types';
import { MONTH_NAMES, formatDisplayNumber, formatContentNumber } from '../lib/storage';
import { getSriLankaToday } from '../lib/dateUtils';
import { getItemAssignees, buildAssigneeFields } from '../lib/assignees';
import { X, Calendar, Link as LinkIcon, AlertCircle, UserCheck } from 'lucide-react';

interface ContentItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: ContentItem) => void;
  itemToEdit?: ContentItem | null;
  clients: Client[];
  packages: MonthlyPackage[];
  teamMembers?: TeamMember[];
  defaultMonth: number;
  defaultYear: number;
  defaultClientId?: string;
  existingItems: ContentItem[];
}

export const ContentItemModal: React.FC<ContentItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  itemToEdit,
  clients,
  packages,
  teamMembers = [],
  defaultMonth,
  defaultYear,
  defaultClientId,
  existingItems
}) => {
  const [clientId, setClientId] = useState('');
  const [contentType, setContentType] = useState<ContentType>('Graphic Post');
  const [contentNumber, setContentNumber] = useState(1);
  const [title, setTitle] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [actualPublishedDate, setActualPublishedDate] = useState('');
  const [status, setStatus] = useState<ContentStatus>('Not Started');
  const [postUrl, setPostUrl] = useState('');
  const [remarks, setRemarks] = useState('');
  const [selectedAssigneeUids, setSelectedAssigneeUids] = useState<string[]>([]);
  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);
  const [contentId, setContentId] = useState('');
  const [error, setError] = useState('');

  // Auto-find next content number for the selected client, month, year, and content type
  const calculateNextNumber = (cId: string, cType: ContentType, m: number, y: number) => {
    const matching = existingItems.filter(
      item => item.clientId === cId && item.contentType === cType && item.month === m && item.year === y
    );
    if (matching.length === 0) return 1;
    const maxNum = Math.max(...matching.map(i => i.contentNumber || 0));
    return maxNum + 1;
  };

  useEffect(() => {
    if (itemToEdit) {
      setClientId(itemToEdit.clientId);
      setContentType(itemToEdit.contentType);
      setContentNumber(itemToEdit.contentNumber);
      setTitle(itemToEdit.title);
      setPlannedDate(itemToEdit.plannedDate || '');
      setActualPublishedDate(itemToEdit.actualPublishedDate || '');
      setStatus(itemToEdit.status);
      setPostUrl(itemToEdit.postUrl || '');
      setRemarks(itemToEdit.remarks || '');
      setSelectedAssigneeUids(getItemAssignees(itemToEdit).map((a) => a.uid));
      setMonth(itemToEdit.month);
      setYear(itemToEdit.year);
      setContentId(itemToEdit.contentId);
    } else {
      const activeClients = clients.filter(c => c.status === 'Active');
      const initialClient = defaultClientId || (activeClients.length > 0 ? activeClients[0].id : '');
      setClientId(initialClient);
      setContentType('Graphic Post');
      const nextNum = calculateNextNumber(initialClient, 'Graphic Post', defaultMonth, defaultYear);
      setContentNumber(nextNum);
      setTitle('');
      setPlannedDate('');
      setActualPublishedDate('');
      setStatus('Not Started');
      setPostUrl('');
      setRemarks('');
      setSelectedAssigneeUids([]);
      setMonth(defaultMonth);
      setYear(defaultYear);
      const rand = Math.floor(100 + Math.random() * 900);
      setContentId(`CNT-${defaultYear}${defaultMonth < 10 ? '0' + defaultMonth : defaultMonth}-${rand}`);
    }
    setError('');
  }, [itemToEdit, clients, defaultMonth, defaultYear, defaultClientId, isOpen]);

  // When client or content type changes in "Add" mode, auto update number
  const handleClientChange = (newClientId: string) => {
    setClientId(newClientId);
    if (!itemToEdit) {
      setContentNumber(calculateNextNumber(newClientId, contentType, month, year));
    }
  };

  const handleContentTypeChange = (newType: ContentType) => {
    setContentType(newType);
    if (!itemToEdit) {
      setContentNumber(calculateNextNumber(clientId, newType, month, year));
    }
  };

  const handleStatusChange = (newStatus: ContentStatus) => {
    setStatus(newStatus);
    // If user marks as Published and actualPublishedDate is empty, auto-fill planned date or today
    if (newStatus === 'Published' && !actualPublishedDate) {
      const today = getSriLankaToday();
      setActualPublishedDate(plannedDate || today);
    }
  };

  const handleToggleAssignee = (uid: string) => {
    setSelectedAssigneeUids((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleRemoveAssignee = (uid: string) => {
    setSelectedAssigneeUids((prev) => prev.filter((id) => id !== uid));
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      setError('Please select a client.');
      return;
    }

    if (!title.trim()) {
      setError('Please provide a content description / title.');
      return;
    }

    // Find corresponding package
    const pkg = packages.find(p => p.clientId === clientId && p.month === month && p.year === year);
    const packageId = pkg ? pkg.id : `pkg-${year}-${month}-${clientId}`;

    // If status is Published, ensure actual published date
    if (status === 'Published' && !actualPublishedDate) {
      setError('Please provide the Actual Published Date when marking as Published.');
      return;
    }

    const selectedAssignees: ContentAssignee[] = selectedAssigneeUids.map((uid) => {
      const member = teamMembers.find((m) => m.uid === uid);
      if (member) {
        return {
          uid: member.uid,
          name: member.name,
          roleTitle: member.roleTitle,
          active: member.active
        };
      }
      const existing = getItemAssignees(itemToEdit).find((a) => a.uid === uid);
      return existing || { uid, name: 'Member', active: false };
    });
    const assigneeFields = buildAssigneeFields(selectedAssignees);

    const item: ContentItem = {
      id: itemToEdit?.id || `cnt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      contentId: contentId || `CNT-${year}${month < 10 ? '0' + month : month}-${Date.now().toString().slice(-3)}`,
      clientId,
      packageId,
      month,
      year,
      contentType,
      contentNumber: Number(contentNumber) || 1,
      displayNumber: formatDisplayNumber(contentType, Number(contentNumber) || 1),
      title: title.trim(),
      plannedDate,
      actualPublishedDate: status === 'Published' ? actualPublishedDate : '',
      status,
      postUrl: postUrl.trim(),
      remarks: remarks.trim(),
      createdAt: itemToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: itemToEdit?.completedAt,
      completedById: itemToEdit?.completedById,
      ...assigneeFields
    };

    onSave(item);
    onClose();
  };

  const visibleTeamMembers = teamMembers.filter((m) => m.active || selectedAssigneeUids.includes(m.uid));

  const selectableClients = clients.filter((c) => {
    if (c.status === 'Active') return true;
    if (itemToEdit && c.id === itemToEdit.clientId) return true;
    return false;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">
                {itemToEdit ? 'Edit Content Item' : 'New Content Item'}
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/20">
                {formatDisplayNumber(contentType, Number(contentNumber) || 1)}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Production tracking record for Metaa Craze client deliverables
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Client & Period */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Client *
              </label>
              <select
                value={clientId}
                onChange={(e) => handleClientChange(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="">Select client...</option>
                {selectableClients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}{c.status === 'Inactive' ? ' (inactive)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Month
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx + 1}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Year
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Content Type & Numbering */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Content Type *
              </label>
              <select
                value={contentType}
                onChange={(e) => handleContentTypeChange(e.target.value as ContentType)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-medium"
              >
                <option value="Graphic Post">Graphic Post (Carousel / Single Image)</option>
                <option value="Video">Video / Reel / TikTok</option>
                <option value="Special Day Post">Special Day Post (Poya / Holiday / Event)</option>
                <option value="Cover Photo">Cover Photo (Banner / Header)</option>
                <option value="Other">Other Content</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Content Number #
              </label>
              <input
                type="number"
                min="1"
                max="999"
                value={contentNumber}
                onChange={(e) => setContentNumber(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white text-center font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Content Title / Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Content Title / Description *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              placeholder="e.g. 10% discount for formal wear early bird / Weekend reels showcase..."
            />
          </div>

          {/* Workflow Status */}
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Workflow Status
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(['Not Started', 'In Progress', 'Completed', 'Pending Approval', 'Approved', 'Published', 'On Hold'] as ContentStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleStatusChange(st)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border text-left transition-all ${
                    status === st
                      ? 'bg-amber-400/20 text-amber-300 border-amber-400/60 shadow-sm'
                      : 'bg-slate-800/50 text-slate-400 border-slate-700 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Assigned Team Members Multi-Select */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Assigned Team Members</span>
              </label>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-slate-400 font-medium">
                  {selectedAssigneeUids.length} selected
                </span>
                <span className="text-slate-500 font-normal">· Optional</span>
              </div>
            </div>

            {/* Removable chips of selected members above list */}
            {selectedAssigneeUids.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2 p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                {selectedAssigneeUids.map((uid) => {
                  const member = teamMembers.find((m) => m.uid === uid);
                  const existingAssignee = getItemAssignees(itemToEdit).find((a) => a.uid === uid);
                  const name = member?.name || existingAssignee?.name || 'Member';
                  const isInactive = member ? !member.active : existingAssignee?.active === false;

                  return (
                    <span
                      key={uid}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${
                        isInactive
                          ? 'bg-slate-800 text-slate-400 border-slate-700'
                          : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                      }`}
                    >
                      <span>{name}</span>
                      {isInactive && (
                        <span className="text-[10px] text-amber-400 font-semibold">(inactive)</span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveAssignee(uid)}
                        className="text-slate-400 hover:text-white transition-colors ml-0.5"
                        title={`Remove ${name}`}
                      >
                        ✕
                      </button>
                    </span>
                  );
                })}
              </div>
            )}

            {/* Scrollable list of active team members + already-assigned inactive members */}
            <div className="max-h-48 overflow-y-auto space-y-1 p-2 bg-slate-950/80 rounded-xl border border-slate-800">
              {visibleTeamMembers.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-500">
                  No team members available.
                </div>
              ) : (
                visibleTeamMembers.map((m) => {
                  const isSelected = selectedAssigneeUids.includes(m.uid);
                  return (
                    <label
                      key={m.uid}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors text-xs ${
                        isSelected
                          ? 'bg-slate-800/80 border border-slate-700 text-white'
                          : 'hover:bg-slate-900/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleAssignee(m.uid)}
                          className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                        <div className="min-w-0 truncate">
                          <span className="font-semibold">{m.name}</span>
                          {m.roleTitle && (
                            <span className="text-slate-400 ml-1.5 font-normal">
                              ({m.roleTitle})
                            </span>
                          )}
                        </div>
                      </div>
                      {!m.active && (
                        <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 shrink-0 ml-2">
                          inactive
                        </span>
                      )}
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Planned Publishing Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="date"
                  value={plannedDate}
                  onChange={(e) => setPlannedDate(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Actual Published Date</span>
                {status === 'Published' && (
                  <span className="text-[10px] text-amber-400 font-normal">Required for Published</span>
                )}
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="date"
                  value={actualPublishedDate}
                  onChange={(e) => setActualPublishedDate(e.target.value)}
                  className={`w-full bg-slate-800/80 border ${status === 'Published' && !actualPublishedDate ? 'border-amber-500/70' : 'border-slate-700'} rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500`}
                />
              </div>
            </div>
          </div>

          {/* Post URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Live Social Media Post URL
            </label>
            <div className="relative">
              <LinkIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="url"
                value={postUrl}
                onChange={(e) => setPostUrl(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                placeholder="https://instagram.com/p/... or https://tiktok.com/..."
              />
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Remarks & Production Notes
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              placeholder="Design revisions, client feedback, photoshoot schedule, engagement metrics..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow-lg shadow-amber-400/20"
            >
              {itemToEdit ? 'Save Changes' : 'Create Content Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
