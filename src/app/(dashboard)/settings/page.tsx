'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, DollarSign, Clock, Building, Shield } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({
    COMPANY_NAME: 'GOG Printing & Branding Ltd',
    HOURLY_LABOUR_RATE: '15.00',
    DEFAULT_OVERHEAD_PERCENT: '12.5',
    CURRENCY: 'RWF',
  });
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings');
      if (res.ok) {
        const d = await res.json();
        setSettings(d.settings || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const payload = Object.entries(settings).map(([key, value]) => ({
        key,
        value: String(value),
      }));

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: payload }),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System Configuration</h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure business legal parameters, hourly labour cost estimates, and overhead calculations
        </p>
      </div>

      {saved && (
        <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>System configuration updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
        <div>
          <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-2">
            <Building className="w-4 h-4 text-cyan-400" />
            <span>Company / Brand Legal Name</span>
          </label>
          <input
            type="text"
            value={settings.COMPANY_NAME || ''}
            onChange={(e) => setSettings({ ...settings, COMPANY_NAME: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Standard Labour Hourly Rate ($)</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={settings.HOURLY_LABOUR_RATE || '15.00'}
              onChange={(e) => setSettings({ ...settings, HOURLY_LABOUR_RATE: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Used in job profitability estimation models
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Default Overhead Cost Margin (%)</span>
            </label>
            <input
              type="number"
              step="0.1"
              value={settings.DEFAULT_OVERHEAD_PERCENT || '12.5'}
              onChange={(e) => setSettings({ ...settings, DEFAULT_OVERHEAD_PERCENT: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Factory power, rent & machine depreciation estimate
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-200 mb-1.5">
            Base Accounting Currency
          </label>
          <input
            type="text"
            value={settings.CURRENCY || 'RWF'}
            onChange={(e) => setSettings({ ...settings, CURRENCY: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono"
          />
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
