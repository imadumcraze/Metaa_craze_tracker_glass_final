import React, { useState, useEffect } from 'react';
import { MONTH_NAMES } from '../lib/storage';
import { UserRole, TeamMember } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Layers,
  Sparkles,
  LogOut,
  Sheet,
  ShieldCheck,
  Eye,
  Building,
  KeyRound,
  Lock,
  Cloud,
  CloudOff,
  RefreshCw,
  UserCheck,
  Key
} from 'lucide-react';
import { googleSignIn, subscribeToAuthUser, logout } from '../lib/firebaseAuth';
import { User } from 'firebase/auth';

interface HeaderProps {
  selectedMonth: number;
  selectedYear: number;
  currentRole: UserRole;
  activeClientName?: string;
  currentTeamMember?: TeamMember | null;
  syncStatus?: 'connected' | 'offline' | 'syncing' | 'error';
  canSwitchRole: boolean;
  onMonthChange: (month: number, year: number) => void;
  onOpenNewContentModal: () => void;
  onOpenAccessModal: () => void;
  onResetData: () => void;
  onGoogleSignInSuccess?: () => void;
  onTeamLoginClick?: () => void;
  onTeamLogout?: () => void;
  onChangePasswordClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedMonth,
  selectedYear,
  currentRole,
  activeClientName,
  currentTeamMember,
  syncStatus = 'offline',
  canSwitchRole,
  onMonthChange,
  onOpenNewContentModal,
  onOpenAccessModal,
  onResetData,
  onGoogleSignInSuccess,
  onTeamLoginClick,
  onTeamLogout,
  onChangePasswordClick
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToAuthUser((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      onMonthChange(12, selectedYear - 1);
    } else {
      onMonthChange(selectedMonth - 1, selectedYear);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      onMonthChange(1, selectedYear + 1);
    } else {
      onMonthChange(selectedMonth + 1, selectedYear);
    }
  };

  const handleCurrentMonth = () => {
    onMonthChange(10, 2026);
  };

