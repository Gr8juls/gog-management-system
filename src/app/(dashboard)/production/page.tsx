'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import {
  PlayCircle,
  Plus,
  Search,
  Filter,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function DailyProductionPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateFilter, setDateFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');

  // Modal & Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    jobId: '',
    jobItemId: '',
    product: '',
    productionMethod: 'DTF',
    quantityPlanned: 50,
    quantityStarted: 50,
    quantityCompleted: 45,
    quantityRejected: 3,
    quantityDamaged: 2,
    workstation: 'Heat Press 1',
    startTime: '09:00',
    endTime: '13:00',
    notes: '',
    qualityStatus: 'PASSED',
    managerApproved: false,
  });
  const [formError, setFormError] = useState('');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (dateFilter) query.append('date', dateFilter);
      if (methodFilter) query.append('productionMethod', methodFilter);

      const res = await fetch(`/api/production?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRecords();
    fetchActiveJobs();
  }, [dateFilter, methodFilter]);

  const handleJobSelect = (jobId: string) => {
    const found = jobs.find((j) => j.id === jobId);
    if (found) {
      const firstItem = found.items?.[0];
      setFormData({
        ...formData,
        jobId,
        jobItemId: firstItem?.id || '',
        product: firstItem?.itemDescription || found.productType,
        productionMethod: found.brandingMethod || 'DTF',
        quantityPlanned: firstItem?.quantityPending || found.totalPending || 50,
        quantityStarted: firstItem?.quantityPending || found.totalPending || 50,
      });
    } else {
      setFormData({ ...formData, jobId });
    }
  };

  const calculatedRemaining = Math.max(
    0,
    Number(formData.quantityPlanned || 0) -
      (Number(formData.quantityCompleted || 0) +
        Number(formData.quantityRejected || 0) +
        Number(formData.quantityDamaged || 0))
  );

  const handleSaveProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/production', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to record production');
        if (data.requiresManagerApproval) {
          setRequiresApproval(true);
        }
      } else {
        setIsModalOpen(false);
        setRequiresApproval(false);
        fetchRecords();
        fetchActiveJobs();
      }
    } catch (err: any) {
      setFormError(err.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Daily Production Floor</h1>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Fast logging for operators, completed counts, scrap, damage & quality control
          </p>
        </div>
        <button
          onClick={() => {
            setIsModalOpen(true);
            setFormError('');
            setRequiresApproval(false);
          }}
          className="inline-flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold text-xs shadow-lg shadow-amber-500/20 transition-all self-start sm:self-auto"
        >
          <PlayCircle className="w-4 h-4" />
          <span>Log Daily Production Run</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center gap-2.5 sm:gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white flex-1 sm:flex-initial"
            />
          </div>
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-[11px] text-cyan-400 hover:underline"
            >
              Clear Date
            </button>
          )}
        </div>

        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-300 w-full sm:w-auto"
        >
          <option value="">All Production Methods</option>
          <option value="DTF">DTF</option>
          <option value="Screen printing">Screen printing</option>
          <option value="Sublimation">Sublimation</option>
          <option value="Embroidery">Embroidery</option>
          <option value="Heat transfer">Heat transfer</option>
        </select>
      </div>

      {/* Production Runs Log Table */}
      <div className="rounded-xl sm:rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full min-w-[850px] text-left text-xs">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Job / Ticket</th>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Method & Workstation</th>
                <th className="py-3 px-4 text-center">Planned</th>
                <th className="py-3 px-4 text-center text-emerald-400 font-bold">Completed</th>
                <th className="py-3 px-4 text-center text-amber-400 font-bold">Rejected</th>
                <th className="py-3 px-4 text-center text-rose-400 font-bold">Damaged</th>
                <th className="py-3 px-4 text-center text-cyan-400 font-bold">Remaining</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4 text-right">QC Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">Loading daily production logs...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">No production runs recorded yet.</td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 text-slate-300 font-mono">
                      {new Date(r.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                      {r.job?.jobNumber}
                    </td>
                    <td className="py-3 px-4 font-medium text-white max-w-[200px] truncate">
                      {r.product}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-200">{r.productionMethod}</span>
                      <span className="text-[10px] block text-slate-400">{r.workstation || 'General'}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-medium text-slate-300">
                      {r.quantityPlanned}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400 bg-emerald-950/20">
                      +{r.quantityCompleted}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-amber-400">
                      {r.quantityRejected}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-rose-400">
                      {r.quantityDamaged}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-semibold text-cyan-300">
                      {r.quantityRemaining}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {r.operator?.name || 'Assigned Staff'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          r.qualityStatus === 'PASSED'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : r.qualityStatus === 'REWORK'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}
                      >
                        {r.qualityStatus}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Production Entry Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Daily Production Run"
        subtitle="Log completed units, defect counts, workstation & operator time"
        maxWidth="2xl"
      >
        {formError && (
          <div className="p-3 mb-4 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
            {formError}
          </div>
        )}

        <form onSubmit={handleSaveProduction} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Job *</label>
              <select
                required
                value={formData.jobId}
                onChange={(e) => handleJobSelect(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">Select Job</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.jobNumber} - {j.customer?.name} ({j.productType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Product Description *</label>
              <input
                type="text"
                required
                value={formData.product}
                onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Production Method</label>
              <select
                value={formData.productionMethod}
                onChange={(e) => setFormData({ ...formData, productionMethod: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="DTF">DTF</option>
                <option value="Screen printing">Screen printing</option>
                <option value="Sublimation">Sublimation</option>
                <option value="Embroidery">Embroidery</option>
                <option value="Heat transfer">Heat transfer</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Machine / Workstation</label>
              <input
                type="text"
                placeholder="e.g. Heat Press #1"
                value={formData.workstation}
                onChange={(e) => setFormData({ ...formData, workstation: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">QC Status</label>
              <select
                value={formData.qualityStatus}
                onChange={(e) => setFormData({ ...formData, qualityStatus: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="PASSED">PASSED (Approved)</option>
                <option value="REWORK">REWORK (Minor correction)</option>
                <option value="FAILED">FAILED (Total scrap)</option>
              </select>
            </div>
          </div>

          {/* Quantities Grid with Live Formula Calculation */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Production Quantities (Live Calculation)
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Planned Qty *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={formData.quantityPlanned}
                  onChange={(e) => setFormData({ ...formData, quantityPlanned: parseInt(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono text-center"
                />
              </div>
              <div>
                <label className="block text-emerald-400 font-medium mb-1">Completed Units *</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={formData.quantityCompleted}
                  onChange={(e) => setFormData({ ...formData, quantityCompleted: parseInt(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-emerald-500/50 rounded-lg text-xs text-emerald-300 font-mono text-center font-bold"
                />
              </div>
              <div>
                <label className="block text-amber-400 font-medium mb-1">Rejected (Misprint)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.quantityRejected}
                  onChange={(e) => setFormData({ ...formData, quantityRejected: parseInt(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-amber-500/50 rounded-lg text-xs text-amber-300 font-mono text-center font-bold"
                />
              </div>
              <div>
                <label className="block text-rose-400 font-medium mb-1">Damaged (Press)</label>
                <input
                  type="number"
                  min={0}
                  value={formData.quantityDamaged}
                  onChange={(e) => setFormData({ ...formData, quantityDamaged: parseInt(e.target.value) || 0 })}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-rose-500/50 rounded-lg text-xs text-rose-300 font-mono text-center font-bold"
                />
              </div>
            </div>

            {/* Calculated Remaining Display */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                Formula: Planned ({formData.quantityPlanned}) - Completed ({formData.quantityCompleted}) - Rejected ({formData.quantityRejected}) - Damaged ({formData.quantityDamaged})
              </span>
              <span className="font-bold text-cyan-400 font-mono">
                Quantity Remaining: {calculatedRemaining} units
              </span>
            </div>
          </div>

          {/* Time logs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Shift Start Time</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Shift End Time</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          {/* Manager Overrun Approval Checkbox if triggered */}
          {requiresApproval && (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">Manager Override Required</strong>
                <p className="text-[11px] text-amber-300/80 mt-0.5">
                  Production completed + rejected exceeds ordered quantity. Check the box below to authorize this overrun.
                </p>
                <label className="flex items-center gap-2 mt-2 font-bold cursor-pointer text-white">
                  <input
                    type="checkbox"
                    checked={formData.managerApproved}
                    onChange={(e) => setFormData({ ...formData, managerApproved: e.target.checked })}
                    className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>Authorize Manager Override for Production Overrun</span>
                </label>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Shift & Quality Notes</label>
            <textarea
              rows={2}
              placeholder="Batch observations, tension, temperature setting, reason for rejects..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
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
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 font-semibold text-xs text-white shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Submit Production Record'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
