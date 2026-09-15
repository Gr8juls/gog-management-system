'use client';

import React, { useState, useEffect } from 'react';
import StatsCard from '@/components/StatsCard';
import {
  Briefcase,
  PlayCircle,
  CheckCircle,
  Clock,
  AlertTriangle,
  Shirt,
  Droplets,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Filter,
  RefreshCw,
  PlusCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('thisMonth');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/dashboard?range=${range}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [range]);

  const metrics = data?.metrics || {};

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      QUOTATION: 'bg-slate-800 text-slate-300 border-slate-700',
      APPROVED: 'bg-blue-900/40 text-blue-300 border-blue-700/50',
      MATERIALS_RESERVED: 'bg-indigo-900/40 text-indigo-300 border-indigo-700/50',
      IN_PRODUCTION: 'bg-amber-900/40 text-amber-300 border-amber-700/50',
      QUALITY_CHECK: 'bg-purple-900/40 text-purple-300 border-purple-700/50',
      COMPLETED: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
      DELIVERED: 'bg-cyan-900/40 text-cyan-300 border-cyan-700/50',
      CANCELLED: 'bg-rose-900/40 text-rose-300 border-rose-700/50',
    };
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${styles[status] || styles.QUOTATION}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Date Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00adef]/15 text-[#00adef] border border-[#00adef]/30 uppercase tracking-wider">
              GOG TECH HOUSE
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400 font-medium">Operations Center</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">Operations & Production Hub</h1>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">Real-time control of branding jobs, garment production runs, ink consumption & financials</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Actions */}
          <Link
            href="/jobs"
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-gradient-to-r from-[#00adef] via-[#006eb9] to-[#005291] hover:from-[#25bfff] hover:to-[#005da5] text-xs font-semibold text-white shadow-md shadow-[#00adef]/20 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Job</span>
          </Link>

          {/* Date Filter */}
          <div className="flex items-center bg-[#0c1a30] border border-[#173256] rounded-xl p-0.5 sm:p-1 text-xs">
            {['today', 'thisWeek', 'thisMonth'].map((tab) => (
              <button
                key={tab}
                onClick={() => setRange(tab)}
                className={`px-2 sm:px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-medium transition-all ${
                  range === tab
                    ? 'bg-[#00adef]/20 text-[#38c8ff] border border-[#00adef]/40 font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab === 'today' ? 'Today' : tab === 'thisWeek' ? 'This Week' : 'This Month'}
              </button>
            ))}
          </div>

          <button
            onClick={fetchDashboard}
            className="p-1.5 sm:p-2 rounded-xl bg-[#0c1a30] border border-[#173256] text-slate-400 hover:text-[#00adef] transition-colors"
            title="Refresh metrics"
            aria-label="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-4">
        <StatsCard
          title="Received Today"
          value={metrics.jobsReceivedToday ?? 0}
          subtitle="New client orders"
          icon={Briefcase}
          color="blue"
        />
        <StatsCard
          title="In Production"
          value={metrics.jobsInProduction ?? 0}
          subtitle="Currently on floor"
          icon={PlayCircle}
          color="amber"
        />
        <StatsCard
          title="Completed Today"
          value={metrics.jobsCompletedToday ?? 0}
          subtitle="Passed QC check"
          icon={CheckCircle}
          color="emerald"
        />
        <StatsCard
          title="Due Today"
          value={metrics.jobsDueToday ?? 0}
          subtitle="Urgent deadlines"
          icon={Clock}
          color="rose"
        />
        <StatsCard
          title="T-Shirts Branded"
          value={metrics.tshirtsBrandedToday ?? 0}
          subtitle="Units printed today"
          icon={Shirt}
          color="cyan"
        />
        <StatsCard
          title="Ink Used Today"
          value={`${metrics.inkUsedToday ?? 0} ml`}
          subtitle="Production + Test"
          icon={Droplets}
          color="purple"
        />
      </div>

      {/* Financial Overview (if role allows) & Quality / Scrap Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {metrics.totalSales !== null && metrics.totalSales !== undefined ? (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0c1a30] via-[#091528] to-[#060e1c] border border-[#00adef]/30 shadow-xl shadow-[#00adef]/5 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Financial Performance</span>
              <DollarSign className="w-5 h-5 text-[#00adef]" />
            </div>
            <div className="my-4 space-y-3">
              <div>
                <p className="text-xs text-slate-400">Total Sales ({range})</p>
                <h3 className="text-3xl font-extrabold text-white">${metrics.totalSales?.toFixed(2)}</h3>
              </div>
              <div className="pt-3 border-t border-[#173256] flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-slate-400">Estimated Gross Profit</p>
                  <p className="text-lg font-bold text-emerald-400">${metrics.totalEstimatedProfit?.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-slate-400">Est. Margin</p>
                  <p className="text-lg font-bold text-[#00adef]">
                    {metrics.totalSales > 0
                      ? `${((metrics.totalEstimatedProfit / metrics.totalSales) * 100).toFixed(1)}%`
                      : '0%'}
                  </p>
                </div>
              </div>
            </div>
            <Link
              href="/reports?type=profitability"
              className="text-xs font-medium text-[#00adef] hover:text-[#38c8ff] flex items-center gap-1 mt-1"
            >
              <span>View Full Profitability Breakdown</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-[#0c1a30]/80 border border-[#173256] flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Production Operations</span>
              <h3 className="text-xl font-bold text-white mt-2">Active Factory Floor</h3>
              <p className="text-xs text-slate-400 mt-1">Real-time status for machine workstations and operators</p>
            </div>
            <div className="my-4 p-4 rounded-xl bg-[#060e1c] border border-[#173256] text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Pending Orders:</span>
                <strong className="text-white">{metrics.pendingJobs ?? 0} jobs</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Low Stock Alerts:</span>
                <strong className="text-amber-400">{metrics.lowStockCount ?? 0} items</strong>
              </div>
            </div>
            <Link href="/production" className="text-xs font-medium text-[#00adef] hover:text-[#38c8ff] flex items-center gap-1">
              <span>Go to Production Logger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Wastage & Quality Control Card */}
        <div className="p-5 rounded-2xl bg-[#0c1a30]/80 border border-[#173256] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Quality & Rejection Today</span>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <div className="my-4 grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-[#060e1c] border border-[#173256]">
              <span className="text-[11px] text-slate-400">Rejects (Misprints)</span>
              <h4 className="text-xl font-bold text-amber-400 mt-1">{metrics.rejectedToday ?? 0} <span className="text-xs text-slate-400 font-normal">units</span></h4>
            </div>
            <div className="p-3.5 rounded-xl bg-[#060e1c] border border-[#173256]">
              <span className="text-[11px] text-slate-400">Damaged (Press)</span>
              <h4 className="text-xl font-bold text-rose-400 mt-1">{metrics.damagedToday ?? 0} <span className="text-xs text-slate-400 font-normal">units</span></h4>
            </div>
          </div>
          <div className="text-xs text-slate-400">
            <span>Low Stock Reorder Alerts: </span>
            <span className="font-bold text-amber-400">{metrics.lowStockCount ?? 0} items needing replenishment</span>
          </div>
        </div>

        {/* Quick Nav Shortcuts */}
        <div className="p-5 rounded-2xl bg-[#0c1a30]/80 border border-[#173256] flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fast Operational Actions</span>
            <div className="mt-3 space-y-2">
              <Link
                href="/production"
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#091528] hover:bg-[#112544] border border-[#173256] text-xs text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <PlayCircle className="w-4 h-4 text-[#00adef]" />
                  <span>Log Daily Production Run</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
              <Link
                href="/ink-usage"
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#091528] hover:bg-[#112544] border border-[#173256] text-xs text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-[#00adef]" />
                  <span>Record Ink Consumption & Waste</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
              <Link
                href="/materials"
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-[#091528] hover:bg-[#112544] border border-[#173256] text-xs text-slate-200 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Shirt className="w-4 h-4 text-emerald-400" />
                  <span>Issue / Return Blank T-Shirts</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-[#173256]">
            GOG TECH HOUSE Relational Ledger
          </div>
        </div>
      </div>

      {/* Recent Jobs & Stock Transactions Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Jobs Table */}
        <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-[#0c1a30]/85 border border-[#173256]">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-[#00adef]" />
              <span>Recent Printing Jobs</span>
            </h3>
            <Link href="/jobs" className="text-xs text-[#00adef] hover:underline">
              View All
            </Link>
          </div>

          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full min-w-[460px] text-left text-xs">
              <thead className="text-[11px] uppercase text-slate-400 bg-[#060e1c] border-b border-[#173256]">
                <tr>
                  <th className="py-2.5 px-3">Job Number</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Product</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#173256]/60">
                {data?.recentJobs?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No jobs recorded yet
                    </td>
                  </tr>
                ) : (
                  data?.recentJobs?.map((job: any) => (
                    <tr key={job.id} className="hover:bg-[#112544]/50 transition-colors">
                      <td className="py-3 px-3 font-mono font-medium text-[#00adef]">
                        <Link href={`/jobs`}>{job.jobNumber}</Link>
                      </td>
                      <td className="py-3 px-3 text-slate-200">{job.customer?.name}</td>
                      <td className="py-3 px-3 text-slate-400">{job.productType}</td>
                      <td className="py-3 px-3">{getStatusBadge(job.status)}</td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={`/jobs`}
                          className="text-xs font-semibold text-[#00adef] hover:text-[#38c8ff]"
                        >
                          Details →
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Stock Movements Table */}
        <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-[#0c1a30]/85 border border-[#173256]">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
              <Shirt className="w-4 h-4 text-emerald-400" />
              <span>Recent Stock Movements</span>
            </h3>
            <Link href="/inventory" className="text-xs text-[#00adef] hover:underline">
              View Inventory
            </Link>
          </div>

          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full min-w-[460px] text-left text-xs">
              <thead className="text-[11px] uppercase text-slate-400 bg-[#060e1c] border-b border-[#173256]">
                <tr>
                  <th className="py-2.5 px-3">Item / SKU</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Qty</th>
                  <th className="py-2.5 px-3">Balance</th>
                  <th className="py-2.5 px-3 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#173256]/60">
                {data?.recentStockMovements?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      No stock movements recorded yet
                    </td>
                  </tr>
                ) : (
                  data?.recentStockMovements?.map((m: any) => {
                    const isPositive = m.quantity > 0;
                    return (
                      <tr key={m.id} className="hover:bg-[#112544]/50 transition-colors">
                        <td className="py-3 px-3">
                          <div className="font-medium text-slate-200">{m.inventoryItem?.name}</div>
                          <div className="text-[10px] font-mono text-slate-400">{m.inventoryItem?.sku}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#060e1c] border border-[#173256] text-slate-300">
                            {m.type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className={`py-3 px-3 font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isPositive ? `+${m.quantity}` : m.quantity}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-300">
                          {m.balanceAfter} {m.inventoryItem?.unitOfMeasure}
                        </td>
                        <td className="py-3 px-3 text-right text-slate-400 text-[11px]">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
