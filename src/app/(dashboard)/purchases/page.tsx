'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import {
  Truck,
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  DollarSign,
  PackagePlus,
  Trash2,
} from 'lucide-react';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'purchases' | 'suppliers'>('purchases');

  // Modals
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);

  // Purchase Form
  const [purchaseData, setPurchaseData] = useState({
    supplierId: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    amountPaid: 0,
    notes: '',
    items: [{ inventoryItemId: '', quantity: 100, unitCost: 3.5 }],
  });

  // Supplier Form
  const [supplierData, setSupplierData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    taxNumber: '',
    productsSupplied: '',
    paymentTerms: 'Net 30',
    notes: '',
  });

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPurchasesAndSuppliers = async () => {
    try {
      setLoading(true);
      const [resPurchases, resSuppliers, resItems] = await Promise.all([
        fetch('/api/purchases'),
        fetch('/api/suppliers'),
        fetch('/api/inventory'),
      ]);

      if (resPurchases.ok) {
        const d = await resPurchases.json();
        setPurchases(d.purchases || []);
      }
      if (resSuppliers.ok) {
        const d = await resSuppliers.json();
        setSuppliers(d.suppliers || []);
      }
      if (resItems.ok) {
        const d = await resItems.json();
        setInventoryItems(d.items || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchasesAndSuppliers();
  }, []);

  const handleAddPurchaseItemRow = () => {
    setPurchaseData({
      ...purchaseData,
      items: [...purchaseData.items, { inventoryItemId: '', quantity: 50, unitCost: 3.5 }],
    });
  };

  const handleRemovePurchaseItemRow = (idx: number) => {
    if (purchaseData.items.length <= 1) return;
    setPurchaseData({
      ...purchaseData,
      items: purchaseData.items.filter((_, i) => i !== idx),
    });
  };

  const handlePurchaseItemChange = (idx: number, field: string, val: any) => {
    const updated = [...purchaseData.items];
    (updated[idx] as any)[field] = val;
    setPurchaseData({ ...purchaseData, items: updated });
  };

  const purchaseTotal = purchaseData.items.reduce(
    (sum, i) => sum + Number(i.quantity || 0) * Number(i.unitCost || 0),
    0
  );

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(purchaseData),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to receive purchase');
      } else {
        setIsPurchaseModalOpen(false);
        fetchPurchasesAndSuppliers();
      }
    } catch (err: any) {
      setFormError(err.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(supplierData),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to add supplier');
      } else {
        setIsSupplierModalOpen(false);
        fetchPurchasesAndSuppliers();
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
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Suppliers & Purchase Receiving</h1>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Receive purchase orders, automatically update inventory stock & track vendor payables
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setIsSupplierModalOpen(true);
              setFormError('');
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition-all"
          >
            <Building2 className="w-4 h-4" />
            <span>Add Supplier</span>
          </button>
          <button
            onClick={() => {
              setIsPurchaseModalOpen(true);
              setFormError('');
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 transition-all"
          >
            <PackagePlus className="w-4 h-4" />
            <span>Receive Purchase Order</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('purchases')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === 'purchases'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Purchase Orders ({purchases.length})
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === 'suppliers'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Vendor Directory ({suppliers.length})
        </button>
      </div>

      {/* Purchases Tab */}
      {activeTab === 'purchases' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Purchase Date</th>
                  <th className="py-3 px-4">Items Received</th>
                  <th className="py-3 px-4">Total Cost</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Balance Due</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">Loading purchase records...</td>
                  </tr>
                ) : purchases.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">No purchase receipts recorded yet.</td>
                  </tr>
                ) : (
                  purchases.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-400">{p.purchaseNumber}</td>
                      <td className="py-3 px-4 font-medium text-white">{p.supplier?.name}</td>
                      <td className="py-3 px-4 text-slate-300 font-mono">
                        {new Date(p.purchaseDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {p.items?.map((it: any) => (
                          <div key={it.id} className="text-[11px]">
                            {it.inventoryItem?.name} ({it.quantity} {it.inventoryItem?.unitOfMeasure})
                          </div>
                        ))}
                      </td>
                      <td className="py-3 px-4 font-bold font-mono text-white">RWF {p.totalCost?.toFixed(2)}</td>
                      <td className="py-3 px-4 font-mono text-emerald-400">RWF {p.amountPaid?.toFixed(2)}</td>
                      <td className={`py-3 px-4 font-mono font-bold ${p.balanceDue > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                        ${p.balanceDue?.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suppliers Tab */}
      {activeTab === 'suppliers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {suppliers.map((s) => (
            <div key={s.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-xs flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-[10px] text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/20">
                      {s.supplierCode}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5">{s.name}</h3>
                  </div>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {s.paymentTerms || 'Standard'}
                  </span>
                </div>

                <div className="mt-3.5 space-y-1 text-slate-400">
                  <div>Contact: <strong className="text-slate-200">{s.contactPerson || 'Sales Dept'}</strong></div>
                  <div>Phone: <strong className="text-slate-200">{s.phone}</strong></div>
                  {s.email && <div>Email: <strong className="text-slate-200">{s.email}</strong></div>}
                  {s.productsSupplied && (
                    <div className="text-[11px] text-slate-400 mt-2 p-2 rounded-lg bg-slate-950/80 border border-slate-800">
                      Supplies: {s.productsSupplied}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
                Purchase receipts on file: <strong className="text-white">{s.purchases?.length || 0}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Purchase Modal */}
      <Modal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        title="Receive Purchase Order"
        subtitle="Receipt automatically increments inventory stock balance and records purchase receipt transaction"
        maxWidth="2xl"
      >
        {formError && (
          <div className="p-3 mb-4 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
            {formError}
          </div>
        )}

        <form onSubmit={handleSavePurchase} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Supplier *</label>
              <select
                required
                value={purchaseData.supplierId}
                onChange={(e) => setPurchaseData({ ...purchaseData, supplierId: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="">Select Vendor</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.supplierCode})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Purchase Date *</label>
              <input
                type="date"
                required
                value={purchaseData.purchaseDate}
                onChange={(e) => setPurchaseData({ ...purchaseData, purchaseDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Items Received *</span>
              <button
                type="button"
                onClick={handleAddPurchaseItemRow}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                + Add Item
              </button>
            </div>

            {purchaseData.items.map((item, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-12 gap-2 items-center text-xs">
                <div className="col-span-6">
                  <select
                    required
                    value={item.inventoryItemId}
                    onChange={(e) => handlePurchaseItemChange(idx, 'inventoryItemId', e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  >
                    <option value="">Select Catalog Item</option>
                    {inventoryItems.map((it) => (
                      <option key={it.id} value={it.id}>{it.name} ({it.sku})</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    min={1}
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handlePurchaseItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono text-center"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    step="0.01"
                    min={0.01}
                    placeholder="Cost"
                    value={item.unitCost}
                    onChange={(e) => handlePurchaseItemChange(idx, 'unitCost', parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono text-center"
                    required
                  />
                </div>
                <div className="col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemovePurchaseItemRow(idx)}
                    disabled={purchaseData.items.length <= 1}
                    className="text-slate-500 hover:text-rose-400 disabled:opacity-20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <span className="block text-xs text-slate-400 mb-1">Total Order Cost</span>
              <span className="text-lg font-bold font-mono text-white">RWF {purchaseTotal.toFixed(2)}</span>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Amount Paid Upfront ($)</label>
              <input
                type="number"
                min={0}
                value={purchaseData.amountPaid}
                onChange={(e) => setPurchaseData({ ...purchaseData, amountPaid: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsPurchaseModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-xs text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
            >
              {submitting ? 'Receiving...' : 'Confirm Stock Receipt'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Supplier Modal */}
      <Modal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        title="Add Vendor / Supplier"
        subtitle="Register new raw material, ink or blank garment supplier"
      >
        <form onSubmit={handleSaveSupplier} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Supplier Company Name *</label>
            <input
              type="text"
              required
              value={supplierData.name}
              onChange={(e) => setSupplierData({ ...supplierData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Contact Person</label>
              <input
                type="text"
                value={supplierData.contactPerson}
                onChange={(e) => setSupplierData({ ...supplierData, contactPerson: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={supplierData.phone}
                onChange={(e) => setSupplierData({ ...supplierData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Products Supplied</label>
            <input
              type="text"
              placeholder="e.g. Blank T-shirts, DTF Inks, Powders"
              value={supplierData.productsSupplied}
              onChange={(e) => setSupplierData({ ...supplierData, productsSupplied: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsSupplierModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-xs text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
