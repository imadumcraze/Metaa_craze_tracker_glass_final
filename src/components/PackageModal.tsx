import React, { useState, useEffect } from 'react';
import { MonthlyPackage, Client } from '../types';
import { MONTH_NAMES } from '../lib/storage';
import { X, Calculator, Sparkles } from 'lucide-react';

interface PackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (pkg: MonthlyPackage, autoGenerateItems: boolean) => void;
  packageToEdit?: MonthlyPackage | null;
  clients: Client[];
  defaultMonth: number;
  defaultYear: number;
  existingPackages: MonthlyPackage[];
  defaultClientId?: string;
}

export const PackageModal: React.FC<PackageModalProps> = ({
  isOpen,
  onClose,
  onSave,
  packageToEdit,
  clients,
  defaultMonth,
  defaultYear,
  existingPackages,
  defaultClientId
}) => {
  const [clientId, setClientId] = useState('');
  const [packageId, setPackageId] = useState('');
  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);
  const [graphicPostQty, setGraphicPostQty] = useState(5);
  const [videoQty, setVideoQty] = useState(5);
  const [specialDayPostQty, setSpecialDayPostQty] = useState(1);
  const [coverPhotoQty, setCoverPhotoQty] = useState(1);
  const [otherQty, setOtherQty] = useState(0);
  const [status, setStatus] = useState<'Active' | 'Completed' | 'In Planning'>('Active');
  const [notes, setNotes] = useState('');
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [error, setError] = useState('');

  // Calculate total automatically
  const totalDeliverables =
    (Number(graphicPostQty) || 0) +
    (Number(videoQty) || 0) +
    (Number(specialDayPostQty) || 0) +
    (Number(coverPhotoQty) || 0) +
    (Number(otherQty) || 0);

  useEffect(() => {
    if (packageToEdit) {
      setClientId(packageToEdit.clientId);
      setPackageId(packageToEdit.packageId);
      setMonth(packageToEdit.month);
      setYear(packageToEdit.year);
      setGraphicPostQty(packageToEdit.graphicPostQty);
      setVideoQty(packageToEdit.videoQty);
      setSpecialDayPostQty(packageToEdit.specialDayPostQty);
      setCoverPhotoQty(packageToEdit.coverPhotoQty);
      setOtherQty(packageToEdit.otherQty);
      setStatus(packageToEdit.status);
      setNotes(packageToEdit.notes || '');
      setAutoGenerate(false); // don't auto generate when editing
    } else {
      const matchedClient = defaultClientId && clients.some(c => c.id === defaultClientId);
      const activeClients = clients.filter(c => c.status === 'Active');
      const defaultClient = matchedClient
        ? defaultClientId
        : (activeClients.length > 0 ? activeClients[0].id : '');
      setClientId(defaultClient);
      const randCode = Math.floor(100 + Math.random() * 900);
      setPackageId(`PKG-${defaultYear}${defaultMonth < 10 ? '0' + defaultMonth : defaultMonth}-${randCode}`);
      setMonth(defaultMonth);
      setYear(defaultYear);
      setGraphicPostQty(5);
      setVideoQty(5);
      setSpecialDayPostQty(1);
      setCoverPhotoQty(1);
      setOtherQty(0);
      setStatus('Active');
      setNotes('');
      setAutoGenerate(true);
    }
    setError('');
  }, [packageToEdit, clients, defaultMonth, defaultYear, isOpen, defaultClientId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      setError('Please select a client');
      return;
    }

    // Check duplicate
    const isDuplicate = existingPackages.some(
      p => p.clientId === clientId && p.month === month && p.year === year && p.id !== packageToEdit?.id
    );
    if (isDuplicate) {
      setError(`A monthly package for this client for ${MONTH_NAMES[month - 1]} ${year} already exists.`);
      return;
    }

    if (totalDeliverables === 0) {
      setError('A package must have at least 1 deliverable.');
      return;
    }

    const pkg: MonthlyPackage = {
      id: packageToEdit?.id || `pkg-${year}-${month}-${clientId}-${Date.now().toString().slice(-4)}`,
      packageId: packageId || `PKG-${year}${month < 10 ? '0' + month : month}-${Date.now().toString().slice(-3)}`,
      clientId,
      month,
      year,
      graphicPostQty: Number(graphicPostQty) || 0,
      videoQty: Number(videoQty) || 0,
      specialDayPostQty: Number(specialDayPostQty) || 0,
      coverPhotoQty: Number(coverPhotoQty) || 0,
      otherQty: Number(otherQty) || 0,
      totalDeliverables,
      status,
      notes: notes.trim(),
      createdAt: packageToEdit?.createdAt || new Date().toISOString()
    };

    onSave(pkg, autoGenerate && !packageToEdit);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div>
            <h2 className="text-lg font-bold text-white">
              {packageToEdit ? 'Edit Monthly Package' : 'Create Monthly Content Package'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Define the monthly deliverables scope for Metaa Craze client production
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Client *
              </label>
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                disabled={!!packageToEdit}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 disabled:opacity-60"
              >
                <option value="">Select a client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName ? `${c.name} (${c.companyName})` : c.name} {c.status === 'Inactive' ? '[Inactive]' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Package ID
              </label>
              <input
                type="text"
                value={packageId}
                onChange={(e) => setPackageId(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-amber-400 font-mono focus:outline-none focus:border-amber-500"
                placeholder="PKG-202610-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Month *
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                {MONTH_NAMES.map((mName, idx) => (
                  <option key={mName} value={idx + 1}>
                    {mName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Year *
              </label>
              <input
                type="number"
                min="2024"
                max="2035"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Package Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Active' | 'Completed' | 'In Planning')}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Active">Active</option>
                <option value="In Planning">In Planning</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Deliverables Quantities */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Monthly Content Deliverables Breakdown
              </span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                <Calculator className="w-3.5 h-3.5" />
                <span>Auto-Total: {totalDeliverables} items</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Graphic Posts
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={graphicPostQty}
                  onChange={(e) => setGraphicPostQty(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-center text-white focus:outline-none focus:border-amber-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Videos / Reels
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={videoQty}
                  onChange={(e) => setVideoQty(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-center text-white focus:outline-none focus:border-amber-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Special Day
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={specialDayPostQty}
                  onChange={(e) => setSpecialDayPostQty(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-center text-white focus:outline-none focus:border-amber-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Cover Photo
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={coverPhotoQty}
                  onChange={(e) => setCoverPhotoQty(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-center text-white focus:outline-none focus:border-amber-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Other Content
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={otherQty}
                  onChange={(e) => setOtherQty(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-sm text-center text-white focus:outline-none focus:border-amber-500 font-semibold"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Package Notes / Campaign Focus
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              placeholder="e.g. Festive promotion and product launch campaign..."
            />
          </div>

          {!packageToEdit && (
            <div className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <input
                type="checkbox"
                id="autoGen"
                checked={autoGenerate}
                onChange={(e) => setAutoGenerate(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-700 focus:ring-amber-400"
              />
              <label htmlFor="autoGen" className="text-xs text-amber-200 cursor-pointer flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  <strong>Auto-generate {totalDeliverables} content items</strong> with sequential numbers (Graphic Post 01..N, Video 01..N, etc.) in "Not Started" status.
                </span>
              </label>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow-lg shadow-amber-400/20"
            >
              {packageToEdit ? 'Update Package' : 'Save Package'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
