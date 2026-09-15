'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import {
  ArrowLeftRight,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Shirt,
  CheckCircle2,
  AlertTriangle,
  History,
  Layers,
} from 'lucide-react';

export default function MaterialsPage() {
  const [summaries, setSummaries] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isIssueOpen, setIsIssueOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);

  // Issue Form
  const [issueData, setIssueData] = useState({
    jobId: '',
    inventoryItemId: '',
    quantityIssued: 50,
    notes: '',
  });

  // Return Form
  const [returnData, setReturnData] = useState({
    jobId: '',
    inventoryItemId: '',
    quantityReturned: 5,
    notes: '',
  });

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/materials');
      if (res.ok) {
        const data = await res.json();
        setSummaries(data.summaries || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchItemsAndJobs = async () => {
    try {
      const [resItems, resJobs] = await Promise.all([
        fetch('/api/inventory'),
        fetch('/api/jobs'),
      ]);
      if (resItems.ok) {
        const d = await resItems.json();
        setInventoryItems(d.items || []);
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
    fetchMaterials();
    fetchItemsAndJobs();
  }, []);

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/materials/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(issueData),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to issue materials');
      } else {
        setIsIssueOpen(false);
        fetchMaterials();
        fetchItemsAndJobs();
      }
    } catch (err: any) {
      setFormError(err.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/materials/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(returnData),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to return materials');
      } else {
        setIsReturnOpen(false);
        fetchMaterials();
        fetchItemsAndJobs();
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Material Issue & Return Reconciliation</h1>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Track planned vs issued vs consumed vs returned blank products with variance reporting
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setIsIssueOpen(true);
              setFormError('');
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 transition-all"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Issue Stock to Job</span>
          </button>
          <button
            onClick={() => {
              setIsReturnOpen(true);
              setFormError('');
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold text-xs border border-cyan-500/30 transition-all"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Return Unused Stock</span>
          </button>
        </div>
      </div>

      {/* Reconciliation Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Job Material Variance Ledger</h3>
          <span className="text-xs text-slate-400">Formula: Materials Consumed = Issued - Returned</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Job Ticket</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Product Type</th>
                <th className="py-3 px-4 text-center">Planned</th>
                <th className="py-3 px-4 text-center text-emerald-400 font-bold">Issued</th>
                <th className="py-3 px-4 text-center text-cyan-400 font-bold">Returned</th>
                <th className="py-3 px-4 text-center text-white font-bold">Net Consumed</th>
                <th className="py-3 px-4 text-center text-amber-400 font-bold">Scrap / Defect</th>
                <th className="py-3 px-4 text-center">Variance</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">Loading material reconciliation...</td>
                </tr>
              ) : summaries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">No jobs with materials recorded yet.</td>
                </tr>
              ) : (
                summaries.map((s) => (
                  <tr key={s.jobId} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                      {s.jobNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-200">{s.customerName}</td>
                    <td className="py-3 px-4 text-slate-400">{s.productType}</td>
                    <td className="py-3 px-4 text-center font-mono font-medium text-slate-300">
                      {s.plannedQuantity}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">
                      {s.materialsIssued}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-cyan-400">
                      {s.materialsReturned}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-white">
                      {s.materialsConsumed}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-amber-400">
                      {s.materialsWasted}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span
                        className={`font-semibold ${
                          s.materialVariance === 0
                            ? 'text-emerald-400'
                            : s.materialVariance < 0
                            ? 'text-rose-400'
                            : 'text-cyan-400'
                        }`}
                      >
                        {s.materialVariance > 0 ? `+${s.materialVariance}` : s.materialVariance}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {s.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issue Modal */}
      <Modal
        isOpen={isIssueOpen}
        onClose={() => setIsIssueOpen(false)}
        title="Issue Inventory Materials to Job"
        subtitle="Deducts blank shirts or consumables from stock and assigns them to a job order"
      >
        {formError && (
          <div className="p-3 mb-4 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
            {formError}
          </div>
        )}

        <form onSubmit={handleIssue} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Target Job Order *</label>
            <select
              required
              value={issueData.jobId}
              onChange={(e) => setIssueData({ ...issueData, jobId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
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
            <label className="block text-xs font-medium text-slate-300 mb-1">Inventory Item to Issue *</label>
            <select
              required
              value={issueData.inventoryItemId}
              onChange={(e) => setIssueData({ ...issueData, inventoryItemId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            >
              <option value="">Select Blank Garment / Item</option>
              {inventoryItems.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name} ({it.currentStock} {it.unitOfMeasure} available)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Quantity to Issue *</label>
            <input
              type="number"
              min={1}
              required
              value={issueData.quantityIssued}
              onChange={(e) => setIssueData({ ...issueData, quantityIssued: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Notes</label>
            <textarea
              rows={2}
              placeholder="Store location or batch number..."
              value={issueData.notes}
              onChange={(e) => setIssueData({ ...issueData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsIssueOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 font-semibold text-xs text-white shadow-md shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50"
            >
              {submitting ? 'Issuing...' : 'Confirm Stock Issue'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Return Modal */}
      <Modal
        isOpen={isReturnOpen}
        onClose={() => setIsReturnOpen(false)}
        title="Return Unused Materials to Inventory"
        subtitle="Adds unused blank garments back to stock and reconciles against the job ticket"
      >
        {formError && (
          <div className="p-3 mb-4 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
            {formError}
          </div>
        )}

        <form onSubmit={handleReturn} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Target Job Order *</label>
            <select
              required
              value={returnData.jobId}
              onChange={(e) => setReturnData({ ...returnData, jobId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            >
              <option value="">Select Job</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.jobNumber} - {j.customer?.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Item Being Returned *</label>
            <select
              required
              value={returnData.inventoryItemId}
              onChange={(e) => setReturnData({ ...returnData, inventoryItemId: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            >
              <option value="">Select Garment / Item</option>
              {inventoryItems.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Quantity Returned *</label>
            <input
              type="number"
              min={1}
              required
              value={returnData.quantityReturned}
              onChange={(e) => setReturnData({ ...returnData, quantityReturned: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Notes</label>
            <textarea
              rows={2}
              placeholder="Reason for return, condition check..."
              value={returnData.notes}
              onChange={(e) => setReturnData({ ...returnData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsReturnOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-xs text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
            >
              {submitting ? 'Returning...' : 'Confirm Stock Return'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
