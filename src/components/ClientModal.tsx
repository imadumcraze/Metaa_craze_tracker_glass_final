import React, { useState, useEffect } from 'react';
import { Client, InitialPackageData } from '../types';
import { MONTH_NAMES } from '../lib/storage';
import {
  X,
  Building2,
  User,
  Phone,
  Mail,
  DollarSign,
  FileText,
  Calculator,
  Sparkles,
  Layers,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Client, packageData?: InitialPackageData) => void;
  onDelete?: (clientId: string) => void;
  clientToEdit?: Client | null;
  existingClientsCount: number;
  currentMonth: number;
  currentYear: number;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  clientToEdit,
  existingClientsCount,
  currentMonth,
  currentYear
}) => {
  const [formData, setFormData] = useState<Partial<Client>>({
    clientId: '',
    name: '',
    companyName: '',
    contactPerson: '',
    contactNumber: '',
    email: '',
    monthlyPackageFee: '',
    status: 'Active',
    notes: '',
    defaultGraphicPostQty: 5,
    defaultVideoQty: 5,
    defaultSpecialDayPostQty: 1,
    defaultCoverPhotoQty: 1,
    defaultOtherQty: 0
  });

  // Monthly content package creation options
  const [createInitialPackage, setCreateInitialPackage] = useState(true);
  const [autoGenerateItems, setAutoGenerateItems] = useState(true);
  const [packageMonth, setPackageMonth] = useState(currentMonth);
  const [packageYear, setPackageYear] = useState(currentYear);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Auto-calculated total deliverables
  const totalDeliverables =
    (Number(formData.defaultGraphicPostQty) || 0) +
    (Number(formData.defaultVideoQty) || 0) +
    (Number(formData.defaultSpecialDayPostQty) || 0) +
    (Number(formData.defaultCoverPhotoQty) || 0) +
    (Number(formData.defaultOtherQty) || 0);

  useEffect(() => {
    if (clientToEdit) {
      setFormData({
        ...clientToEdit,
        defaultGraphicPostQty: clientToEdit.defaultGraphicPostQty ?? 5,
        defaultVideoQty: clientToEdit.defaultVideoQty ?? 5,
        defaultSpecialDayPostQty: clientToEdit.defaultSpecialDayPostQty ?? 1,
        defaultCoverPhotoQty: clientToEdit.defaultCoverPhotoQty ?? 1,
        defaultOtherQty: clientToEdit.defaultOtherQty ?? 0
      });
      setCreateInitialPackage(false);
      setAutoGenerateItems(false);
    } else {
      const nextNum = existingClientsCount + 1;
      const formattedNum = nextNum < 10 ? `00${nextNum}` : nextNum < 100 ? `0${nextNum}` : `${nextNum}`;
      setFormData({
        clientId: `MC-CL-${formattedNum}`,
        name: '',
        companyName: '',
        contactPerson: '',
        contactNumber: '',
        email: '',
        monthlyPackageFee: '',
        status: 'Active',
        notes: '',
        defaultGraphicPostQty: 5,
        defaultVideoQty: 5,
        defaultSpecialDayPostQty: 1,
        defaultCoverPhotoQty: 1,
        defaultOtherQty: 0
      });
      setCreateInitialPackage(true);
      setAutoGenerateItems(true);
      setPackageMonth(currentMonth);
      setPackageYear(currentYear);
    }
    setErrors({});
    setShowDeleteConfirm(false);
  }, [clientToEdit, existingClientsCount, currentMonth, currentYear, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) newErrors.name = 'Client Name is required';
    if (!formData.companyName?.trim()) newErrors.companyName = 'Company / Business Name is required';
    if (!formData.contactPerson?.trim()) newErrors.contactPerson = 'Contact Person is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const client: Client = {
      id: clientToEdit?.id || `client-${Date.now()}`,
      clientId: formData.clientId || `MC-CL-${Date.now().toString().slice(-3)}`,
      name: formData.name!.trim(),
      companyName: formData.companyName!.trim(),
      contactPerson: formData.contactPerson!.trim(),
      contactNumber: formData.contactNumber?.trim() || '',
      email: formData.email?.trim() || '',
      monthlyPackageFee: formData.monthlyPackageFee?.trim() || '',
      status: formData.status || 'Active',
      notes: formData.notes?.trim() || '',
      createdAt: clientToEdit?.createdAt || new Date().toISOString(),
      defaultGraphicPostQty: Number(formData.defaultGraphicPostQty) || 0,
      defaultVideoQty: Number(formData.defaultVideoQty) || 0,
      defaultSpecialDayPostQty: Number(formData.defaultSpecialDayPostQty) || 0,
      defaultCoverPhotoQty: Number(formData.defaultCoverPhotoQty) || 0,
      defaultOtherQty: Number(formData.defaultOtherQty) || 0
    };

    let packageData: InitialPackageData | undefined;
    if (createInitialPackage && totalDeliverables > 0) {
      packageData = {
        createPackageNow: true,
        month: packageMonth,
        year: packageYear,
        graphicPostQty: Number(formData.defaultGraphicPostQty) || 0,
        videoQty: Number(formData.defaultVideoQty) || 0,
        specialDayPostQty: Number(formData.defaultSpecialDayPostQty) || 0,
        coverPhotoQty: Number(formData.defaultCoverPhotoQty) || 0,
        otherQty: Number(formData.defaultOtherQty) || 0,
        autoGenerateContent: autoGenerateItems
      };
    }

    onSave(client, packageData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80 sticky top-0 z-10">
          <div>
            <h2 className="text-lg font-bold text-white">
              {clientToEdit ? 'Edit Client Profile' : 'Add New Client'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Client profile & monthly content deliverables scope for Metaa Craze Productions
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Section: Client Identification */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 pb-1 border-b border-slate-800">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Client & Business Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Client ID
                </label>
                <input
                  type="text"
                  value={formData.clientId || ''}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-amber-400 font-mono focus:outline-none focus:border-amber-500"
                  placeholder="MC-CL-001"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Client Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Active">Active (Displays in dashboard)</option>
                  <option value="Inactive">Inactive (Paused / Archived)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Client Brand Name *
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full bg-slate-800/80 border ${errors.name ? 'border-red-500' : 'border-slate-700'} rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500`}
                  placeholder="e.g. Apex Apparel"
                />
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Company / Legal Business Name *
                </label>
                <input
                  type="text"
                  value={formData.companyName || ''}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className={`w-full bg-slate-800/80 border ${errors.companyName ? 'border-red-500' : 'border-slate-700'} rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500`}
                  placeholder="Apex Apparel Holdings (Pvt) Ltd"
                />
                {errors.companyName && <p className="text-red-400 text-xs mt-1">{errors.companyName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Contact Person *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={formData.contactPerson || ''}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className={`w-full bg-slate-800/80 border ${errors.contactPerson ? 'border-red-500' : 'border-slate-700'} rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500`}
                    placeholder="Dinesh Perera"
                  />
                </div>
                {errors.contactPerson && <p className="text-red-400 text-xs mt-1">{errors.contactPerson}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Contact Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={formData.contactNumber || ''}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    placeholder="+94 77 123 4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    placeholder="client@apex.lk"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Monthly Package Fee / Retainer
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={formData.monthlyPackageFee || ''}
                  onChange={(e) => setFormData({ ...formData, monthlyPackageFee: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  placeholder="e.g. $750 / Month or LKR 125,000"
                />
              </div>
            </div>
          </div>

          {/* Section: Monthly Content Deliverables Scope */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-amber-500/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  <span>Monthly Content Deliverables We Will Create</span>
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Define the content deliverables quota for this client (e.g. 5 videos, 5 posts, 1 special day, 1 cover photo)
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-black text-amber-300 bg-amber-400/10 px-3 py-1.5 rounded-full border border-amber-400/30 shrink-0">
                <Calculator className="w-3.5 h-3.5" />
                <span>Total: {totalDeliverables} Deliverables</span>
              </div>
            </div>

            {/* Inputs Grid for Content Types */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Graphic Posts
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.defaultGraphicPostQty ?? 5}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultGraphicPostQty: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-center text-sm font-bold text-white focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500 block text-center mt-1">e.g. 5 posts</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Videos / Reels
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.defaultVideoQty ?? 5}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultVideoQty: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-center text-sm font-bold text-white focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500 block text-center mt-1">e.g. 5 videos</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Special Day Post
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.defaultSpecialDayPostQty ?? 1}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultSpecialDayPostQty: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-center text-sm font-bold text-white focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500 block text-center mt-1">e.g. 1 Poya/holiday</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Cover Photo
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  value={formData.defaultCoverPhotoQty ?? 1}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultCoverPhotoQty: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-center text-sm font-bold text-white focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500 block text-center mt-1">e.g. 1 banner</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Other Content
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.defaultOtherQty ?? 0}
                  onChange={(e) =>
                    setFormData({ ...formData, defaultOtherQty: Math.max(0, parseInt(e.target.value) || 0) })
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-2 text-center text-sm font-bold text-white focus:outline-none focus:border-amber-500"
                />
                <span className="text-[10px] text-slate-500 block text-center mt-1">Custom scope</span>
              </div>
            </div>

            {/* Checkbox Options for Package & Content Generation */}
            {!clientToEdit && (
              <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="createInitialPackage"
                    checked={createInitialPackage}
                    onChange={(e) => setCreateInitialPackage(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-700 focus:ring-amber-400"
                  />
                  <label htmlFor="createInitialPackage" className="text-xs text-slate-200 cursor-pointer flex items-center gap-1.5">
                    <span>
                      Create initial Monthly Package for:
                    </span>
                    <select
                      value={packageMonth}
                      onChange={(e) => setPackageMonth(Number(e.target.value))}
                      disabled={!createInitialPackage}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-amber-400 font-bold focus:outline-none disabled:opacity-50"
                    >
                      {MONTH_NAMES.map((m, idx) => (
                        <option key={m} value={idx + 1}>{m}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={packageYear}
                      onChange={(e) => setPackageYear(Number(e.target.value))}
                      disabled={!createInitialPackage}
                      className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white font-bold text-center focus:outline-none disabled:opacity-50"
                    />
                  </label>
                </div>

                {createInitialPackage && (
                  <div className="flex items-center gap-2.5 pl-6">
                    <input
                      type="checkbox"
                      id="autoGenerateItems"
                      checked={autoGenerateItems}
                      onChange={(e) => setAutoGenerateItems(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 bg-slate-800 border-slate-700 focus:ring-amber-400"
                    />
                    <label htmlFor="autoGenerateItems" className="text-xs text-amber-300 cursor-pointer flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>
                        Auto-generate <strong>{totalDeliverables} content items</strong> (Graphic Post 01..N, Video 01..N, etc.) in "Not Started" status.
                      </span>
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section: Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Brand Guidelines & Production Notes
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <textarea
                rows={2}
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                placeholder="Specific campaign guidelines, preferred hashtags, tone of voice, visual aesthetics..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
            {clientToEdit && onDelete ? (
              showDeleteConfirm ? (
                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-red-500/10 border border-red-500/30">
                  <span className="text-xs text-red-300 font-medium pl-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    <span>Delete client & deliverables?</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onDelete(clientToEdit.id);
                      onClose();
                    }}
                    className="px-2.5 py-1 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
                  >
                    Confirm Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-2 py-1 text-xs text-slate-400 hover:text-white rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/30 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Client</span>
                </button>
              )
            ) : (
              <div />
            )}

            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow-lg shadow-amber-400/20"
              >
                {clientToEdit ? 'Save Changes' : 'Create Client & Set Deliverables'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
