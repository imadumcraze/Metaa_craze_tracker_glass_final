import React from 'react';
import { TabType, UserRole } from '../types';
import {
  LayoutDashboard,
  Users,
  Package,
  CheckSquare,
  CalendarDays,
  FileSpreadsheet
} from 'lucide-react';

interface NavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  activeClientsCount: number;
  totalProjectsCount: number;
  overdueCount: number;
  currentRole?: UserRole;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  activeClientsCount,
  totalProjectsCount,
  overdueCount,
  currentRole = 'admin'
}) => {
  const allTabs = [
    {
      id: 'dashboard' as TabType,
      label: currentRole === 'client' ? 'My Overview' : 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      visibleForClient: true
    },
    {
      id: 'clients' as TabType,
      label: 'Clients',
      icon: Users,
      badge: `${activeClientsCount} Active`,
      visibleForClient: false
    },
    {
      id: 'packages' as TabType,
      label: 'Monthly Packages',
      icon: Package,
      badge: `${totalProjectsCount} ${totalProjectsCount === 1 ? 'project' : 'projects'}`,
      visibleForClient: false
    },
    {
      id: 'tracker' as TabType,
      label: currentRole === 'client' ? 'My Content' : 'Content Tracker',
      icon: CheckSquare,
      badge: overdueCount > 0 ? `${overdueCount} Overdue` : null,
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
      visibleForClient: true
    },
    {
      id: 'calendar' as TabType,
      label: currentRole === 'client' ? 'My Calendar' : 'Calendar',
      icon: CalendarDays,
      badge: null,
      visibleForClient: true
    },
    {
      id: 'reports' as TabType,
      label: currentRole === 'client' ? 'My Report (PDF)' : 'Monthly Reports',
      icon: FileSpreadsheet,
      badge: currentRole === 'client' ? 'Official' : 'PDF / Sheets',
      visibleForClient: true
    }
  ];

  const visibleTabs = currentRole === 'client'
    ? allTabs.filter(t => t.visibleForClient)
    : allTabs;

  return (
    <nav className="bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2.5 scrollbar-none">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                <span>{tab.label}</span>

                {tab.badge && (
                  <span
                    className={`ml-1 text-[11px] px-1.5 py-0.5 rounded-full border transition-colors ${
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
        </div>
      </div>
    </nav>
  );
};
