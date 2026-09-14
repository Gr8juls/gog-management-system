'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import {
  Briefcase,
  Search,
  Plus,
  Filter,
  Calendar,
  User,
  DollarSign,
  AlertCircle,
  Clock,
  CheckCircle2,
  Trash2,
  Eye,
  FileText,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    customerId: '',
    requiredDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    productType: 'T-shirts',
    brandingMethod: 'DTF',
    designReference: '',
    priority: 'MEDIUM',
    discount: 0,
    tax: 0,
    depositPaid: 0,
    notes: '',
    labourCostEstimate: 20,
    overheadCostEstimate: 15,
    packagingCostEstimate: 5,
    deliveryCostEstimate: 0,
    items: [
      {
        itemDescription: 'Round-neck T-Shirt - Black / M',
        garmentType: 'Round-neck',
        brand: 'Gildan Heavy Cotton',
        size: 'M',
        color: 'Black',
        quantityOrdered: 50,
        unitPrice: 8.0,
      },
    ],
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (statusFilter) query.append('status', statusFilter);
      if (search) query.append('search', search);

      const res = await fetch(`/api/jobs?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchCustomers();
  }, [statusFilter]);

  const handleAddItemRow = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          itemDescription: 'Round-neck T-Shirt - Black / L',
          garmentType: 'Round-neck',
          brand: 'Gildan Heavy Cotton',
          size: 'L',
          color: 'Black',
          quantityOrdered: 50,
          unitPrice: 8.0,
        },
      ],
    });
  };

  const handleRemoveItemRow = (idx: number) => {
    if (formData.items.length <= 1) return;
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== idx),
    });
  };

  const handleItemChange = (idx: number, field: string, val: any) => {
    const updated = [...formData.items];
    (updated[idx] as any)[field] = val;
    setFormData({ ...formData, items: updated });
  };

  const subtotal = formData.items.reduce(
    (sum, i) => sum + Number(i.quantityOrdered || 0) * Number(i.unitPrice || 0),
    0
  );
  const totalAmount = subtotal - Number(formData.discount || 0) + Number(formData.tax || 0);
  const balanceDue = Math.max(0, totalAmount - Number(formData.depositPaid || 0));

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to create job');
      } else {
        setIsCreateOpen(false);
        fetchJobs();
      }
    } catch (err: any) {
      setFormError(err.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenDetail = async (jobId: string) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedJob(data.job);
        setIsDetailOpen(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedJob) return;
    try {
      const res = await fetch(`/api/jobs/${selectedJob.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to update job status');
      } else {
        setSelectedJob(data.job);
        fetchJobs();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const statuses = [
    'QUOTATION',
    'APPROVED',
    'MATERIALS_RESERVED',
    'IN_PRODUCTION',
    'QUALITY_CHECK',
    'COMPLETED',
    'DELIVERED',
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Jobs & Orders Workflow</h1>
          <p className="text-xs text-slate-400 mt-1">Manage production tickets, multi-item garment specs & status progression</p>
        </div>
        <button
          onClick={() => {
            setIsCreateOpen(true);
            setFormError('');
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Job Ticket</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-800 text-xs">
        <button
          onClick={() => setStatusFilter('')}
          className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
            statusFilter === '' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
          }`}
        >
          All Statuses ({jobs.length})
        </button>
        {statuses.map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              statusFilter === st ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Jobs Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Job Number</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Product / Method</th>
                <th className="py-3 px-4">Deadline</th>
                <th className="py-3 px-4">Ordered / Done</th>
                <th className="py-3 px-4">Total & Balance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">Loading jobs...</td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">No jobs found in this category.</td>
                </tr>
              ) : (
                jobs.map((job) => {
                  const totalOrdered = job.items?.reduce((s: number, i: any) => s + i.quantityOrdered, 0) || 0;
                  const totalCompleted = job.items?.reduce((s: number, i: any) => s + i.quantityCompleted, 0) || 0;
                  const progressPct = totalOrdered > 0 ? Math.round((totalCompleted / totalOrdered) * 100) : 0;

                  return (
                    <tr key={job.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                        {job.jobNumber}
                        {job.designReference && (
                          <div className="text-[10px] text-slate-400 font-sans">{job.designReference}</div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{job.customer?.name}</div>
                        <div className="text-[10px] text-slate-400">{job.customer?.customerNumber}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-200">{job.productType}</span>
                        <span className="text-[10px] block text-slate-400">{job.brandingMethod}</span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {new Date(job.requiredDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">{totalCompleted} / {totalOrdered}</span>
                          <span className="text-[10px] text-slate-400 font-mono">({progressPct}%)</span>
                        </div>
                        <div className="w-24 h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${progressPct >= 100 ? 'bg-emerald-500' : 'bg-cyan-500'}`}
                            style={{ width: `${Math.min(100, progressPct)}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {job.totalAmount !== null ? (
                          <>
                            <div className="font-bold text-white">${job.totalAmount?.toFixed(2)}</div>
                            <div className={`text-[10px] ${job.balanceDue > 0 ? 'text-amber-400 font-medium' : 'text-emerald-400'}`}>
                              Bal: ${job.balanceDue?.toFixed(2)}
                            </div>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Financials hidden</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-cyan-300 border border-slate-700">
                          {job.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenDetail(job.id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 font-semibold text-xs transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Job Ticket Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Job Ticket"
        subtitle="Specify customer, product type, branding method, and multi-line item breakdown"
        maxWidth="4xl"
      >
        {formError && (
          <div className="p-3 mb-4 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
            {formError}
          </div>
        )}

        <form onSubmit={handleCreateJob} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Customer *</label>
              <select
                required
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">Select Customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.customerNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Required Completion Date *</label>
              <input
                type="date"
                required
                value={formData.requiredDate}
                onChange={(e) => setFormData({ ...formData, requiredDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent (Rush Job)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Product Type *</label>
              <select
                value={formData.productType}
                onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="T-shirts">T-shirts</option>
                <option value="Polo shirts">Polo shirts</option>
                <option value="Caps">Caps</option>
                <option value="Mugs">Mugs</option>
                <option value="Banners">Banners</option>
                <option value="Stickers">Stickers</option>
                <option value="Signage">Signage</option>
                <option value="Hoodies">Hoodies</option>
                <option value="Other">Other customized products</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Branding Method *</label>
              <select
                value={formData.brandingMethod}
                onChange={(e) => setFormData({ ...formData, brandingMethod: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="DTF">DTF (Direct to Film)</option>
                <option value="Screen printing">Screen printing</option>
                <option value="DTG">DTG (Direct to Garment)</option>
                <option value="Heat transfer">Heat transfer</option>
                <option value="Sublimation">Sublimation</option>
                <option value="Embroidery">Embroidery</option>
                <option value="Vinyl cutting">Vinyl cutting</option>
                <option value="Large-format printing">Large-format printing</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Design / Artwork Reference</label>
              <input
                type="text"
                placeholder="e.g. LOGO-CHEST-BACK-RUNNERS"
                value={formData.designReference}
                onChange={(e) => setFormData({ ...formData, designReference: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Line Items Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-white uppercase tracking-wider">
                Job Line Items Breakdown *
              </label>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Line Item</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {formData.items.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-12 gap-2 items-center text-xs">
                  <div className="col-span-4">
                    <input
                      type="text"
                      placeholder="Item Description"
                      value={item.itemDescription}
                      onChange={(e) => handleItemChange(idx, 'itemDescription', e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      required
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Size (e.g. M)"
                      value={item.size}
                      onChange={(e) => handleItemChange(idx, 'size', e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white text-center"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      placeholder="Color (e.g. Black)"
                      value={item.color}
                      onChange={(e) => handleItemChange(idx, 'color', e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white text-center"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Qty"
                      min={1}
                      value={item.quantityOrdered}
                      onChange={(e) => handleItemChange(idx, 'quantityOrdered', parseInt(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white text-center"
                      required
                    />
                  </div>
                  <div className="col-span-1">
                    <input
                      type="number"
                      placeholder="Price"
                      step="0.1"
                      min={0}
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-1.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white text-center"
                      required
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(idx)}
                      disabled={formData.items.length <= 1}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing & Deposit Summary */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Subtotal</span>
              <span className="font-bold text-white text-sm">${subtotal.toFixed(2)}</span>
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Discount ($)</label>
              <input
                type="number"
                min={0}
                value={formData.discount}
                onChange={(e) => setFormData({ ...formData, discount: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Deposit Paid ($)</label>
              <input
                type="number"
                min={0}
                value={formData.depositPaid}
                onChange={(e) => setFormData({ ...formData, depositPaid: parseFloat(e.target.value) || 0 })}
                className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
              />
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Balance Due</span>
              <span className={`font-bold text-sm ${balanceDue > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                ${balanceDue.toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Production Notes</label>
            <textarea
              rows={2}
              placeholder="Print placement details, packaging notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-xs text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
            >
              {submitting ? 'Creating Job...' : 'Confirm & Create Job'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Job Detail & Workflow Progression Modal */}
      {selectedJob && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Job Details: ${selectedJob.jobNumber}`}
          subtitle={`Customer: ${selectedJob.customer?.name} • Required: ${new Date(selectedJob.requiredDate).toLocaleDateString()}`}
          maxWidth="4xl"
        >
          <div className="space-y-5">
            {/* Status Progression Stepper */}
            <div>
              <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Workflow Progression</p>
              <div className="flex flex-wrap gap-2">
                {statuses.map((s) => {
                  const isCurrent = selectedJob.status === s;
                  return (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(s)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isCurrent
                          ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {s.replace('_', ' ')}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Line items progress */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Line Items & Quantities</h4>
              <div className="space-y-3">
                {selectedJob.items?.map((item: any) => (
                  <div key={item.id} className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="font-semibold text-white">{item.itemDescription}</span>
                      <span className="text-cyan-400 font-mono">Pending: {item.quantityPending} units</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-[11px] text-slate-400">
                      <div>Ordered: <strong className="text-white">{item.quantityOrdered}</strong></div>
                      <div>Completed: <strong className="text-emerald-400">{item.quantityCompleted}</strong></div>
                      <div>Rejected: <strong className="text-amber-400">{item.quantityRejected}</strong></div>
                      <div>Damaged: <strong className="text-rose-400">{item.quantityDamaged}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Linked Production Records */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Recorded Production Runs</h4>
              {selectedJob.dailyProductions?.length === 0 ? (
                <p className="text-xs text-slate-400">No daily production runs logged yet.</p>
              ) : (
                <div className="space-y-2">
                  {selectedJob.dailyProductions?.map((p: any) => (
                    <div key={p.id} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-xs flex items-center justify-between">
                      <div>
                        <div className="font-medium text-white">{new Date(p.date).toLocaleDateString()} - {p.product}</div>
                        <div className="text-[10px] text-slate-400">
                          Operator: {p.operator?.name || 'Assigned Staff'} • Station: {p.workstation || 'Standard'}
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-emerald-400 font-bold">+{p.quantityCompleted} done</span>
                        {p.quantityRejected > 0 && <span className="text-amber-400 ml-2">({p.quantityRejected} rejected)</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Financials & Payments */}
            {selectedJob.totalAmount !== null && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-400">Total Job Quote: </span>
                  <strong className="text-white text-sm">${selectedJob.totalAmount?.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Deposit Received: </span>
                  <strong className="text-emerald-400 text-sm">${selectedJob.depositPaid?.toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Outstanding Balance: </span>
                  <strong className="text-amber-400 text-sm">${selectedJob.balanceDue?.toFixed(2)}</strong>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
