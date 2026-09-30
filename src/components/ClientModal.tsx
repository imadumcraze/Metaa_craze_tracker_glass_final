import React, { useState, useEffect } from 'react';
import { Client, InitialPackageData } from '../types';
import {
  X,
  Building2,
  User,
  Phone,
  Mail,
  FileText,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (client: Client, packageData?: InitialPackageData) => void;
  onSaveAndSetDeliverables?: (client: Client) => void;
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
  onSaveAndSetDeliverables,
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
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (clientToEdit) {
      setFormData({
        ...clientToEdit
      });
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
        notes: ''
      });
    }
    setErrors({});
    setShowDeleteConfirm(false);
  }, [clientToEdit, existingClientsCount, currentMonth, currentYear, isOpen]);

  if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name?.trim()) newErrors.name = 'Client Name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildClient = (): Client => {
    return {
      ...(clientToEdit || {}),
      id: clientToEdit?.id || `client-${Date.now()}`,
      clientId: formData.clientId || `MC-CL-${Date.now().toString().slice(-3)}`,
      name: formData.name?.trim() || '',
      companyName: formData.companyName?.trim() || '',
      contactPerson: formData.contactPerson?.trim() || '',
      contactNumber: formData.contactNumber?.trim() || '',
      email: formData.email?.trim() || '',
      monthlyPackageFee: (() => {
        const fee = formData.monthlyPackageFee?.trim() || '';
        return fee && !/^(LKR|Rs\.?|\$)/i.test(fee) ? `LKR ${fee}` : fee;
      })(),
      status: formData.status || 'Active',
      notes: formData.notes?.trim() || '',
      createdAt: clientToEdit?.createdAt || new Date().toISOString()
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSave(buildClient());
    onClose();
  };

  const handleSetDeliverables = () => {
    if (!validate()) return;
    const client = buildClient();
    if (onSaveAndSetDeliverables) {
      onSaveAndSetDeliverables(client);
    } else {
      onSave(client);
    }
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
              Client profile & contact details for Metaa Craze Productions
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
                  Company / Legal Business Name
                </label>
                <input
                  type="text"
                  value={formData.companyName || ''}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  placeholder="Apex Apparel Holdings (Pvt) Ltd"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Contact Person
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={formData.contactPerson || ''}
                    onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                    className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                    placeholder="Dinesh Perera"
                  />
                </div>
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
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">LKR</span>
                <input
                  type="text"
                  value={(formData.monthlyPackageFee || '').replace(/^LKR\s*/i, '')}
                  onChange={(e) => setFormData({ ...formData, monthlyPackageFee: e.target.value })}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-12 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  placeholder="e.g. 125,000 / Month"
                />
              </div>
            </div>
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
              {clientToEdit ? (
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow-lg shadow-amber-400/20"
                >
                  Save Changes
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    className="px-5 py-2.5 text-sm font-semibold text-amber-400 bg-slate-800 hover:bg-slate-700 border border-amber-400/30 rounded-xl transition-colors"
                  >
                    Create Client
                  </button>
                  <button
                    type="button"
                    onClick={handleSetDeliverables}
                    className="px-5 py-2.5 text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors shadow-lg shadow-amber-400/20"
                  >
                    Set Deliverables
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