  const handleGoogleLogin = async () => {
    try {
      setIsSigningIn(true);
      await googleSignIn();
      if (onGoogleSignInSuccess) onGoogleSignInSuccess();
    } catch (err) {
      console.error('Google Sign In failed:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setCurrentUser(null);
  };

  return (
    <header className="w-full bg-transparent border-b border-white/10">
      <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12">
        <div className="topbar-header-inner flex items-center justify-between h-16 sm:h-20 gap-3 transition-all duration-200">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Metaa Craze"
              className="topbar-logo h-12 sm:h-14 w-auto object-contain shrink-0 transition-all duration-200"
            />
            <span className="topbar-tracker-badge hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-400/10 text-amber-400 border border-amber-400/20 uppercase tracking-wider transition-all duration-200">
              Tracker
            </span>
          </div>

          {/* Month / Year Navigator */}
          <div className="topbar-month-picker flex items-center gap-1 sm:gap-2 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800 transition-all duration-200">
            <button
              onClick={handlePrevMonth}
              title="Previous Month"
              className="topbar-month-btn p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 px-1.5">
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange(Number(e.target.value), selectedYear)}
                className="topbar-month-select bg-transparent text-xs sm:text-sm font-bold text-white focus:outline-none cursor-pointer hover:text-amber-400 transition-colors"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx + 1} className="bg-slate-900 text-white">
                    {m}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => onMonthChange(selectedMonth, Number(e.target.value))}
                className="topbar-year-select bg-transparent text-xs sm:text-sm font-bold text-amber-400 focus:outline-none cursor-pointer"
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y} className="bg-slate-900 text-white">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleNextMonth}
              title="Next Month"
              className="topbar-month-btn p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!(selectedMonth === 10 && selectedYear === 2026) && (
              <button
                onClick={handleCurrentMonth}
                className="hidden md:inline-flex text-[11px] font-semibold text-amber-400 hover:text-amber-300 px-2 py-1 rounded bg-amber-400/10 border border-amber-400/20 transition-colors"
              >
                Oct 2026
              </button>
            )}
          </div>

          {/* Right Actions: Access Role Switcher, Sheets Auth & Quick Add Content */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Access Role Badge / Switcher */}
            {canSwitchRole ? (
              <button
                onClick={onOpenAccessModal}
                className={`topbar-admin-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-sm ${currentRole === 'admin'
                    ? 'bg-amber-400/15 text-amber-300 border-amber-400/40 hover:bg-amber-400/25'
                    : currentRole === 'viewer'
                      ? 'bg-blue-500/15 text-blue-300 border-blue-500/40 hover:bg-blue-500/25'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25'
                  }`}
                title="Click to switch access permissions or copy client portal links"
              >
                {currentRole === 'admin' && (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">Admin (Management)</span>
                    <span className="sm:hidden">Admin</span>
                  </>
                )}
                {currentRole === 'viewer' && (
                  <>
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    <span className="hidden sm:inline">Viewer (Read Only)</span>
                    <span className="sm:hidden">Viewer</span>
                  </>
                )}
                {currentRole === 'client' && (
                  <>
                    <Building className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="truncate max-w-[120px] sm:max-w-[160px]">
                      Client: {activeClientName || 'Portal'}
                    </span>
                  </>
                )}
              </button>
            ) : (
              <div
                className={`topbar-admin-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border shadow-sm ${currentRole === 'moderator'
                    ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40'
                    : currentRole === 'viewer'
                      ? 'bg-blue-500/15 text-blue-300 border-blue-500/40'
                      : currentRole === 'client'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                        : 'bg-amber-400/15 text-amber-300 border-amber-400/40'
                  }`}
              >
                {currentRole === 'moderator' && (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="truncate max-w-[130px] sm:max-w-[180px]">
                      {currentTeamMember?.name || 'Team Member'}
                    </span>
                    {currentTeamMember?.roleTitle && (
                      <span className="text-slate-400 font-normal hidden sm:inline">
                        · {currentTeamMember.roleTitle}
                      </span>
                    )}
                  </>
                )}
                {currentRole === 'viewer' && (
                  <>
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    <span className="hidden sm:inline">Viewer (Read Only)</span>
                    <span className="sm:hidden">Viewer</span>
                  </>
                )}
                {currentRole === 'client' && (
                  <>
                    <Building className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="truncate max-w-[120px] sm:max-w-[160px]">
                      Client: {activeClientName || 'Portal'}
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Team Login Button (visible to Viewers only, hidden for Admin/Client/Moderator) */}
            {currentRole === 'viewer' && onTeamLoginClick && (
              <button
                onClick={onTeamLoginClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/25 transition-all shadow-sm active:scale-95"
                title="Log in with your team username to update deliverables"
              >
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                <span>Team Login</span>
              </button>
            )}

            {/* Moderator Session Controls (Change Password & Logout) */}
            {currentRole === 'moderator' && (
              <div className="flex items-center gap-1">
                {onChangePasswordClick && (
                  <button
                    onClick={onChangePasswordClick}
                    title="Change password"
                    className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-amber-400 hover:bg-slate-700 transition-colors border border-slate-700 text-xs flex items-center gap-1"
                  >
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden md:inline">Password</span>
                  </button>
                )}
                {onTeamLogout && (
                  <button
                    onClick={onTeamLogout}
                    title="Sign out of team session"
                    className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors border border-slate-700 text-xs flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden md:inline">Logout</span>
                  </button>
                )}
              </div>
            )}

            {/* Google Sheets & Cloud Connection (hidden in client & moderator modes) */}
            {currentRole !== 'client' && currentRole !== 'moderator' && (
              currentUser ? (
                <div className="hidden lg:flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-2.5 py-1.5 text-xs text-emerald-400">
                  <Cloud className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold">Cloud Synced</span>
                  <span className="text-slate-600">•</span>
                  <Sheet className="w-3 h-3 text-emerald-400" />
                  <span className="font-medium text-emerald-300">Sheets</span>
                  <button
                    onClick={handleLogout}
                    title="Sign Out of Google"
                    className="text-slate-400 hover:text-red-400 ml-1 p-0.5"
                  >
                    <LogOut className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGoogleLogin}
                  disabled={isSigningIn}
                  className="gsi-material-button hidden md:inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700/80 border border-slate-700 rounded-xl transition-all shadow-sm"
                  title="Sign in with Google to sync with Cloud Firestore and export client reports"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>
                    {isSigningIn ? 'Connecting...' : 'Connect & Sync'}
                  </span>
                </button>
              )
            )}

            {/* Quick Add Content Button (Admin only) */}
            {currentRole === 'admin' ? (
              <button
                onClick={onOpenNewContentModal}
                className="topbar-add-btn inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-md shadow-amber-400/20 active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span className="hidden xs:inline">Add Content</span>
              </button>
            ) : currentRole === 'viewer' ? (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs text-blue-400 font-semibold px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Eye className="w-3 h-3" />
                <span>Read-Only</span>
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};
