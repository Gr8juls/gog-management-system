'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  PlayCircle,
  Package,
  Droplets,
  ArrowLeftRight,
  Truck,
  CreditCard,
  BarChart3,
  UserCheck,
  Settings,
  LogOut,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  userRole?: string;
  userName?: string;
}

export default function Sidebar({ userRole = 'ADMIN', userName = 'User' }: SidebarProps) {
  const pathname = usePathname();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER', 'SALES', 'PRODUCTION', 'INVENTORY'] },
    { name: 'Customers', href: '/customers', icon: Users, roles: ['ADMIN', 'MANAGER', 'SALES'] },
    { name: 'Jobs & Orders', href: '/jobs', icon: Briefcase, roles: ['ADMIN', 'MANAGER', 'SALES', 'PRODUCTION', 'INVENTORY'] },
    { name: 'Daily Production', href: '/production', icon: PlayCircle, roles: ['ADMIN', 'MANAGER', 'PRODUCTION', 'SALES'] },
    { name: 'Inventory & T-Shirts', href: '/inventory', icon: Package, roles: ['ADMIN', 'MANAGER', 'INVENTORY', 'SALES', 'PRODUCTION'] },
    { name: 'Ink Usage', href: '/ink-usage', icon: Droplets, roles: ['ADMIN', 'MANAGER', 'PRODUCTION', 'INVENTORY'] },
    { name: 'Material Issues & Returns', href: '/materials', icon: ArrowLeftRight, roles: ['ADMIN', 'MANAGER', 'INVENTORY', 'PRODUCTION'] },
    { name: 'Purchases & Suppliers', href: '/purchases', icon: Truck, roles: ['ADMIN', 'MANAGER', 'INVENTORY'] },
    { name: 'Payments', href: '/payments', icon: CreditCard, roles: ['ADMIN', 'MANAGER', 'SALES'] },
    { name: 'Reports Hub', href: '/reports', icon: BarChart3, roles: ['ADMIN', 'MANAGER', 'SALES', 'INVENTORY', 'PRODUCTION'] },
    { name: 'User Management', href: '/users', icon: UserCheck, roles: ['ADMIN'] },
    { name: 'Settings', href: '/settings', icon: Settings, roles: ['ADMIN', 'MANAGER'] },
  ];

  const allowedNav = navigation.filter((item) => item.roles.includes(userRole));

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'MANAGER':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'SALES':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'PRODUCTION':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'INVENTORY':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  return (
    <aside className="w-64 bg-[#081222] border-r border-[#142742] flex flex-col h-screen fixed left-0 top-0 z-30 transition-all">
      {/* Brand Header with Authentic Logo */}
      <div className="p-4 border-b border-[#142742] bg-[#060e1c]/90 flex items-center gap-3">
        <div className="relative w-11 h-11 flex-shrink-0 flex items-center justify-center p-1 rounded-xl bg-gradient-to-br from-[#0c1f3d] to-[#081528] border border-[#00adef]/30 shadow-lg shadow-[#00adef]/15">
          <img
            src="/logo-icon.png"
            alt="GOG TECH HOUSE Logo"
            className="w-9 h-9 object-contain drop-shadow-[0_0_8px_rgba(0,173,239,0.5)]"
          />
        </div>
        <div className="overflow-hidden">
          <h1 className="font-extrabold text-sm tracking-wide text-white flex items-center gap-1.5 leading-tight">
            GOG <span className="text-[#00adef]">TECH HOUSE</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-0.5">Production & Stock</p>
        </div>
      </div>

      {/* Role Pill Banner */}
      <div className="px-4 py-2.5 bg-[#050b16] border-b border-[#142742] flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Active Role</span>
          <span className="text-xs font-medium text-slate-200 truncate max-w-[130px]">{userName}</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadgeColor(userRole)}`}>
          {userRole}
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {allowedNav.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-[#00adef]/20 via-[#006eb9]/10 to-transparent text-[#38c8ff] border-l-2 border-[#00adef] shadow-sm shadow-[#00adef]/10 font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-[#0d1d36]/70 hover:border-l-2 hover:border-[#00adef]/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#00adef]' : 'text-slate-400'}`} />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-[#142742] bg-[#050b16]">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 bg-red-950/30 hover:bg-red-900/40 border border-red-900/40 rounded-lg transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
