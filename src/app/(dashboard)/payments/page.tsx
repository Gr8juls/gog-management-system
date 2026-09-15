'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import {
  CreditCard,
  Plus,
  Search,
  DollarSign,
  Calendar,
  CheckCircle2,
  FileText,
  Briefcase,
  TrendingUp,
} from 'lucide-react';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal & Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    jobId: '',
    amount: 100,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH',
    reference: '',
    notes: '',
  });

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPaymentsAndJobs = async () => {
    try {
      setLoading(true);
      const [resPay, resJobs] = await Promise.all([
        fetch('/api/payments'),
        fetch('/api/jobs'),
      ]);

      if (resPay.ok) {
        const d = await resPay.json();
        setPayments(d.payments || []);
      }
      if (resJobs.ok) {
        const d = await resJobs.json();
        setJobs(d.jobs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentsAndJobs();
  }, []);

  const selectedJobInfo = jobs.find((j) => j.id === formData.jobId);

  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to record payment');
      } else {
        setIsModalOpen(false);
        fetchPaymentsAndJobs();
      }
    } catch (err: any) {
      setFormError(err.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Payments & Receipts Ledger</h1>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Record customer deposits, final settlements & track outstanding accounts receivable
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setFormError('');
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-lg shadow-emerald-500/20 transition-all"
        >
          <CreditCard className="w-4 h-4" />
          <span>Record Customer Payment</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-slate-400">Total Collected Payments</span>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1 font-mono">
            ${totalCollected.toFixed(2)}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">{payments.length} successful transactions</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-slate-400">Active Unsettled Jobs</span>
          <div className="text-2xl font-extrabold text-amber-400 mt-1 font-mono">
            {jobs.filter((j) => j.balanceDue > 0).length} jobs
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Awaiting complete balance payout</p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <span className="text-slate-400">Total Outstanding Balance</span>
          <div className="text-2xl font-extrabold text-white mt-1 font-mono">
            ${jobs.reduce((s, j) => s + (j.balanceDue || 0), 0).toFixed(2)}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">Across all client accounts</p>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Receipt Number</th>
                <th className="py-3 px-4">Job Order</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4 text-center">Amount Paid</th>
                <th className="py-3 px-4">Cashier / Staff</th>
                <th className="py-3 px-4 text-right">Payment Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">Loading payments...</td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">No payments recorded yet.</td>
                </tr>
              ) : (
                payments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                      {pay.paymentNumber}
                    </td>
                    <td className="py-3 px-4 font-mono text-white font-medium">
                      {pay.job?.jobNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-200">
                      {pay.job?.customer?.name}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {pay.paymentMethod.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {pay.reference || '-'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">
                      +RWF {pay.amount?.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {pay.recordedBy?.name || 'Front Desk'}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 text-[11px] font-mono">
                      {new Date(pay.paymentDate).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Customer Payment Receipt"
        subtitle="Applies payment towards job ticket total and reduces balance due"
      >
        {formError && (
          <div className="p-3 mb-4 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
            {formError}
          </div>
        )}

        <form onSubmit={handleSavePayment} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Target Job Order *</label>
            <select
              required
              value={formData.jobId}
              onChange={(e) => {
                const jId = e.target.value;
                const found = jobs.find((j) => j.id === jId);
                setFormData({
                  ...formData,
                  jobId: jId,
                  amount: found?.balanceDue || 100,
                });
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            >
              <option value="">Select Job</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.jobNumber} - {j.customer?.name} (Total: ${j.totalAmount} | Bal: ${j.balanceDue})
                </option>
              ))}
            </select>
          </div>

          {selectedJobInfo && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex justify-between">
              <div>
                <span className="text-slate-400">Total Quote: </span>
                <strong className="text-white">RWF {selectedJobInfo.totalAmount?.toFixed(2)}</strong>
              </div>
              <div>
                <span className="text-slate-400">Already Paid: </span>
                <strong className="text-emerald-400">RWF {selectedJobInfo.depositPaid?.toFixed(2)}</strong>
              </div>
              <div>
                <span className="text-slate-400">Remaining Bal: </span>
                <strong className="text-amber-400">RWF {selectedJobInfo.balanceDue?.toFixed(2)}</strong>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Amount to Pay ($) *</label>
              <input
                type="number"
                step="any"
                min={0.01}
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-emerald-300 font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Payment Method</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="CASH">Cash</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="MOBILE_MONEY">Mobile Money (MoMo)</option>
                <option value="CREDIT_CARD">Credit Card</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Transaction Reference</label>
              <input
                type="text"
                placeholder="Bank ref, MoMo transaction ID..."
                value={formData.reference}
                onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Payment Date</label>
              <input
                type="date"
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Notes</label>
            <textarea
              rows={2}
              placeholder="Payment description..."
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
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 font-semibold text-xs text-white shadow-md shadow-emerald-500/20 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50"
            >
              {submitting ? 'Recording...' : 'Record Payment Receipt'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
