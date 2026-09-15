'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    positive?: boolean;
  };
  color?: 'cyan' | 'emerald' | 'amber' | 'blue' | 'purple' | 'rose';
}

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'cyan',
}: StatsCardProps) {
  const colorStyles = {
    cyan: {
      border: 'border-[#00adef]/30',
      bgIcon: 'bg-gradient-to-br from-[#00adef]/20 to-[#006eb9]/10 text-[#00adef]',
      glow: 'shadow-md shadow-[#00adef]/10',
    },
    blue: {
      border: 'border-[#006eb9]/35',
      bgIcon: 'bg-gradient-to-br from-[#006eb9]/20 to-[#005291]/15 text-[#38c8ff]',
      glow: 'shadow-md shadow-[#006eb9]/10',
    },
    emerald: {
      border: 'border-emerald-500/25',
      bgIcon: 'bg-emerald-500/10 text-emerald-400',
      glow: 'shadow-emerald-500/5',
    },
    amber: {
      border: 'border-amber-500/25',
      bgIcon: 'bg-amber-500/10 text-amber-400',
      glow: 'shadow-amber-500/5',
    },
    purple: {
      border: 'border-purple-500/25',
      bgIcon: 'bg-purple-500/10 text-purple-400',
      glow: 'shadow-purple-500/5',
    },
    rose: {
      border: 'border-rose-500/25',
      bgIcon: 'bg-rose-500/10 text-rose-400',
      glow: 'shadow-rose-500/5',
    },
  };

  const style = colorStyles[color] || colorStyles.cyan;

  return (
    <div
      className={`relative p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-[#0c1a30]/85 border ${style.border} shadow-lg ${style.glow} backdrop-blur-md transition-all duration-200 hover:translate-y-[-2px] hover:border-[#00adef]/50 hover:shadow-[#00adef]/15 overflow-hidden flex flex-col justify-between`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-wider truncate" title={title}>
            {title}
          </p>
          <h3 className="text-xl sm:text-2xl font-extrabold text-white mt-1 tracking-tight truncate">
            {value}
          </h3>
          {subtitle && (
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5 truncate" title={subtitle}>
              {subtitle}
            </p>
          )}
        </div>
        <div className={`p-2 sm:p-2.5 rounded-xl ${style.bgIcon} border border-white/5 flex-shrink-0`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-2.5 sm:mt-3 pt-2 sm:pt-2.5 border-t border-slate-800/80 flex items-center gap-1.5 text-[10px] sm:text-xs">
          <span className={trend.positive ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
            {trend.value}
          </span>
          <span className="text-slate-400">vs yesterday</span>
        </div>
      )}
    </div>
  );
}
