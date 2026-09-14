'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import {
  Droplets,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  RefreshCw,
  PieChart,
  Layers,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

export default function InkUsagePage() {
  const [inkLogs, setInkLogs] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [inkItems, setInkItems] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal & Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    jobId: '',
    inventoryItemId: '',
    color: 'White',
    brand: 'East Africa Digital Inks',
    inkType: 'DTF',
    quantityUsed: 150,
    quantityWasted: 10,
    unitOfMeasure: 'ml',
    reason: 'CUSTOMER_PRODUCTION',
    notes: '',
  });

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchInkUsage = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ink-usage');
      if (res.ok) {
        const data = await res.json();
        setInkLogs(data.inkLogs || []);
        setSummary(data.summary || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchInksAndJobs = async () => {
    try {
      const [resInks, resJobs] = await Promise.all([
        fetch('/api/inventory?category=INK'),
        fetch('/api/jobs'),
      ]);
      if (resInks.ok) {
        const d = await resInks.json();
        setInkItems(d.items || []);
      }
      if (resJobs.ok) {
        const d = await resJobs.json();
        setJobs(d.jobs || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchInkUsage();
    fetchInksAndJobs();
  }, []);

  const handleSelectInkItem = (itemId: string) => {
    const item = inkItems.find((i) => i.id === itemId);
    if (item) {
      setFormData({
        ...formData,
        inventoryItemId: itemId,
        color: item.color || item.name.split('-').pop()?.trim() || 'Custom',
        brand: item.brand || 'Digital Inks',
        unitOfMeasure: item.unitOfMeasure || 'ml',
      });
    } else {
      setFormData({ ...formData, inventoryItemId: itemId });
    }
  };

  const handleSaveInkUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/ink-usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to record ink usage');
      } else {
        setIsModalOpen(false);
        fetchInkUsage();
        fetchInksAndJobs();
      }
    } catch (err: any) {
      setFormError(err.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Ink Tracking & Consumption</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track milliliter consumption by job, test prints, cleaning cycles, spillage & wastage
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setFormError('');
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-purple-500/20 transition-all"
        >
          <Droplets className="w-4 h-4" />
          <span>Record Ink Usage / Wastage</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-slate-400">Total Consumption</span>
          <div className="text-2xl font-extrabold text-white mt-1">
            {summary?.totalConsumption ?? 0} <span className="text-xs font-normal text-slate-400">ml</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Production + Test + Wastage</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-slate-400">Production Ink Used</span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">
            {summary?.totalUsed ?? 0} <span className="text-xs font-normal text-slate-400">ml</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Directly on finished garments</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-slate-400">Ink Wasted (Purge / Spillage)</span>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">
            {summary?.totalWasted ?? 0} <span className="text-xs font-normal text-slate-400">ml</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Cleaning & test prints</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-slate-400">Active Ink SKUs</span>
          <div className="text-2xl font-extrabold text-cyan-400 mt-1">
            {inkItems.length} <span className="text-xs font-normal text-slate-400">colors</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">In chemistry cabinet</p>
        </div>
      </div>

      {/* Available Ink Stock Levels */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Droplets className="w-4 h-4 text-cyan-400" />
          <span>Available Ink Inventory Stock</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {inkItems.map((ink) => {
            const isLow = ink.currentStock <= ink.reorderLevel;
            return (
              <div key={ink.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <div className="font-semibold text-white truncate">{ink.name}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{ink.sku}</div>
                <div className="mt-2 flex items-baseline justify-between">
                  <span className={`text-lg font-bold font-mono ${isLow ? 'text-amber-400' : 'text-cyan-400'}`}>
                    {ink.currentStock}
                  </span>
                  <span className="text-[10px] text-slate-500">{ink.unitOfMeasure}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Usage Logs Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Ink Usage Ledger</h3>
          <span className="text-xs text-slate-400">All job consumption and purge logs</span>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Job Ticket</th>
              <th className="py-3 px-4">Color & Ink Type</th>
              <th className="py-3 px-4 text-center">Used (ml)</th>
              <th className="py-3 px-4 text-center">Wasted (ml)</th>
              <th className="py-3 px-4">Reason</th>
              <th className="py-3 px-4">Operator</th>
              <th className="py-3 px-4 text-right">Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">Loading ink logs...</td>
              </tr>
            ) : inkLogs.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">No ink usage recorded yet.</td>
              </tr>
            ) : (
              inkLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {new Date(log.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                    {log.job?.jobNumber || <span className="text-slate-500 font-sans font-normal">Non-job test</span>}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-white">{log.color}</span>
                    <span className="text-[10px] block text-slate-400">{log.inkType || 'DTF'}</span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">
                    {log.quantityUsed} {log.unitOfMeasure}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-amber-400">
                    {log.quantityWasted} {log.unitOfMeasure}
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {log.reason.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {log.operator?.name || 'Staff'}
                  </td>
                  <td className="py-3 px-4 text-right text-slate-400 max-w-[200px] truncate">
                    {log.notes || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Record Usage Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Ink Usage & Consumption"
        subtitle="Deducts ink from stock and links consumption to printing tickets"
      >
        {formError && (
          <div className="p-3 mb-4 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
            {formError}
          </div>
        )}

        <form onSubmit={handleSaveInkUsage} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Ink Inventory Item *</label>
            <select
              required
              value={formData.inventoryItemId}
              onChange={(e) => handleSelectInkItem(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            >
              <option value="">Select Ink Bottle / Color</option>
              {inkItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.currentStock} {item.unitOfMeasure} in stock)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Link to Job (Optional)</label>
              <select
                value={formData.jobId}
                onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="">No Job (Factory Cleaning / Test)</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.jobNumber} - {j.customer?.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Usage Reason *</label>
              <select
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="CUSTOMER_PRODUCTION">Customer Production</option>
                <option value="TEST_PRINT">Test Print / Sample</option>
                <option value="CLEANING">Printhead Cleaning / Purge</option>
                <option value="SPILLAGE">Accidental Spillage</option>
                <option value="FAILED_PRINT">Failed Print</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-emerald-400 mb-1">Production Used (ml) *</label>
              <input
                type="number"
                step="any"
                min={0}
                required
                value={formData.quantityUsed}
                onChange={(e) => setFormData({ ...formData, quantityUsed: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-950 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-amber-400 mb-1">Wasted / Purged (ml)</label>
              <input
                type="number"
                step="any"
                min={0}
                value={formData.quantityWasted}
                onChange={(e) => setFormData({ ...formData, quantityWasted: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-950 border border-amber-500/40 rounded-xl text-xs text-amber-300 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Notes</label>
            <textarea
              rows={2}
              placeholder="Print pass count, density settings..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 font-semibold text-xs text-white shadow-md shadow-purple-500/20 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Record Ink Log'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
