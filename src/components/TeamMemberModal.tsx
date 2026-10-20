import React, { useState, useEffect } from 'react';
import { X, User, Briefcase, KeyRound, Lock, Eye, EyeOff, AlertCircle, RefreshCw, ShieldCheck } from 'lucide-react';
import { TeamMember } from '../types';
import { validateUsername } from '../lib/teamService';

interface TeamMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    uid?: string;
    name: string;
    roleTitle: string;
    username: string;
    password?: string;
  }) => Promise<void>;
  memberToEdit?: TeamMember | null;
}

export const TeamMemberModal: React.FC<TeamMemberModalProps> = ({
  isOpen,
  onClose,
  onSave,
  memberToEdit
}) => {
  const [name, setName] = useState('');
  const [roleTitle, setRoleTitle] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (memberToEdit) {
      setName(memberToEdit.name);
      setRoleTitle(memberToEdit.roleTitle);
      setUsername(memberToEdit.username);
      setPassword('');
    } else {
      setName('');
      setRoleTitle('Graphic Designer');
      setUsername('');
      setPassword('');
    }
    setError(null);
  }, [memberToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter the full name.');
      return;
    }

    if (!roleTitle.trim()) {
      setError('Please select or specify a job role title.');
      return;
    }

    if (!memberToEdit) {
      const val = validateUsername(username);
      if (!val.valid) {
        setError(val.error || 'Invalid username format.');
        return;
      }

      if (!password || password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await onSave({
        uid: memberToEdit?.uid,
        name: name.trim(),
        roleTitle: roleTitle.trim(),
        username: username.trim().toLowerCase(),
        password: password || undefined
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save team member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const commonRoles = [
    'Graphic Designer',
    'Senior Graphic Designer',
    'Video Editor',
    'Motion Designer',
    'Content Writer',
    'Social Media Strategist',
    'Creative Director'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-400/10 text-amber-400 border border-amber-400/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {memberToEdit ? 'Edit Team Member' : 'Add New Team Member'}
              </h2>
              <p className="text-xs text-slate-400">
                {memberToEdit
                  ? 'Update member display details and assigned role title'
                  : 'Provision account credentials and production privileges'}
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kasun Bandara"
                className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-medium"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Job Role Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Job Role Title *
            </label>
            <div className="space-y-2">
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g. Graphic Designer / Video Editor / Content Writer"
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-medium"
                  required
                />
              </div>

              {/* Quick suggestions pills */}
              <div className="flex flex-wrap gap-1.5">
                {commonRoles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setRoleTitle(role)}
                    className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
                      roleTitle === role
                        ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Username Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Username {memberToEdit ? '(Locked)' : '*'}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-slate-500 font-mono text-sm">@</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
                placeholder="e.g. kasun.design"
                disabled={!!memberToEdit}
                className={`w-full bg-slate-950/80 border rounded-xl pl-8 pr-3.5 py-2.5 text-sm font-mono ${
                  memberToEdit
                    ? 'border-slate-800 text-slate-500 cursor-not-allowed'
                    : 'border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500'
                }`}
                required
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {memberToEdit
                ? 'Username cannot be modified after creation.'
                : '3-20 characters: lowercase letters, numbers, dot, or underscore.'}
            </p>
          </div>

          {/* Password Field (Only when creating) */}
          {!memberToEdit && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Initial Password * (min 6 characters)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Set initial login password"
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white p-0.5"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                The member can change their password after logging in.
              </p>
            </div>
          )}

          {memberToEdit && (
            <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-400">
              <span className="font-semibold text-slate-300 block mb-0.5">Note on credentials:</span>
              To reset credentials for this member, use the "Reset Access" button in the Team Members table to create a replacement account.
            </div>
          )}

          {/* Actions */}
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
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-all shadow-md shadow-amber-400/20 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{memberToEdit ? 'Save Changes' : 'Create Account'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
