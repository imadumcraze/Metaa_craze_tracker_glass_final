import React, { useState, useEffect } from 'react';
import { MONTH_NAMES } from '../lib/storage';
import { UserRole } from '../types';
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
  Lock
} from 'lucide-react';
import { googleSignIn, initAuth, logout } from '../lib/firebaseAuth';
import { User } from 'firebase/auth';

interface HeaderProps {
  selectedMonth: number;
  selectedYear: number;
  currentRole: UserRole;
  activeClientName?: string;
  onMonthChange: (month: number, year: number) => void;
  onOpenNewContentModal: () => void;
  onOpenAccessModal: () => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedMonth,
  selectedYear,
  currentRole,
  activeClientName,
  onMonthChange,
  onOpenNewContentModal,
  onOpenAccessModal,
  onResetData
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setCurrentUser(user);
      },
      () => {
        setCurrentUser(null);
      }
    );
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
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-xl tracking-tighter shrink-0">
              MC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-white uppercase">
                  Metaa Craze
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-400/10 text-amber-400 border border-amber-400/20 uppercase tracking-wider">
                  Tracker
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium truncate max-w-[160px] sm:max-w-none">
                Metaa Craze Productions (Pvt) Ltd.
              </p>
            </div>
          </div>

          {/* Month / Year Navigator */}
          <div className="flex items-center gap-1 sm:gap-2 bg-slate-950/70 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 px-1.5">
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange(Number(e.target.value), selectedYear)}
                className="bg-transparent text-xs sm:text-sm font-bold text-white focus:outline-none cursor-pointer hover:text-amber-400 transition-colors"
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
                className="bg-transparent text-xs sm:text-sm font-bold text-amber-400 focus:outline-none cursor-pointer"
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
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
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
            {/* 3 Categories Access Switcher Button */}
            <button
              onClick={onOpenAccessModal}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-sm ${
                currentRole === 'admin'
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

            {/* Google Sheets Connection (hidden in client mode) */}
            {currentRole !== 'client' && (
              currentUser ? (
                <div className="hidden lg:flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-2.5 py-1.5 text-xs text-emerald-400">
                  <Sheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-medium">Sheets Connected</span>
                  <button
                    onClick={handleLogout}
                    title="Disconnect Google Sheets"
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
                  title="Connect Google Sheets to export client reports"
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  </svg>
                  <span>
                    {isSigningIn ? 'Connecting...' : 'Connect Sheets'}
                  </span>
                </button>
              )
            )}

            {/* Quick Add Content Button (Admin only) */}
            {currentRole === 'admin' ? (
              <button
                onClick={onOpenNewContentModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-md shadow-amber-400/20 active:scale-95"
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
