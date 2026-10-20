import React from 'react';
import { ContentStatus } from '../types';
import { CheckCircle2, ThumbsUp, Clock, Sparkles, CircleDashed, PauseCircle, AlertTriangle, CheckCheck } from 'lucide-react';

interface StatusBadgeProps {
  status: ContentStatus;
  isOverdue?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  isOverdue = false,
  size = 'md',
  showIcon = true
}) => {
  const getStyles = () => {
    switch (status) {
      case 'Published':
        return {
          bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
          icon: CheckCircle2,
          label: 'Published'
        };
      case 'Approved':
        return {
          bg: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
          icon: ThumbsUp,
          label: 'Approved'
        };
      case 'Pending Approval':
        return {
          bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
          icon: Clock,
          label: 'Pending Approval'
        };
      case 'In Progress':
        return {
          bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
          icon: Sparkles,
          label: 'In Progress'
        };
      case 'Completed':
        return {
          bg: 'bg-teal-500/15 text-teal-400 border-teal-500/30',
          icon: CheckCheck,
          label: 'Completed'
        };
      case 'On Hold':
        return {
          bg: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
          icon: PauseCircle,
          label: 'On Hold'
        };
      case 'Not Started':
      default:
        return {
          bg: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
          icon: CircleDashed,
          label: 'Not Started'
        };
    }
  };

  const style = getStyles();
  const IconComponent = style.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium'
  }[size];

  return (
    <div className="inline-flex items-center gap-1.5">
      <span
        className={`inline-flex items-center rounded-full border ${style.bg} ${sizeClasses} transition-colors`}
      >
        {showIcon && <IconComponent className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
        <span>{style.label}</span>
      </span>

      {isOverdue && status !== 'Published' && (
        <span
          title="Past planned publishing date"
          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-semibold animate-pulse"
        >
          <AlertTriangle className="w-3 h-3" />
          <span>Overdue</span>
        </span>
      )}
    </div>
  );
};
