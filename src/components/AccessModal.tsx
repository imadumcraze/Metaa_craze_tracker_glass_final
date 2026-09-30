import React, { useState } from 'react';
import { UserRole, Client } from '../types';
import { ADMIN_EMAILS } from '../lib/adminConfig';
import {
  ShieldCheck,
  Eye,
  Building,
  KeyRound,
  X,
  Check,
  Copy,
  Lock
} from 'lucide-react';

interface AccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  currentClientId?: string;
  clients: Client[];
  onSelectRole: (role: UserRole, clientId?: string) => void;
}

export const AccessModal: React.FC<AccessModalProps> = ({
  isOpen,
  onClose,
  currentRole,
  currentClientId,
  clients,
  onSelectRole
}) => {
  const [activeTab, setActiveTab] = useState<'switcher' | 'grantAdmin' | 'clientLinks'>('switcher');
  const [selectedRole, setSelectedRole] = useState<UserRole>(currentRole);
  const [targetClientId, setTargetClientId] = useState<string>(
    currentClientId || (clients.length > 0 ? clients[0].id : '')
  );

  // Copy feedback states
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyRole = () => {
    if (selectedRole === 'client') {
      onSelectRole('client', targetClientId);
    } else {
      onSelectRole(selectedRole, undefined);
    }
    onClose();
  };

  const handleCopyViewerLink = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('role', 'viewer');
    url.searchParams.delete('client');
    url.searchParams.delete('key');
    navigator.clipboard.writeText(url.toString());
    setCopiedType('viewer');
    setTimeout(() => setCopiedType(null), 2500);
  };

  const handleCopyClientLink = (client: Client) => {
    const url = new URL(window.location.href);
    url.searchParams.set('role', 'client');
    url.searchParams.set('client', client.id);
    navigator.clipboard.writeText(url.toString());
    setCopiedType(`client-${client.id}`);
    setTimeout(() => setCopiedType(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 sticky top-0 z-10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Access Category & Role Manager</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Switch views, see approved admins, and share client portal links
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

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-800 bg-slate-950/40 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('switcher')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'switcher'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Role Switcher
          </button>
          <button
            onClick={() => setActiveTab('grantAdmin')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'grantAdmin'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Grant Admin Access</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400/20 text-amber-300">
              New
            </span>
          </button>
          <button
            onClick={() => setActiveTab('clientLinks')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'clientLinks'
                ? 'border-amber-400 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Client Portal Links ({clients.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* ========================================================= */}
          {/* TAB 1: ROLE SWITCHER */}
          {/* ========================================================= */}
          {activeTab === 'switcher' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                  Select Active Access Category
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Option 1: Admin Access */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('admin')}
                    className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      selectedRole === 'admin'
                        ? 'bg-amber-400/15 border-amber-400/60 ring-1 ring-amber-400/30'
                        : 'bg-slate-950/50 border-slate-800 hover:bg-slate-800/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-1.5 rounded-lg bg-amber-400/20 text-amber-400">
                          <ShieldCheck className="w-4 h-4" />
                        </div>
                        {selectedRole === 'admin' && (
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-white">1. Admin Access</h3>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Full agency control for management and directors. Create, edit, and delete everything.
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mt-3 block">
                      Full Privileges
                    </span>
                  </button>

                  {/* Option 2: Viewers Access */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('viewer')}
                    className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      selectedRole === 'viewer'
                        ? 'bg-blue-500/15 border-blue-500/60 ring-1 ring-blue-500/30'
                        : 'bg-slate-950/50 border-slate-800 hover:bg-slate-800/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                          <Eye className="w-4 h-4" />
                        </div>
                        {selectedRole === 'viewer' && (
                          <span className="w-2 h-2 rounded-full bg-blue-400" />
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-white">2. Viewers Access</h3>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        For other team members in the agency. View all clients, tracker, calendar & reports in read-only mode.
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mt-3 block">
                      Agency Read-Only
                    </span>
                  </button>

                  {/* Option 3: Client Access */}
                  <button
                    type="button"
                    onClick={() => setSelectedRole('client')}
                    className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      selectedRole === 'client'
                        ? 'bg-emerald-500/15 border-emerald-500/60 ring-1 ring-emerald-500/30'
                        : 'bg-slate-950/50 border-slate-800 hover:bg-slate-800/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                          <Building className="w-4 h-4" />
                        </div>
                        {selectedRole === 'client' && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        )}
                      </div>
                      <h3 className="font-bold text-sm text-white">3. Client Access</h3>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Personal portal for clients. Strict isolation: each client only sees their own deliverables.
                      </p>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider mt-3 block">
                      Strictly Isolated
                    </span>
                  </button>
                </div>
              </div>

              {/* If Client Role is selected, pick which client to view as */}
              {selectedRole === 'client' && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Select Target Client to Switch / Preview</span>
                  </div>

                  <select
                    value={targetClientId}
                    onChange={(e) => setTargetClientId(e.target.value)}
                    className="w-full bg-slate-900 border border-emerald-500/40 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-400 font-bold"
                  >
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.companyName ? `${c.name} (${c.companyName})` : c.name}
                      </option>
                    ))}
                  </select>

                  <p className="text-xs text-emerald-200/80">
                    Switching to Client mode will lock the interface so ONLY this client's deliverables, tracker records, and reports are accessible.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 2: HOW TO GIVE ANOTHER PERSON ADMIN ACCESS */}
          {/* ========================================================= */}
          {activeTab === 'grantAdmin' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-transparent border border-amber-400/30">
                <h3 className="font-bold text-sm text-amber-300 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>How Admin Access Works</span>
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Admin access is tied to approved Google accounts. Admins sign in with Google and are recognised automatically. There are no shared passcodes or invitation links. To add or remove an admin, the approved email list in src/lib/adminConfig.ts and firestore.rules must be updated.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Approved Admin Accounts
                </h4>
                <div className="space-y-1.5">
                  {ADMIN_EMAILS.map((email) => (
                    <div
                      key={email}
                      className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800/80 flex items-center gap-2 text-xs"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="font-bold text-white">{email}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Viewers Link Helper */}
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-blue-300 block">Need to invite regular agency staff?</span>
                  <span className="text-slate-400 text-[11px]">
                    Send them the Agency Viewers link (view all clients in read-only mode).
                  </span>
                </div>
                <button
                  onClick={handleCopyViewerLink}
                  className="px-3 py-1.5 bg-blue-500 text-slate-950 font-bold rounded-lg text-xs hover:bg-blue-400 transition-colors shrink-0"
                >
                  {copiedType === 'viewer' ? 'Copied Viewer Link!' : 'Copy Viewers Link'}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TAB 3: CLIENT PORTAL DIRECT LINKS */}
          {/* ========================================================= */}
          {activeTab === 'clientLinks' && (
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Client Direct Portal Access Links
                </h4>
                <p className="text-[11px] text-slate-400">
                  Copy each client's unique isolated link to send via WhatsApp or email. Each client will only see their own deliverables.
                </p>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {clients.map((client) => {
                  const isCopied = copiedType === `client-${client.id}`;
                  return (
                    <div
                      key={client.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{client.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-xs">
                          {[client.companyName, client.contactPerson ? `Contact: ${client.contactPerson}` : '']
                            .filter(Boolean)
                            .join(' • ')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            onSelectRole('client', client.id);
                            onClose();
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => handleCopyClientLink(client)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            isCopied
                              ? 'bg-emerald-500 text-slate-950 font-bold'
                              : 'bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Link</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/80 sticky bottom-0">
          <div className="text-xs text-slate-400">
            Currently active: <strong className="text-white capitalize">{currentRole}</strong>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            {activeTab === 'switcher' && (
              <button
                type="button"
                onClick={handleApplyRole}
                className="px-5 py-2 text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md shadow-amber-400/20"
              >
                Apply Selected Access
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
