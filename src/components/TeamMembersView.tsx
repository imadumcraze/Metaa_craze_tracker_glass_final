import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Shield,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Info,
  CheckSquare
} from 'lucide-react';
import { TeamMember, ContentItem } from '../types';
import { isAssignedTo } from '../lib/assignees';

interface TeamMembersViewProps {
  teamMembers: TeamMember[];
  contentItems: ContentItem[];
  onAddMember: () => void;
  onEditMember: (member: TeamMember) => void;
  onToggleActive: (memberId: string) => void;
  onDeleteMember: (memberId: string) => void;
  onResetAccess: (member: TeamMember) => void;
  onManageTasks?: (member: TeamMember) => void;
}

export const TeamMembersView: React.FC<TeamMembersViewProps> = ({
  teamMembers,
  contentItems,
  onAddMember,
  onEditMember,
  onToggleActive,
  onDeleteMember,
  onResetAccess,
  onManageTasks
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);
  const [memberToReset, setMemberToReset] = useState<TeamMember | null>(null);

  // Filter team members
  const filteredMembers = teamMembers.filter((m) => {
    if (statusFilter === 'Active' && !m.active) return false;
    if (statusFilter === 'Inactive' && m.active) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matches =
        m.name.toLowerCase().includes(q) ||
        m.roleTitle.toLowerCase().includes(q) ||
        m.username.toLowerCase().includes(q);
      if (!matches) return false;
    }
    return true;
  });

  const activeCount = teamMembers.filter((m) => m.active).length;
  const inactiveCount = teamMembers.length - activeCount;

  // Calculate assigned deliverables count per member
  const getAssignedCount = (memberId: string) => {
    return contentItems.filter((i) => isAssignedTo(i, memberId)).length;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-400" />
            <span>Team Members & Production Staff</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Manage moderator accounts, creative roles, and task assignment access
          </p>
        </div>

        <button
          onClick={onAddMember}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-lg shadow-amber-400/20 shrink-0 active:scale-95"
        >
          <UserPlus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Team Member</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Total Team Staff
            </span>
            <span className="text-2xl font-black text-white">{teamMembers.length}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Active Moderators
            </span>
            <div className="text-2xl font-black text-white">
              <span className="text-emerald-400">{activeCount}</span>
              <span className="text-slate-500 text-sm font-medium"> / {teamMembers.length}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-800 text-slate-400 border border-slate-700 flex items-center justify-center shrink-0">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Deactivated Accounts
            </span>
            <span className="text-2xl font-black text-slate-300">{inactiveCount}</span>
          </div>
        </div>
      </div>

      {/* Info notice about Moderator Privileges */}
      <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-start gap-3 text-xs text-indigo-300">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-white block">Moderator Role Permissions:</span>
          <p className="text-indigo-200/90 leading-relaxed">
            Active team members log in via the "Team Login" button with their username. Once logged in as moderators, they can update live status, published dates, post URLs, and remarks for any content item across the tracker. They cannot delete clients, edit deliverables structure, or view admin settings.
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, role title, or @username..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-slate-400">Status:</span>
          {(['All', 'Active', 'Inactive'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                statusFilter === filter
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 font-bold'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] uppercase tracking-wider bg-slate-950/50">
                <th className="py-3 px-4 font-semibold">Member & Username</th>
                <th className="py-3 px-4 font-semibold">Job Role Title</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Assigned Tasks</th>
                <th className="py-3 px-4 font-semibold">Created Date</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredMembers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No team members found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member) => {
                  const assignedCount = getAssignedCount(member.uid);
                  const createdDateStr = member.createdAt
                    ? new Date(member.createdAt).toLocaleDateString()
                    : '—';

                  return (
                    <tr key={member.uid} className="hover:bg-slate-800/30 transition-colors">
                      {/* Member Info & Username */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/20 border border-amber-400/30 flex items-center justify-center font-bold text-amber-300 text-xs shrink-0">
                            {member.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm">{member.name}</div>
                            <div className="font-mono text-[11px] text-amber-400/90 mt-0.5">
                              @{member.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Job Role Title */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs font-medium text-slate-200">
                          <span>{member.roleTitle}</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {member.active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                            <span>Inactive</span>
                          </span>
                        )}
                      </td>

                      {/* Assigned Tasks */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-medium text-slate-300">
                          <strong className="text-white">{assignedCount}</strong> deliverables
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 text-xs">
                        {createdDateStr}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Daily Tasks (Admin tool for active members) */}
                          {member.active && onManageTasks && (
                            <button
                              onClick={() => onManageTasks(member)}
                              className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
                              title="Daily Tasks"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Edit Name & Role */}
                          <button
                            onClick={() => onEditMember(member)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Edit Name & Role"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Active / Inactive */}
                          <button
                            onClick={() => onToggleActive(member.uid)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              member.active
                                ? 'text-emerald-400 hover:text-amber-400 hover:bg-slate-800'
                                : 'text-slate-500 hover:text-emerald-400 hover:bg-slate-800'
                            }`}
                            title={member.active ? 'Deactivate Member' : 'Reactivate Member'}
                          >
                            {member.active ? (
                              <UserX className="w-3.5 h-3.5" />
                            ) : (
                              <UserCheck className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Reset Access Hint */}
                          <button
                            onClick={() => setMemberToReset(member)}
                            className="p-1.5 rounded-lg text-amber-400/80 hover:text-amber-300 hover:bg-slate-800 transition-colors"
                            title="Reset Access / Replacement Account"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>

                          {/* Remove Member */}
                          <button
                            onClick={() => setMemberToDelete(member)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                            title="Remove Member Profile"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reset Access Guidance Modal */}
      {memberToReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <RotateCcw className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Reset Access for {memberToReset.name}</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Firebase client security prevents administrators from directly altering another user's password.
            </p>

            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-300">
              <span className="font-bold text-amber-400 block">Recommended Procedure:</span>
              <ol className="list-decimal list-inside space-y-1 text-slate-400">
                <li>
                  Deactivate the existing account for <strong>@{memberToReset.username}</strong> to block access.
                </li>
                <li>
                  Create a new replacement account for {memberToReset.name} with a new username (e.g. adding a suffix).
                </li>
                <li>
                  Provide the new credentials to the member.
                </li>
              </ol>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setMemberToReset(null)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const m = memberToReset;
                  setMemberToReset(null);
                  onResetAccess(m);
                }}
                className="px-4 py-2 text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md shadow-amber-400/20"
              >
                Deactivate & Create Replacement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Confirm Modal */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Remove {memberToDelete.name}?</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This action deletes <strong>{memberToDelete.name}</strong>'s profile document from the team database. Future login attempts by this user will be immediately blocked.
            </p>

            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 font-medium">
              ⚠️ Note: Because of Firebase Auth security, the username <strong>@{memberToDelete.username}</strong> cannot be reused for a new user.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setMemberToDelete(null)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const id = memberToDelete.uid;
                  setMemberToDelete(null);
                  onDeleteMember(id);
                }}
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-colors shadow-md shadow-red-600/20"
              >
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
