'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  DollarSign,
  Shirt,
  Droplets,
  Briefcase,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('daily-production');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      query.append('type', reportType);
      if (startDate) query.append('startDate', startDate);
      if (endDate) query.append('endDate', endDate);

      const res = await fetch(`/api/reports?${query.toString()}`);
      if (res.ok) {
        const d = await res.json();
        setReportData(d);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType]);

  const exportToCSV = () => {
    if (!reportData?.records || reportData.records.length === 0) {
      alert('No records to export');
      return;
    }

    const items = reportData.records;
    const header = Object.keys(items[0]).filter(
      (k) => typeof items[0][k] !== 'object'
    );
    const csvRows = [
      header.join(','),
      ...items.map((row: any) =>
        header
          .map((fieldName) => {
            let val = row[fieldName] !== null && row[fieldName] !== undefined ? row[fieldName] : '';
            val = String(val).replace(/"/g, '""');
            return `"${val}"`;
          })
          .join(',')
      ),
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GOG_Report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printReport = () => {
    window.print();
  };

  const reportTabs = [
    { key: 'daily-production', name: 'Daily Production Report', icon: BarChart3 },
    { key: 'ink-usage', name: 'Ink Usage & Waste Report', icon: Droplets },
    { key: 't-shirt', name: 'T-Shirt Matrix Report', icon: Shirt },
    { key: 'inventory', name: 'Inventory & Valuation Report', icon: Layers },
    { key: 'jobs', name: 'Jobs Status & SLA Report', icon: Briefcase },
    { key: 'profitability', name: 'Job Profitability Report', icon: DollarSign },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Executive & Operational Reports</h1>
          <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
            Export operational statistics, ink consumption, T-shirt movements & gross profit margins
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={printReport}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0c1a30] hover:bg-[#112544] text-slate-200 font-semibold text-xs border border-[#173256] transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Layout</span>
          </button>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#00adef] via-[#006eb9] to-[#005291] hover:from-[#25bfff] hover:to-[#005da5] text-white font-semibold text-xs shadow-lg shadow-[#00adef]/20 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-[#0c1a30] p-2 rounded-2xl border border-[#173256] text-xs no-print">
        {reportTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = reportType === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setReportType(tab.key)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl font-medium transition-all ${
                isActive
                  ? 'bg-[#00adef]/20 text-[#38c8ff] border border-[#00adef]/40 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Date Filter Bar */}
      <div className="p-3 sm:p-4 rounded-2xl bg-[#0c1a30] border border-[#173256] flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3 text-xs no-print">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <span className="text-slate-400 flex items-center gap-1.5 font-medium">
            <Calendar className="w-3.5 h-3.5 text-[#00adef]" />
            <span>Date Range:</span>
          </span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 bg-[#060e1c] border border-[#173256] rounded-xl text-xs text-white flex-1 sm:flex-initial min-w-0"
          />
          <span className="text-slate-500">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 bg-[#060e1c] border border-[#173256] rounded-xl text-xs text-white flex-1 sm:flex-initial min-w-0"
          />
          <button
            onClick={fetchReport}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#00adef] to-[#006eb9] hover:from-[#25bfff] hover:to-[#005da5] text-white font-semibold shadow-sm whitespace-nowrap"
          >
            Apply Date Filter
          </button>
        </div>

        <div className="text-[11px] text-slate-400">
          Generated: <strong className="text-white">{new Date().toLocaleDateString()}</strong>
        </div>
      </div>

      {/* Printable Report Header with Official Logo */}
      <div className="hidden print:block mb-6 p-4 border-b border-black">
        <div className="flex items-center gap-4 mb-2">
          <img src="/logo.png" alt="GOG TECH HOUSE" className="h-12 w-auto object-contain" />
          <div>
            <h1 className="text-2xl font-bold">GOG TECH HOUSE</h1>
            <p className="text-xs text-gray-500">Production & Inventory Management System</p>
          </div>
        </div>
        <h2 className="text-lg font-semibold text-gray-700 capitalize">
          {reportType.replace('-', ' ')} Report
        </h2>
        <p className="text-xs text-gray-500">
          Date: {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Report Summary Card */}
      {reportData?.summary && (
        <div className="p-5 rounded-2xl bg-[#0c1a30]/90 border border-[#173256] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          {Object.entries(reportData.summary).map(([key, val]: any) => {
            if (typeof val === 'object') return null;
            return (
              <div key={key}>
                <span className="text-slate-400 uppercase tracking-wider text-[10px] block">
                  {key.replace(/([A-Z])/g, ' $1')}
                </span>
                <span className="text-xl font-bold text-[#38c8ff] font-mono mt-0.5 block">
                  {typeof val === 'number' && key.toLowerCase().includes('cost') || key.toLowerCase().includes('revenue') || key.toLowerCase().includes('profit') || key.toLowerCase().includes('valuation')
                    ? `$${val.toFixed(2)}`
                    : key.toLowerCase().includes('margin')
                    ? `${val}%`
                    : val}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Report Table Rendering */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          {/* 1. Daily Production Report */}
          {reportType === 'daily-production' && (
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Job Ticket</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Product</th>
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
                {reportData?.records?.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-300">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">{r.job?.jobNumber}</td>
                    <td className="py-3 px-4 text-slate-200">{r.job?.customer?.name}</td>
                    <td className="py-3 px-4 text-white font-medium">{r.product}</td>
                    <td className="py-3 px-4 text-center font-mono">{r.quantityPlanned}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">+{r.quantityCompleted}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-amber-400">{r.quantityRejected}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-rose-400">{r.quantityDamaged}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-cyan-400">{r.quantityRemaining}</td>
                    <td className="py-3 px-4 text-slate-300">{r.operator?.name || 'Staff'}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {r.qualityStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 2. Ink Usage Report */}
          {reportType === 'ink-usage' && (
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Color</th>
                  <th className="py-3 px-4">Ink Item SKU</th>
                  <th className="py-3 px-4">Job Reference</th>
                  <th className="py-3 px-4 text-center">Used (ml)</th>
                  <th className="py-3 px-4 text-center">Wasted (ml)</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4 text-right">Unit Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reportData?.records?.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-300">{new Date(r.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 font-bold text-white">{r.color}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{r.inventoryItem?.sku}</td>
                    <td className="py-3 px-4 font-mono text-cyan-400">{r.job?.jobNumber || 'Non-job print'}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">{r.quantityUsed} ml</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-amber-400">{r.quantityWasted} ml</td>
                    <td className="py-3 px-4 text-slate-300">{r.reason.replace('_', ' ')}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300">${r.inventoryItem?.unitCost?.toFixed(3)} / ml</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 3. T-shirt Report */}
          {reportType === 't-shirt' && (
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Garment Name</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">Color</th>
                  <th className="py-3 px-4 text-center">Total Inbound</th>
                  <th className="py-3 px-4 text-center">Issued to Jobs</th>
                  <th className="py-3 px-4 text-center">Returned Unused</th>
                  <th className="py-3 px-4 text-center font-bold text-cyan-400">Current Stock</th>
                  <th className="py-3 px-4 text-right">Unit Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reportData?.records?.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">{r.sku}</td>
                    <td className="py-3 px-4 text-white font-medium">{r.name}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-200">{r.size || 'M'}</td>
                    <td className="py-3 px-4 text-slate-300">{r.color || 'Black'}</td>
                    <td className="py-3 px-4 text-center font-mono">{r.received}</td>
                    <td className="py-3 px-4 text-center font-mono text-emerald-400">{r.issued}</td>
                    <td className="py-3 px-4 text-center font-mono text-cyan-400">{r.returned}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-white">{r.currentStock}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300">${r.unitCost?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 4. Inventory Valuation Report */}
          {reportType === 'inventory' && (
            <table className="w-full min-w-[600px] text-left text-xs">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Current Stock</th>
                  <th className="py-3 px-4 text-center">Reorder Threshold</th>
                  <th className="py-3 px-4 text-center">Unit Cost</th>
                  <th className="py-3 px-4 text-right">Stock Valuation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reportData?.records?.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">{r.sku}</td>
                    <td className="py-3 px-4 text-white font-medium">{r.name}</td>
                    <td className="py-3 px-4 text-slate-300">{r.category.replace('_', ' ')}</td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-white">{r.currentStock} {r.unitOfMeasure}</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-400">{r.reorderLevel}</td>
                    <td className="py-3 px-4 text-center font-mono text-slate-300">${r.unitCost?.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">${r.valuation?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 5. Job Report */}
          {reportType === 'jobs' && (
            <table className="w-full min-w-[700px] text-left text-xs">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Job Number</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Date Received</th>
                  <th className="py-3 px-4">Required Date</th>
                  <th className="py-3 px-4 text-center">Ordered</th>
                  <th className="py-3 px-4 text-center">Completed</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reportData?.records?.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">{r.jobNumber}</td>
                    <td className="py-3 px-4 text-white font-medium">{r.customerName}</td>
                    <td className="py-3 px-4 text-slate-300">{r.productType}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{new Date(r.dateReceived).toLocaleDateString()}</td>
                    <td className={`py-3 px-4 font-mono ${r.isOverdue ? 'text-rose-400 font-bold' : 'text-slate-300'}`}>
                      {new Date(r.requiredDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-center font-mono">{r.totalOrdered}</td>
                    <td className="py-3 px-4 text-center font-mono text-emerald-400 font-bold">{r.totalCompleted}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* 6. Profitability Report */}
          {reportType === 'profitability' && (
            <table className="w-full min-w-[800px] text-left text-xs">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Job Ticket</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4 text-right">Revenue</th>
                  <th className="py-3 px-4 text-right">Blank Cost</th>
                  <th className="py-3 px-4 text-right">Ink Cost</th>
                  <th className="py-3 px-4 text-right">Labour / Overhead</th>
                  <th className="py-3 px-4 text-right font-bold text-white">Total Cost</th>
                  <th className="py-3 px-4 text-right font-bold text-emerald-400">Est. Profit</th>
                  <th className="py-3 px-4 text-right">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reportData?.records?.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">{r.jobNumber}</td>
                    <td className="py-3 px-4 text-white font-medium">{r.customerName}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">${r.revenue?.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300">${r.blankProductCost?.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300">${r.inkCost?.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-mono text-slate-300">${(r.labourCost + r.overheadCost)?.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-200">${r.totalCost?.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">${r.estimatedProfit?.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-cyan-400">{r.profitMarginPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
