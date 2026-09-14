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
      glow: 'shadow-lg shadow-[#00adef]/10',
    },
    blue: {
      border: 'border-[#006eb9]/35',
      bgIcon: 'bg-gradient-to-br from-[#006eb9]/20 to-[#005291]/15 text-[#38c8ff]',
      glow: 'shadow-lg shadow-[#006eb9]/10',
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
      className={`relative p-5 rounded-2xl bg-[#0c1a30]/85 border ${style.border} shadow-lg ${style.glow} backdrop-blur-md transition-all hover:translate-y-[-2px] hover:border-[#00adef]/50 hover:shadow-[#00adef]/15`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-extrabold text-white mt-1 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-xl ${style.bgIcon} border border-white/5`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {trend && (
        <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center gap-1.5 text-xs">
          <span className={trend.positive ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
            {trend.value}
          </span>
          <span className="text-slate-400">vs yesterday</span>
        </div>
      )}
    </div>
  );
}
