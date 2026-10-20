import React, { useState } from 'react';
import { Client, MonthlyPackage, ContentItem, TabType, UserRole } from '../types';
import { StatusBadge } from './StatusBadge';
import {
  Users,
  Plus,
  Search,
  Building2,
  User,
  Phone,
  Mail,
  Banknote,
  Edit2,
  Power,
  ChevronRight,
  FileSpreadsheet,
  Package,
  Calendar,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';

interface ClientsViewProps {
  clients: Client[];
  packages: MonthlyPackage[];
  contentItems: ContentItem[];
  selectedMonth: number;
  selectedYear: number;
  currentRole: UserRole;
  onAddClient: () => void;
  onEditClient: (client: Client) => void;
  onDeleteClient?: (clientId: string) => void;
  onToggleClientStatus: (clientId: string) => void;
  onNavigateTab: (tab: TabType, clientIdFilter?: string) => void;
  onOpenReportForClient: (clientId: string) => void;
  onLaunchClientPortal?: (clientId: string) => void;
}

export const ClientsView: React.FC<ClientsViewProps> = ({
  clients,
  packages,
  contentItems,
  selectedMonth,
  selectedYear,
  currentRole,
  onAddClient,
  onEditClient,
  onDeleteClient,
  onToggleClientStatus,
  onNavigateTab,
  onOpenReportForClient,
  onLaunchClientPortal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Inactive'>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  const handleCopyLink = (client: Client) => {
    const url = new URL(window.location.href);
    url.searchParams.set('role', 'client');
    url.searchParams.set('client', client.id);
    navigator.clipboard.writeText(url.toString());
    setCopiedId(client.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const filteredClients = clients.filter(c => {
    const matchesStatus = statusFilter === 'All' ? true : c.status === statusFilter;
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.companyName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.clientId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.contactPerson || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-400" />
            <span>Client Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Manage your client directory, monthly retainers, and production scopes
          </p>
        </div>

        {currentRole === 'admin' && (
          <button
            onClick={onAddClient}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all shadow-lg shadow-amber-400/20 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add New Client</span>
          </button>
        )}
      </div>

      {/* Filters and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-slate-900 p-3 rounded-2xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by client name, company, ID, or contact person..."
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {(['All', 'Active', 'Inactive'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                statusFilter === filter
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {filter}
              <span className="ml-1 opacity-70">
                ({filter === 'All' ? clients.length : clients.filter(c => c.status === filter).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Clients Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-500">
            No clients match your filter.
          </div>
        ) : (
          filteredClients.map((client) => {
            // Find current month package
            const pkg = packages.find(
              p => p.clientId === client.id && p.month === selectedMonth && p.year === selectedYear
            );

            // Month items count
            const clientMonthItems = contentItems.filter(
              i => i.clientId === client.id && i.month === selectedMonth && i.year === selectedYear
            );
            const pubCount = clientMonthItems.filter(i => i.status === 'Published').length;
            const totalCount = pkg ? pkg.totalDeliverables : clientMonthItems.length;

            return (
              <div
                key={client.id}
                className="group relative bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar with ID & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                      {client.clientId}
                    </span>
                    {currentRole === 'admin' ? (
                      <button
                        onClick={() => onToggleClientStatus(client.id)}
                        title={`Click to ${client.status === 'Active' ? 'deactivate' : 'activate'}`}
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border transition-all ${
                          client.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-slate-700/30 text-slate-400 border-slate-700 hover:bg-slate-700/50'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        <span>{client.status}</span>
                      </button>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          client.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : 'bg-slate-700/30 text-slate-400 border-slate-700'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        <span>{client.status}</span>
                      </span>
                    )}
                  </div>

                  {/* Client Titles */}
                  <h3 className="font-bold text-lg text-white group-hover:text-amber-400 transition-colors">
                    {client.name}
                  </h3>
                  {client.companyName && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{client.companyName}</span>
                  </div>
                  )}

                  {/* Contact Info */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2 text-xs">
                    {client.contactPerson && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>{client.contactPerson}</span>
                    </div>
                    )}
                    {client.contactNumber && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>{client.contactNumber}</span>
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-2 text-slate-400 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-amber-400 font-semibold">
                      <Banknote className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>{client.monthlyPackageFee || 'Fee not specified'}</span>
                    </div>
                  </div>

                  {/* Monthly Deliverables Status Mini-Card */}
                  <div className="mt-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Selected Month</span>
                      <span className="text-white font-bold">
                        {pubCount} / {totalCount} Published
                      </span>
                    </div>
                    {pkg ? (
                      <p className="text-[11px] text-amber-300 font-medium">
                        Active Package: {pkg.graphicPostQty} Posts, {pkg.videoQty} Videos, {pkg.specialDayPostQty} Special Day, {pkg.coverPhotoQty} Cover
                      </p>
                    ) : client.defaultGraphicPostQty !== undefined || client.defaultVideoQty !== undefined ? (
                      <p className="text-[11px] text-slate-400">
                        Agreed Scope: {client.defaultGraphicPostQty || 0} Posts, {client.defaultVideoQty || 0} Videos, {client.defaultSpecialDayPostQty || 0} Special Day, {client.defaultCoverPhotoQty || 0} Cover
                      </p>
                    ) : null}
                  </div>

                  {client.notes && (
                    <p className="text-xs text-slate-500 mt-3 line-clamp-2 italic">
                      "{client.notes}"
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {currentRole === 'admin' && (
                      <>
                        <button
                          onClick={() => onEditClient(client)}
                          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors text-xs flex items-center gap-1.5"
                          title="Edit Client"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        {onDeleteClient && (
                          <button
                            onClick={() => setClientToDelete(client)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-xs flex items-center gap-1.5"
                            title={`Delete ${client.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        )}
                      </>
                    )}

                    {/* Copy Portal Link Button */}
                    <button
                      onClick={() => handleCopyLink(client)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                        copiedId === client.id
                          ? 'bg-emerald-500 text-slate-950 font-bold'
                          : 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20'
                      }`}
                      title={`Copy unique access link for ${client.name} portal`}
                    >
                      <span>{copiedId === client.id ? 'Copied Link!' : 'Portal Link'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentRole === 'admin' && onLaunchClientPortal && (
                      <button
                        onClick={() => onLaunchClientPortal(client.id)}
                        className="px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-colors"
                        title="Switch to this client's portal view"
                      >
                        Preview Portal
                      </button>
                    )}
                    <button
                      onClick={() => onOpenReportForClient(client.id)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/20 rounded-xl transition-colors flex items-center gap-1"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Report</span>
                    </button>
                    <button
                      onClick={() => onNavigateTab('tracker', client.id)}
                      className="px-2.5 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors flex items-center gap-1"
                    >
                      <span>Content</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete Client Confirmation Modal */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setClientToDelete(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 shrink-0">
                <AlertTriangle className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete Client Account</h3>
                <p className="text-xs text-slate-400">This action is permanent and cannot be undone</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 mb-5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Client:</span>
                <span className="font-bold text-white">{clientToDelete.name}</span>
              </div>
              {clientToDelete.companyName && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Company:</span>
                  <span className="text-slate-200">{clientToDelete.companyName}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Client ID:</span>
                <span className="font-mono text-amber-400">{clientToDelete.clientId}</span>
              </div>
              <div className="pt-2 border-t border-slate-800/80 text-[11px] text-red-300/90 leading-relaxed">
                Deleting this client will also delete all <strong>associated monthly packages</strong> and <strong>scheduled/published deliverables</strong> in the content tracker.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteClient && clientToDelete) {
                    onDeleteClient(clientToDelete.id);
                    setClientToDelete(null);
                  }
                }}
                className="px-4 py-2 text-xs sm:text-sm font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl transition-colors shadow-lg shadow-red-600/30 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Client</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
