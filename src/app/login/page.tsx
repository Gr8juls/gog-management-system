'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Shield, Lock, Mail, ArrowRight, UserCheck, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@gog.com');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const demoAccounts = [
    { role: 'Administrator', email: 'admin@gog.com', pass: 'Admin@123', color: 'border-purple-500/40 bg-purple-500/10 text-purple-300' },
    { role: 'Manager', email: 'manager@gog.com', pass: 'Manager@123', color: 'border-blue-500/40 bg-blue-500/10 text-blue-300' },
    { role: 'Sales / Front Desk', email: 'sales@gog.com', pass: 'Sales@123', color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300' },
    { role: 'Production Floor', email: 'production@gog.com', pass: 'Production@123', color: 'border-amber-500/40 bg-amber-500/10 text-amber-300' },
    { role: 'Inventory Store', email: 'inventory@gog.com', pass: 'Inventory@123', color: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300' },
  ];

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to sign in');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const selectDemoAccount = (acc: typeof demoAccounts[0]) => {
    setEmail(acc.email);
    setPassword(acc.pass);
  };

  return (
    <div className="min-h-screen bg-[#060d19] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic GOG brand glow backdrops */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00adef]/12 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#005291]/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Banner with Authentic GOG TECH HOUSE Logo */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="relative mb-2 group">
            <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-[#00adef] via-[#006eb9] to-[#005291] opacity-30 blur-xl group-hover:opacity-60 transition duration-500"></div>
            <div className="relative p-2.5 px-6 rounded-2xl bg-[#081528]/90 border border-[#00adef]/30 shadow-2xl shadow-[#00adef]/15 flex items-center justify-center">
              <img
                src="/logo-light.png"
                alt="GOG TECH HOUSE"
                className="h-20 w-auto object-contain drop-shadow-[0_0_12px_rgba(0,173,239,0.4)]"
              />
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-medium tracking-wide">Production & Inventory Management System</p>
        </div>

        {/* Login Card */}
        <div className="glass-panel p-8 rounded-2xl shadow-2xl border border-[#173256] bg-[#09162a]/90">
          <h2 className="text-lg font-bold text-white mb-1">Sign In to Workspace</h2>
          <p className="text-xs text-slate-400 mb-6">Enter your credentials or pick a demo role below</p>

          {error && (
            <div className="p-3 mb-4 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@gog.com"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#050c18] border border-[#173256] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00adef] focus:ring-1 focus:ring-[#00adef]/30 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#050c18] border border-[#173256] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00adef] focus:ring-1 focus:ring-[#00adef]/30 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#00adef] via-[#006eb9] to-[#005291] hover:from-[#25bfff] hover:to-[#005da5] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#00adef]/25 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="mt-8 pt-6 border-t border-[#173256]">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>1-Click Demo Accounts</span>
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => selectDemoAccount(acc)}
                  className={`p-2 rounded-lg border text-[11px] font-medium text-left transition-all hover:scale-[1.02] ${acc.color}`}
                >
                  <div className="font-semibold">{acc.role}</div>
                  <div className="text-[9px] opacity-75 font-mono">{acc.email}</div>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 text-center mt-3">
              Standard password for all demo accounts: <code className="text-cyan-400 font-mono">RoleName@123</code> (e.g. <code className="text-cyan-400 font-mono">Admin@123</code>)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
