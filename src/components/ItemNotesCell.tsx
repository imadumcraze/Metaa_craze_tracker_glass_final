import React, { useState } from 'react';
import { ContentNote, UserRole } from '../types';
import { Plus, Edit2, Trash2, Check, X } from 'lucide-react';

interface ItemNotesCellProps {
  notes: ContentNote[];
  role?: UserRole;
  currentUserId?: string;
  onAdd: (text: string) => void | Promise<void>;
  onUpdate: (noteId: string, text: string) => void | Promise<void>;
  onDelete: (noteId: string) => void | Promise<void>;
}

const formatNoteDate = (isoString: string): string => {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Colombo',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return formatter.format(d).replace(/\b(am|pm)\b/gi, (m) => m.toUpperCase());
  } catch (e) {
    return isoString;
  }
};

const getAuthorLabel = (note: ContentNote): string => {
  if (note.authorRole === 'admin') {
    return 'Admin';
  }
  if (note.authorTitle && note.authorTitle.trim()) {
    return `${note.authorName} (${note.authorTitle.trim()})`;
  }
  return note.authorName || 'Team Member';
};

export const ItemNotesCell: React.FC<ItemNotesCellProps> = ({
  notes,
  role = 'viewer',
  currentUserId = '',
  onAdd,
  onUpdate,
  onDelete
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteDraft, setNewNoteDraft] = useState('');

  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');

  const canAdd = role === 'admin' || role === 'moderator';

  const canModify = (note: ContentNote): boolean => {
    if (role === 'admin') return true;
    if (role === 'moderator' && currentUserId && note.authorId === currentUserId) return true;
    return false;
  };

  // Sort notes oldest to newest
  const sortedNotes = [...notes].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  const handleStartEdit = (note: ContentNote) => {
    setEditingNoteId(note.id);
    setEditDraft(note.text);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditDraft('');
  };

  const handleSaveEdit = (noteId: string) => {
    const trimmed = editDraft.trim();
    if (!trimmed) return;
    onUpdate(noteId, trimmed);
    setEditingNoteId(null);
    setEditDraft('');
  };

  const handleDelete = (note: ContentNote) => {
    if (window.confirm('Delete this note?')) {
      onDelete(note.id);
    }
  };

  const handleSaveNew = () => {
    const trimmed = newNoteDraft.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setNewNoteDraft('');
    setIsAdding(false);
  };

  const handleCancelNew = () => {
    setNewNoteDraft('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-2 text-xs py-1">
      {/* Existing Notes List */}
      {sortedNotes.length > 0 ? (
        <div className="space-y-2">
          {sortedNotes.map((note) => {
            const isEditing = editingNoteId === note.id;
            const authorLabel = getAuthorLabel(note);
            const formattedDate = formatNoteDate(note.createdAt);
            const editedSuffix = note.edited
              ? note.editedByName
                ? ` (edited by ${note.editedByName})`
                : ' (edited)'
              : '';
            const footerText = `${authorLabel} · ${formattedDate}${editedSuffix}`;

            if (isEditing) {
              return (
                <div
                  key={note.id}
                  className="bg-slate-950 border border-amber-500/80 rounded-lg p-2 space-y-1.5 shadow-sm"
                >
                  <textarea
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveEdit(note.id);
                      }
                    }}
                    rows={2}
                    maxLength={2000}
                    placeholder="Edit note... (Ctrl+Enter to save)"
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-y"
                    autoFocus
                  />
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <span className="text-[10px] text-slate-500">
                      {editDraft.length}/2000 · Ctrl+Enter to save
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-2 py-0.5 rounded text-[11px] font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(note.id)}
                        disabled={!editDraft.trim()}
                        className="px-2 py-0.5 rounded text-[11px] font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 transition-colors flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={note.id}
                className="group relative bg-slate-950/70 hover:bg-slate-950 border border-slate-800/90 hover:border-slate-750 rounded-lg p-2 transition-colors"
              >
                <div className="flex items-start justify-between gap-1.5">
                  <p className="text-xs text-slate-200 whitespace-pre-wrap break-words flex-1 leading-relaxed">
                    {note.text}
                  </p>
                  {canModify(note) && (
                    <div className="flex items-center gap-0.5 shrink-0 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(note)}
                        className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors"
                        title="Edit note"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(note)}
                        className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                        title="Delete note"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-[10px] text-slate-400/90 mt-1.5 font-medium">
                  {footerText}
                </div>
              </div>
            );
          })}
        </div>
      ) : !canAdd ? (
        <span className="text-slate-500 text-xs italic">No notes</span>
      ) : null}

      {/* Add Note Section (Admin & Moderator) */}
      {canAdd && (
        <div>
          {isAdding ? (
            <div className="bg-slate-950 border border-amber-500/80 rounded-lg p-2 space-y-1.5 shadow-sm">
              <textarea
                value={newNoteDraft}
                onChange={(e) => setNewNoteDraft(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    handleSaveNew();
                  }
                }}
                rows={2}
                maxLength={2000}
                placeholder="Write a note... (Ctrl+Enter to save)"
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-400 resize-y"
                autoFocus
              />
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <span className="text-[10px] text-slate-500">
                  {newNoteDraft.length}/2000 · Ctrl+Enter to save
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCancelNew}
                    className="px-2 py-0.5 rounded text-[11px] font-medium text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveNew}
                    disabled={!newNoteDraft.trim()}
                    className="px-2 py-0.5 rounded text-[11px] font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 transition-colors flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" />
                    <span>Save</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="text-[11px] text-slate-400 hover:text-amber-400 font-medium inline-flex items-center gap-1 transition-colors py-0.5"
            >
              <Plus className="w-3 h-3" />
              <span>Add note</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
