import React from 'react';
import { TabType, UserRole } from '../types';
import {
  LayoutDashboard,
  Users,
  Package,
  CheckSquare,
  CalendarDays,
  FileSpreadsheet,
  UsersRound
} from 'lucide-react';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  activeClientsCount: number;
  totalProjectsCount: number;
  overdueCount: number;
  activeTeamMembersCount?: number;
  currentRole?: UserRole;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  activeClientsCount,
  totalProjectsCount,
  overdueCount,
  activeTeamMembersCount,
  currentRole = 'admin'
}) => {
  const allTabs = [
    {
      id: 'dashboard' as TabType,
      label: currentRole === 'client' ? 'My Overview' : 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      visibleForClient: true,
      adminOnly: false
    },
    {
      id: 'clients' as TabType,
      label: 'Clients',
      icon: Users,
      badge: `${activeClientsCount} Active`,
      visibleForClient: false,
      adminOnly: false
    },
    {
      id: 'packages' as TabType,
      label: 'Monthly Packages',
      icon: Package,
      badge: `${totalProjectsCount} ${totalProjectsCount === 1 ? 'project' : 'projects'}`,
      visibleForClient: false,
      adminOnly: false
    },
    {
      id: 'tracker' as TabType,
      label: currentRole === 'client' ? 'My Content' : 'Content Tracker',
      icon: CheckSquare,
      badge: overdueCount > 0 ? `${overdueCount} Overdue` : null,
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
      visibleForClient: true,
      adminOnly: false
    },
    {
      id: 'calendar' as TabType,
      label: currentRole === 'client' ? 'My Calendar' : 'Calendar',
      icon: CalendarDays,
      badge: null,
      visibleForClient: true,
      adminOnly: false
    },
    {
      id: 'reports' as TabType,
      label: currentRole === 'client' ? 'My Report (PDF)' : 'Monthly Reports',
      icon: FileSpreadsheet,
      badge: currentRole === 'client' ? 'Official' : 'PDF / Sheets',
      visibleForClient: true,
      adminOnly: false
    },
    {
      id: 'team' as TabType,
      label: 'Team Members',
      icon: UsersRound,
      badge: activeTeamMembersCount !== undefined ? `${activeTeamMembersCount} Active` : null,
      visibleForClient: false,
      adminOnly: true
    }
  ];

  const visibleTabs = allTabs.filter((tab) => {
    if (currentRole === 'client') return tab.visibleForClient;
    if (tab.adminOnly) return currentRole === 'admin';
    return true;
  });

  return (
    <nav className="w-full bg-transparent">
      <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12">
        <div className="topbar-nav-inner flex items-center gap-1 sm:gap-1.5 xl:gap-2 overflow-x-auto lg:overflow-x-visible flex-nowrap lg:flex-wrap py-2.5 no-scrollbar scrollbar-none pr-4 sm:pr-6 lg:pr-0 transition-all duration-200">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 xl:px-3.5 xl:py-2 rounded-xl text-xs sm:text-xs xl:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{tab.label}</span>

                {tab.badge && (
                  <span
                    className={`ml-1 text-[10px] sm:text-[11px] px-1.5 py-0.5 rounded-full border transition-colors shrink-0 ${
                      isActive
                        ? 'bg-slate-950/20 text-slate-950 border-slate-950/30 font-bold'
                        : tab.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700 font-medium'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
          {/* Right spacer to ensure the last tab is fully visible and not clipped when scrolled horizontally on small screens */}
          <div className="w-2 sm:w-4 shrink-0 lg:hidden" aria-hidden="true" />
        </div>
      </div>
    </nav>
  );
};
