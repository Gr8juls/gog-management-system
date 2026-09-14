'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  Shirt,
  DollarSign,
  ArrowDownUp,
  History,
  CheckCircle2,
  RefreshCw,
  Layers,
  SlidersHorizontal,
} from 'lucide-react';

export default function InventoryPage() {
  const [items, setItems] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'catalog' | 'tshirts' | 'transactions'>('catalog');

  // Modals
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedItemForAdjust, setSelectedItemForAdjust] = useState<any>(null);

  // New Item Form
  const [itemFormData, setItemFormData] = useState({
    sku: '',
    name: '',
    category: 'BLANK_TSHIRTS',
    description: '',
    unitOfMeasure: 'pcs',
    garmentType: 'Round-neck',
    brand: 'Gildan Heavy Cotton',
    size: 'M',
    color: 'Black',
    gender: 'Unisex',
    openingStock: 100,
    reorderLevel: 25,
    unitCost: 3.5,
    sellingPrice: 8.0,
    storageLocation: 'Aisle 1',
  });

  // Adjust Form
  const [adjustFormData, setAdjustFormData] = useState({
    type: 'ADJUSTMENT',
    quantity: 0,
    reason: '',
    notes: '',
  });

  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (categoryFilter) query.append('category', categoryFilter);
      if (search) query.append('search', search);
      if (lowStockFilter) query.append('lowStockOnly', 'true');

      const res = await fetch(`/api/inventory?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/inventory/transactions?limit=100');
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchTransactions();
  }, [categoryFilter, lowStockFilter]);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemFormData),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to add item');
      } else {
        setIsItemModalOpen(false);
        fetchInventory();
        fetchTransactions();
      }
    } catch (err: any) {
      setFormError(err.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenAdjust = (item: any) => {
    setSelectedItemForAdjust(item);
    setAdjustFormData({
      type: 'ADJUSTMENT',
      quantity: 0,
      reason: 'Physical cycle count discrepancy correction',
      notes: '',
    });
    setFormError('');
    setIsAdjustModalOpen(true);
  };

  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForAdjust) return;
    setSubmitting(true);
    setFormError('');

    try {
      const res = await fetch('/api/inventory/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventoryItemId: selectedItemForAdjust.id,
          type: adjustFormData.type,
          quantity: Number(adjustFormData.quantity),
          reason: adjustFormData.reason,
          notes: adjustFormData.notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to save adjustment');
      } else {
        setIsAdjustModalOpen(false);
        fetchInventory();
        fetchTransactions();
      }
    } catch (err: any) {
      setFormError(err.message || 'Error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [
    { key: 'BLANK_TSHIRTS', name: 'Blank T-Shirts' },
    { key: 'OTHER_GARMENTS', name: 'Other Garments (Polos, Hoodies)' },
    { key: 'INK', name: 'Printing Inks' },
    { key: 'DTF_POWDER', name: 'DTF Adhesive Powders' },
    { key: 'TRANSFER_FILM', name: 'Transfer Films' },
    { key: 'PACKAGING', name: 'Packaging Materials' },
    { key: 'CLEANING_SUPPLIES', name: 'Cleaning Supplies' },
  ];

  const tshirtItems = items.filter(
    (i) => i.category === 'BLANK_TSHIRTS' || i.category === 'OTHER_GARMENTS'
  );

  const totalInventoryValuation = items.reduce(
    (sum, i) => sum + i.currentStock * i.unitCost,
    0
  );
  const lowStockCount = items.filter((i) => i.currentStock <= i.reorderLevel).length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Inventory & Stock Ledger</h1>
          <p className="text-xs text-slate-400 mt-1">
            Track blank garments by size and color, inks, films, stock transactions & reorder levels
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsItemModalOpen(true);
              setFormError('');
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Catalog Item</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-400">Total Items in Catalog</span>
            <div className="text-xl font-bold text-white mt-0.5">{items.length} SKUs</div>
          </div>
          <Package className="w-6 h-6 text-cyan-400" />
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-400">Low-Stock Alerts</span>
            <div className="text-xl font-bold text-amber-400 mt-0.5">{lowStockCount} items</div>
          </div>
          <AlertTriangle className="w-6 h-6 text-amber-400" />
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-400">T-Shirt Stock</span>
            <div className="text-xl font-bold text-emerald-400 mt-0.5">
              {tshirtItems.reduce((s, i) => s + i.currentStock, 0)} units
            </div>
          </div>
          <Shirt className="w-6 h-6 text-emerald-400" />
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-slate-400">Inventory Valuation</span>
            <div className="text-xl font-bold text-white mt-0.5">
              ${totalInventoryValuation.toFixed(2)}
            </div>
          </div>
          <DollarSign className="w-6 h-6 text-cyan-400" />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === 'catalog'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          All Inventory Catalog
        </button>
        <button
          onClick={() => setActiveTab('tshirts')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === 'tshirts'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          T-Shirt Matrix (Size & Color)
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
            activeTab === 'transactions'
              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Stock Transaction History (Ledger)
        </button>
      </div>

      {/* Main Tab 1: Catalog */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          {/* Search & Category Filter */}
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by SKU, name, color, or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-300"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.name}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setLowStockFilter(!lowStockFilter)}
                className={`px-3 py-1.5 rounded-xl border font-medium transition-colors ${
                  lowStockFilter
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-slate-950 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                Low Stock Only
              </button>
            </div>
          </div>

          {/* Catalog Table */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">SKU / Code</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4 text-center">Unit Cost</th>
                  <th className="py-3 px-4 text-center">Stock Level</th>
                  <th className="py-3 px-4 text-center">Reorder Lvl</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">Loading catalog...</td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">No items found matching filter.</td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const isLow = item.currentStock <= item.reorderLevel;
                    return (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                          {item.sku}
                        </td>
                        <td className="py-3 px-4 font-medium text-white">
                          <div>{item.name}</div>
                          {item.brand && (
                            <div className="text-[10px] text-slate-400">{item.brand}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                            {item.category.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">
                          {item.storageLocation || 'Warehouse'}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-200">
                          ${item.unitCost?.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold">
                          <span
                            className={`px-2.5 py-1 rounded-full ${
                              isLow
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'text-emerald-400'
                            }`}
                          >
                            {item.currentStock} {item.unitOfMeasure}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-slate-400">
                          {item.reorderLevel} {item.unitOfMeasure}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenAdjust(item)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 font-medium text-xs transition-colors"
                          >
                            Adjust Stock
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
      )}

      {/* Main Tab 2: T-Shirt Size/Color Matrix */}
      {activeTab === 'tshirts' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Shirt className="w-4 h-4 text-emerald-400" />
              <span>Garment Matrix Breakdown</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Real-time stock of blank T-shirts categorized by Garment Type, Size, and Color
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tshirtItems.map((shirt) => (
                <div key={shirt.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-semibold text-white">{shirt.name}</div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      Type: <strong className="text-slate-300">{shirt.garmentType || 'Round-neck'}</strong> • Size: <strong className="text-cyan-400 font-mono">{shirt.size}</strong> • Color: <strong className="text-slate-300">{shirt.color}</strong>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Cost: ${shirt.unitCost?.toFixed(2)} / unit</div>
                  </div>
                  <div className="text-right">
                    <span className={`text-lg font-bold font-mono ${shirt.currentStock <= shirt.reorderLevel ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {shirt.currentStock}
                    </span>
                    <span className="block text-[10px] text-slate-400">in stock</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Tab 3: Stock Transaction History */}
      {activeTab === 'transactions' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Item</th>
                <th className="py-3 px-4">Movement Type</th>
                <th className="py-3 px-4 text-center">Quantity Delta</th>
                <th className="py-3 px-4 text-center">New Balance</th>
                <th className="py-3 px-4">Reason / Notes</th>
                <th className="py-3 px-4 text-right">Date & Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">No stock movements recorded yet.</td>
                </tr>
              ) : (
                transactions.map((t) => {
                  const isPos = t.quantity > 0;
                  return (
                    <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-300">
                        {t.transactionNumber}
                      </td>
                      <td className="py-3 px-4 text-white font-medium">
                        {t.inventoryItem?.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {t.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-center font-mono font-bold ${isPos ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPos ? `+${t.quantity}` : t.quantity}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-200">
                        {t.balanceAfter}
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-[220px] truncate">
                        {t.reason || t.notes || 'Normal operational update'}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 text-[11px]">
                        {new Date(t.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add New Catalog Item Modal */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title="Add New Inventory Catalog Item"
        subtitle="Define SKU, category, garment specs, opening balance & reorder threshold"
        maxWidth="2xl"
      >
        {formError && (
          <div className="p-3 mb-4 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
            {formError}
          </div>
        )}

        <form onSubmit={handleCreateItem} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">SKU / Item Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. TSH-BLK-XL"
                value={itemFormData.sku}
                onChange={(e) => setItemFormData({ ...itemFormData, sku: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Item Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Round-neck T-Shirt - Black / XL"
                value={itemFormData.name}
                onChange={(e) => setItemFormData({ ...itemFormData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Category *</label>
              <select
                value={itemFormData.category}
                onChange={(e) => setItemFormData({ ...itemFormData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              >
                {categories.map((c) => (
                  <option key={c.key} value={c.key}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Unit of Measure *</label>
              <input
                type="text"
                required
                placeholder="pcs, ml, rolls, kg"
                value={itemFormData.unitOfMeasure}
                onChange={(e) => setItemFormData({ ...itemFormData, unitOfMeasure: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          {/* Garment Specifics (if category is garments) */}
          {(itemFormData.category === 'BLANK_TSHIRTS' || itemFormData.category === 'OTHER_GARMENTS') && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Garment Type</label>
                <input
                  type="text"
                  value={itemFormData.garmentType}
                  onChange={(e) => setItemFormData({ ...itemFormData, garmentType: e.target.value })}
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Size</label>
                <input
                  type="text"
                  value={itemFormData.size}
                  onChange={(e) => setItemFormData({ ...itemFormData, size: e.target.value })}
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Color</label>
                <input
                  type="text"
                  value={itemFormData.color}
                  onChange={(e) => setItemFormData({ ...itemFormData, color: e.target.value })}
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Opening Stock</label>
              <input
                type="number"
                min={0}
                value={itemFormData.openingStock}
                onChange={(e) => setItemFormData({ ...itemFormData, openingStock: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Reorder Level</label>
              <input
                type="number"
                min={1}
                value={itemFormData.reorderLevel}
                onChange={(e) => setItemFormData({ ...itemFormData, reorderLevel: parseFloat(e.target.value) || 10 })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Unit Cost ($)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={itemFormData.unitCost}
                onChange={(e) => setItemFormData({ ...itemFormData, unitCost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Storage Location</label>
            <input
              type="text"
              placeholder="e.g. Aisle 1 - Shelf B2"
              value={itemFormData.storageLocation}
              onChange={(e) => setItemFormData({ ...itemFormData, storageLocation: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsItemModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-xs text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Add Catalog Item'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      {selectedItemForAdjust && (
        <Modal
          isOpen={isAdjustModalOpen}
          onClose={() => setIsAdjustModalOpen(false)}
          title={`Adjust Stock: ${selectedItemForAdjust.name}`}
          subtitle={`SKU: ${selectedItemForAdjust.sku} • Current Stock: ${selectedItemForAdjust.currentStock} ${selectedItemForAdjust.unitOfMeasure}`}
        >
          {formError && (
            <div className="p-3 mb-4 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
              {formError}
            </div>
          )}

          <form onSubmit={handleSaveAdjustment} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Adjustment Type *</label>
              <select
                value={adjustFormData.type}
                onChange={(e) => setAdjustFormData({ ...adjustFormData, type: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="ADJUSTMENT">Stock Adjustment (+ or -)</option>
                <option value="DAMAGE">Stock Damaged in Storage (-)</option>
                <option value="WASTAGE">Stock Wastage / Expired (-)</option>
                <option value="STOCK_COUNT_CORRECTION">Cycle Count Correction</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Quantity Delta (e.g. +10 to add, -5 to deduct) *
              </label>
              <input
                type="number"
                step="any"
                required
                value={adjustFormData.quantity}
                onChange={(e) => setAdjustFormData({ ...adjustFormData, quantity: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Specific Reason (Mandatory for audit compliance) *
              </label>
              <input
                type="text"
                required
                placeholder="Reason for adjustment..."
                value={adjustFormData.reason}
                onChange={(e) => setAdjustFormData({ ...adjustFormData, reason: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Additional Notes</label>
              <textarea
                rows={2}
                placeholder="Manager authorization reference, inspection notes..."
                value={adjustFormData.notes}
                onChange={(e) => setAdjustFormData({ ...adjustFormData, notes: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs text-slate-300 hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 font-semibold text-xs text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50"
              >
                {submitting ? 'Applying...' : 'Apply Stock Transaction'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
