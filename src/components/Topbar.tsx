'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Shield, ChevronDown, Check, AlertTriangle, Clock } from 'lucide-react';

interface TopbarProps {
  currentUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  onRoleSwitched?: () => void;
}

export default function Topbar({ currentUser, onRoleSwitched }: TopbarProps) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRoleSwitch = async (targetRole: string) => {
    try {
      setSwitching(true);
      const res = await fetch('/api/auth/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole }),
      });
      if (res.ok) {
        setShowRoleMenu(false);
        if (onRoleSwitched) {
          onRoleSwitched();
        } else {
          window.location.reload();
        }
      }
    } catch (err) {
      console.error('Role switch failed', err);
    } finally {
      setSwitching(false);
    }
  };

  const roles = [
    { key: 'ADMIN', name: 'Administrator', desc: 'Full system control & user admin' },
    { key: 'MANAGER', name: 'Operations Manager', desc: 'Approvals, jobs & profitability' },
    { key: 'SALES', name: 'Sales / Front Desk', desc: 'Customers, orders & quotes' },
    { key: 'PRODUCTION', name: 'Production Floor', desc: 'Daily logs & ink consumption' },
    { key: 'INVENTORY', name: 'Inventory Store', desc: 'Material issues, stock counts & POs' },
  ];

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="h-16 bg-[#081222]/90 backdrop-blur border-b border-[#142742] px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Date & Subtitle */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5 text-[#00adef]" />
          <span>{currentDate}</span>
        </div>
        <span className="text-[#173054]">•</span>
        <span className="text-xs text-[#38c8ff] font-medium flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00adef] animate-pulse"></span>
          GOG TECH HOUSE • Online
        </span>
      </div>

      {/* Right Actions: Role Switcher & Notifications & User */}
      <div className="flex items-center gap-4">
        {/* Quick Role Switcher for Test & Evaluation */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            disabled={switching}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0c1a30] hover:bg-[#112544] border border-[#173256] text-xs text-slate-200 transition-all shadow-sm"
            title="Switch user role for testing"
          >
            <Shield className="w-3.5 h-3.5 text-[#00adef]" />
            <span>Role: <strong className="text-white">{currentUser?.role || 'ADMIN'}</strong></span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-[#09162a] border border-[#173256] rounded-xl shadow-2xl p-2 z-50">
              <div className="px-3 py-2 border-b border-[#142742] mb-1">
                <p className="text-xs font-semibold text-white">Switch Demo User Role</p>
                <p className="text-[11px] text-slate-400">Test different permissions instantly</p>
              </div>
              <div className="space-y-1">
                {roles.map((r) => {
                  const isCurrent = currentUser?.role === r.key;
                  return (
                    <button
                      key={r.key}
                      onClick={() => handleRoleSwitch(r.key)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        isCurrent
                          ? 'bg-[#00adef]/15 text-[#38c8ff] border border-[#00adef]/40 font-semibold'
                          : 'hover:bg-[#0c1a30] text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-white">{r.name}</div>
                        <div className="text-[10px] text-slate-400">{r.desc}</div>
                      </div>
                      {isCurrent && <Check className="w-4 h-4 text-[#00adef]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Alerts Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowAlerts(!showAlerts)}
            className="p-2 rounded-lg bg-[#0c1a30] hover:bg-[#112544] border border-[#173256] text-slate-300 relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            {alerts.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center">
                {alerts.length}
              </span>
            )}
          </button>

          {showAlerts && (
            <div className="absolute right-0 mt-2 w-80 bg-[#09162a] border border-[#173256] rounded-xl shadow-2xl p-3 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-[#142742] mb-2">
                <span className="text-xs font-semibold text-white">Operational Alerts</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">
                  {alerts.length} Active
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto space-y-2">
                {alerts.length === 0 ? (
                  <p className="text-xs text-slate-400 py-3 text-center">No active alerts. All systems healthy!</p>
                ) : (
                  alerts.map((alert, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-[#0c1a30] border border-[#173256] text-xs space-y-0.5"
                    >
                      <div className="font-semibold text-amber-300 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                        <span className="truncate">{alert.title}</span>
                      </div>
                      <p className="text-slate-400 text-[11px] leading-relaxed">{alert.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#142742]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00adef] to-[#005291] flex items-center justify-center text-xs font-bold text-white shadow-md shadow-[#00adef]/20">
            {currentUser?.name?.charAt(0) || 'U'}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-medium text-white">{currentUser?.name || 'Administrator'}</div>
            <div className="text-[10px] text-slate-400">{currentUser?.email || 'admin@gog.com'}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
