import React, { useState, useEffect } from 'react';
import {
  Client,
  MonthlyPackage,
  ContentItem,
  TabType,
  ContentStatus,
  ContentType,
  InitialPackageData,
  UserRole
} from './types';
import {
  getStoredClients,
  saveClients,
  getStoredPackages,
  savePackages,
  getStoredContent,
  saveContent,
  resetToInitialData,
  formatDisplayNumber,
  isContentOverdue,
  getStoredAccessSession,
  saveAccessSession,
  getStoredAdminPasscode,
  DEFAULT_ADMIN_PASSCODE
} from './lib/storage';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { ClientsView } from './components/ClientsView';
import { PackagesView } from './components/PackagesView';
import { ContentTrackerView } from './components/ContentTrackerView';
import { CalendarView } from './components/CalendarView';
import { ReportsView } from './components/ReportsView';
import { ClientPortalView } from './components/ClientPortalView';
import { AccessModal } from './components/AccessModal';
import { ClientModal } from './components/ClientModal';
import { PackageModal } from './components/PackageModal';
import { ContentItemModal } from './components/ContentItemModal';

export default function App() {
  // Primary State
  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<MonthlyPackage[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);

  // Access Category State (3 Categories: 'admin' | 'viewer' | 'client')
  const [userRole, setUserRole] = useState<UserRole>('admin');
  const [clientAccessId, setClientAccessId] = useState<string | undefined>(undefined);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState<boolean>(false);

  // Month & Year Filter (defaults to October 2026 for production view)
  const [selectedMonth, setSelectedMonth] = useState<number>(10);
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Drilldown filter passed between views (e.g. from Dashboard to Tracker or Reports)
  const [drilldownClientId, setDrilldownClientId] = useState<string>('');

  // Modals state
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [clientToEdit, setClientToEdit] = useState<Client | null>(null);

  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [packageToEdit, setPackageToEdit] = useState<MonthlyPackage | null>(null);

  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [contentToEdit, setContentToEdit] = useState<ContentItem | null>(null);
  const [contentModalDefaultClientId, setContentModalDefaultClientId] = useState<string | undefined>();
  const [contentModalDefaultPlannedDate, setContentModalDefaultPlannedDate] = useState<string | undefined>();

  // Toast / notification feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Load initial data and access session
  useEffect(() => {
    const loadedClients = getStoredClients();
    setClients(loadedClients);
    setPackages(getStoredPackages());
    setContentItems(getStoredContent());

    // Check URL parameters for direct client portal access or admin/viewer links
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role') as UserRole;
    const clientParam = params.get('client');
    const keyParam = params.get('key');

    if (roleParam === 'admin') {
      const currentCode = getStoredAdminPasscode();
      if (!keyParam || keyParam === currentCode || keyParam === DEFAULT_ADMIN_PASSCODE) {
        setUserRole('admin');
        setClientAccessId(undefined);
        saveAccessSession({ role: 'admin' });
      }
    } else if (roleParam === 'client' && clientParam) {
      setUserRole('client');
      setClientAccessId(clientParam);
      saveAccessSession({ role: 'client', clientId: clientParam });
    } else if (roleParam === 'viewer') {
      setUserRole('viewer');
      saveAccessSession({ role: 'viewer' });
    } else {
      const savedSession = getStoredAccessSession();
      setUserRole(savedSession.role || 'admin');
      setClientAccessId(savedSession.clientId);
    }
  }, []);

  // Save changes to storage
  const updateClients = (newClients: Client[]) => {
    setClients(newClients);
    saveClients(newClients);
  };

  const updatePackages = (newPackages: MonthlyPackage[]) => {
    setPackages(newPackages);
    savePackages(newPackages);
  };

  const updateContentItems = (newItems: ContentItem[]) => {
    setContentItems(newItems);
    saveContent(newItems);
  };

  // Handle switching between the 3 access roles
  const handleSelectRole = (newRole: UserRole, targetClientId?: string) => {
    setUserRole(newRole);
    setClientAccessId(targetClientId);
    saveAccessSession({ role: newRole, clientId: targetClientId });

    // Update URL without full page reload
    const url = new URL(window.location.href);
    if (newRole === 'client' && targetClientId) {
      url.searchParams.set('role', 'client');
      url.searchParams.set('client', targetClientId);
      const c = clients.find(cl => cl.id === targetClientId);
      showToast(`Switched to Client Access for ${c?.name || 'Client'}.`);
    } else if (newRole === 'viewer') {
      url.searchParams.set('role', 'viewer');
      url.searchParams.delete('client');
      showToast('Switched to Viewers Access (Read-Only).');
    } else {
      url.searchParams.delete('role');
      url.searchParams.delete('client');
      showToast('Switched to Admin Access (Management).');
    }
    window.history.replaceState({}, '', url.toString());
  };

  // Month Navigator handler
  const handleMonthChange = (month: number, year: number) => {
    setSelectedMonth(month);
    setSelectedYear(year);
  };

  // Reset to initial sample data
  const handleResetData = () => {
    if (window.confirm('Reset all data to sample Metaa Craze client campaigns?')) {
      resetToInitialData();
      setClients(getStoredClients());
      setPackages(getStoredPackages());
      setContentItems(getStoredContent());
      showToast('Data reset to default sample records.');
    }
  };

  // Tab navigation from cards
  const handleNavigateTab = (tab: TabType, clientIdFilter?: string) => {
    if (clientIdFilter) {
      setDrilldownClientId(clientIdFilter);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Quick report open
  const handleOpenReportForClient = (clientId: string) => {
    setDrilldownClientId(clientId);
    setActiveTab('reports');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Client Handlers
  const handleSaveClient = (client: Client, packageData?: InitialPackageData) => {
    const exists = clients.some(c => c.id === client.id);
    let updatedClients: Client[];
    if (exists) {
      updatedClients = clients.map(c => (c.id === client.id ? client : c));
      showToast(`Client "${client.name}" updated successfully.`);
    } else {
      updatedClients = [client, ...clients];
      showToast(`Client "${client.name}" created successfully.`);
    }
    updateClients(updatedClients);

    // If initial package data was provided when adding client:
    if (packageData && packageData.createPackageNow) {
      const totalDeliverables =
        packageData.graphicPostQty +
        packageData.videoQty +
        packageData.specialDayPostQty +
        packageData.coverPhotoQty +
        packageData.otherQty;

      if (totalDeliverables > 0) {
        const randCode = Math.floor(100 + Math.random() * 900);
        const pkgId = `pkg-${packageData.year}-${packageData.month}-${client.id}`;
        const newPkg: MonthlyPackage = {
          id: pkgId,
          packageId: `PKG-${packageData.year}${packageData.month < 10 ? '0' + packageData.month : packageData.month}-${randCode}`,
          clientId: client.id,
          month: packageData.month,
          year: packageData.year,
          graphicPostQty: packageData.graphicPostQty,
          videoQty: packageData.videoQty,
          specialDayPostQty: packageData.specialDayPostQty,
          coverPhotoQty: packageData.coverPhotoQty,
          otherQty: packageData.otherQty,
          totalDeliverables,
          status: 'Active',
          notes: `Standard deliverables package for ${client.name}`,
          createdAt: new Date().toISOString()
        };

        const existingPkgIndex = packages.findIndex(
          p => p.clientId === client.id && p.month === packageData.month && p.year === packageData.year
        );
        let updatedPackages: MonthlyPackage[];
        if (existingPkgIndex >= 0) {
          updatedPackages = packages.map((p, idx) => (idx === existingPkgIndex ? newPkg : p));
        } else {
          updatedPackages = [newPkg, ...packages];
        }
        updatePackages(updatedPackages);

        // Auto-generate content items if requested
        if (packageData.autoGenerateContent) {
          const newItems: ContentItem[] = [];
          const clientPrefix = client.name;

          const createItems = (type: ContentType, count: number) => {
            for (let i = 1; i <= count; i++) {
              const rand = Math.floor(100 + Math.random() * 900);
              newItems.push({
                id: `cnt-${packageData.year}${packageData.month}-${client.id}-${type.replace(/\s+/g, '')}-${i}-${Date.now()}-${rand}`,
                contentId: `CNT-${packageData.year}${packageData.month < 10 ? '0' + packageData.month : packageData.month}-${rand}`,
                clientId: client.id,
                packageId: newPkg.id,
                month: packageData.month,
                year: packageData.year,
                contentType: type,
                contentNumber: i,
                displayNumber: formatDisplayNumber(type, i),
                title: `${clientPrefix} ${type} ${i < 10 ? '0' + i : i}`,
                plannedDate: '',
                actualPublishedDate: '',
                status: 'Not Started',
                postUrl: '',
                remarks: `Initial deliverable from ${client.name} package`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              });
            }
          };

          createItems('Graphic Post', packageData.graphicPostQty);
          createItems('Video', packageData.videoQty);
          createItems('Special Day Post', packageData.specialDayPostQty);
          createItems('Cover Photo', packageData.coverPhotoQty);
          createItems('Other', packageData.otherQty);

          if (newItems.length > 0) {
            updateContentItems([...contentItems, ...newItems]);
            showToast(`Created ${client.name} with ${totalDeliverables} deliverables in content tracker!`);
          }
        }
      }
    }
  };

  const handleToggleClientStatus = (clientId: string) => {
    if (userRole !== 'admin') return;
    const updated = clients.map(c => {
      if (c.id === clientId) {
        const nextStatus = c.status === 'Active' ? 'Inactive' : 'Active';
        showToast(`${c.name} is now ${nextStatus}.`);
        return { ...c, status: nextStatus as 'Active' | 'Inactive' };
      }
      return c;
    });
    updateClients(updated);
  };

  const handleDeleteClient = (clientId: string) => {
    if (userRole !== 'admin') return;
    const client = clients.find(c => c.id === clientId);
    const clientName = client?.name || 'Client';

    const updatedClients = clients.filter(c => c.id !== clientId);
    const updatedPackages = packages.filter(p => p.clientId !== clientId);
    const updatedContent = contentItems.filter(i => i.clientId !== clientId);

    updateClients(updatedClients);
    updatePackages(updatedPackages);
    updateContentItems(updatedContent);

    if (drilldownClientId === clientId) {
      setDrilldownClientId('');
    }
    if (clientAccessId === clientId) {
      setClientAccessId(undefined);
      setUserRole('admin');
    }

    showToast(`Client "${clientName}" and all associated deliverables have been deleted.`);
  };

  // Package Handlers
  const handleSavePackage = (pkg: MonthlyPackage, autoGenerateItems: boolean) => {
    if (userRole !== 'admin') return;
    const exists = packages.some(p => p.id === pkg.id);
    let updatedPackages: MonthlyPackage[];
    if (exists) {
      updatedPackages = packages.map(p => (p.id === pkg.id ? pkg : p));
      showToast(`Package ${pkg.packageId} updated.`);
    } else {
      updatedPackages = [pkg, ...packages];
      showToast(`Package ${pkg.packageId} created with ${pkg.totalDeliverables} deliverables.`);
    }
    updatePackages(updatedPackages);

    if (autoGenerateItems) {
      generateContentItemsForPackage(pkg);
    }
  };

  const generateContentItemsForPackage = (pkg: MonthlyPackage) => {
    if (userRole !== 'admin') return;
    const newItems: ContentItem[] = [];
    const client = clients.find(c => c.id === pkg.clientId);
    const clientPrefix = client ? client.name : 'Content';

    const createNumberedItems = (type: ContentType, count: number) => {
      const existing = contentItems.filter(
        i => i.clientId === pkg.clientId && i.month === pkg.month && i.year === pkg.year && i.contentType === type
      );
      const existingCount = existing.length;

      for (let i = 1; i <= count; i++) {
        const num = existingCount + i;
        const rand = Math.floor(100 + Math.random() * 900);
        newItems.push({
          id: `cnt-${pkg.year}${pkg.month}-${pkg.clientId}-${type.replace(/\s+/g, '')}-${num}-${Date.now()}-${rand}`,
          contentId: `CNT-${pkg.year}${pkg.month < 10 ? '0' + pkg.month : pkg.month}-${rand}`,
          clientId: pkg.clientId,
          packageId: pkg.id,
          month: pkg.month,
          year: pkg.year,
          contentType: type,
          contentNumber: num,
          displayNumber: formatDisplayNumber(type, num),
          title: `${clientPrefix} ${type} ${num < 10 ? '0' + num : num}`,
          plannedDate: '',
          actualPublishedDate: '',
          status: 'Not Started',
          postUrl: '',
          remarks: `Generated from package ${pkg.packageId}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    };

    const existingGraphic = contentItems.filter(
      i => i.clientId === pkg.clientId && i.month === pkg.month && i.year === pkg.year && i.contentType === 'Graphic Post'
    ).length;
    createNumberedItems('Graphic Post', Math.max(0, pkg.graphicPostQty - existingGraphic));

    const existingVideo = contentItems.filter(
      i => i.clientId === pkg.clientId && i.month === pkg.month && i.year === pkg.year && i.contentType === 'Video'
    ).length;
    createNumberedItems('Video', Math.max(0, pkg.videoQty - existingVideo));

    const existingSpecial = contentItems.filter(
      i => i.clientId === pkg.clientId && i.month === pkg.month && i.year === pkg.year && i.contentType === 'Special Day Post'
    ).length;
    createNumberedItems('Special Day Post', Math.max(0, pkg.specialDayPostQty - existingSpecial));

    const existingCover = contentItems.filter(
      i => i.clientId === pkg.clientId && i.month === pkg.month && i.year === pkg.year && i.contentType === 'Cover Photo'
    ).length;
    createNumberedItems('Cover Photo', Math.max(0, pkg.coverPhotoQty - existingCover));

    const existingOther = contentItems.filter(
      i => i.clientId === pkg.clientId && i.month === pkg.month && i.year === pkg.year && i.contentType === 'Other'
    ).length;
    createNumberedItems('Other', Math.max(0, pkg.otherQty - existingOther));

    if (newItems.length > 0) {
      updateContentItems([...contentItems, ...newItems]);
      showToast(`Generated ${newItems.length} numbered content items for ${client?.name || 'client'}.`);
    } else {
      showToast('All deliverables for this package already have records in the tracker.');
    }
  };

  // Content Item Handlers
  const handleSaveContentItem = (item: ContentItem) => {
    if (userRole !== 'admin') return;
    const exists = contentItems.some(i => i.id === item.id);
    let updated: ContentItem[];
    if (exists) {
      updated = contentItems.map(i => (i.id === item.id ? item : i));
      showToast(`Updated ${item.displayNumber}.`);
    } else {
      updated = [item, ...contentItems];
      showToast(`Created ${item.displayNumber}.`);
    }
    updateContentItems(updated);
  };

  const handleDeleteContentItem = (itemId: string) => {
    if (userRole !== 'admin') return;
    const target = contentItems.find(i => i.id === itemId);
    const updated = contentItems.filter(i => i.id !== itemId);
    updateContentItems(updated);
    showToast(`Deleted ${target?.displayNumber || 'item'}.`);
  };

  const handleUpdateItemStatus = (itemId: string, newStatus: ContentStatus, actualPublishedDate?: string) => {
    if (userRole !== 'admin') return;
    const updated = contentItems.map(i => {
      if (i.id === itemId) {
        return {
          ...i,
          status: newStatus,
          actualPublishedDate: newStatus === 'Published' ? (actualPublishedDate || i.actualPublishedDate || new Date().toISOString().split('T')[0]) : i.actualPublishedDate,
          updatedAt: new Date().toISOString()
        };
      }
      return i;
    });
    updateContentItems(updated);
    showToast(`Status updated to "${newStatus}".`);
  };

  const handleUpdatePostUrl = (itemId: string, newUrl: string) => {
    if (userRole !== 'admin') return;
    const updated = contentItems.map(i => {
      if (i.id === itemId) {
        return {
          ...i,
          postUrl: newUrl,
          updatedAt: new Date().toISOString()
        };
      }
      return i;
    });
    updateContentItems(updated);
    showToast('Post URL updated.');
  };

  // Open Add Content Modal with options
  const handleOpenAddContent = (defaultClientId?: string, plannedDate?: string) => {
    if (userRole !== 'admin') return;
    setContentToEdit(null);
    setContentModalDefaultClientId(defaultClientId || drilldownClientId || undefined);
    setContentModalDefaultPlannedDate(plannedDate);
    setIsContentModalOpen(true);
  };

  // Active client when in client role
  const clientTarget = userRole === 'client'
    ? clients.find(c => c.id === clientAccessId) || clients[0]
    : undefined;

  // Filtered views based on client mode isolation
  const visibleClients = userRole === 'client' && clientTarget
    ? [clientTarget]
    : clients;

  const visiblePackages = userRole === 'client' && clientTarget
    ? packages.filter(p => p.clientId === clientTarget.id)
    : packages;

  const visibleContentItems = userRole === 'client' && clientTarget
    ? contentItems.filter(i => i.clientId === clientTarget.id)
    : contentItems;

  // Metric counts for navigation badges
  const activeClients = visibleClients.filter(c => c.status === 'Active');
  const monthPackages = visiblePackages.filter(
    p => p.month === selectedMonth && p.year === selectedYear
  );
  const totalDeliverablesCount = monthPackages.reduce((acc, p) => acc + p.totalDeliverables, 0);

  const monthItems = visibleContentItems.filter(
    i => i.month === selectedMonth && i.year === selectedYear
  );
  const overdueCount = monthItems.filter(i => isContentOverdue(i)).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Top Header */}
      <Header
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        currentRole={userRole}
        activeClientName={clientTarget?.name}
        onMonthChange={handleMonthChange}
        onOpenNewContentModal={() => handleOpenAddContent()}
        onOpenAccessModal={() => setIsAccessModalOpen(true)}
        onResetData={handleResetData}
      />

      {/* Main Navigation Tabs */}
      <Navigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        activeClientsCount={activeClients.length}
        totalDeliverablesCount={totalDeliverablesCount}
        overdueCount={overdueCount}
        currentRole={userRole}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* If in Client Mode and on dashboard tab, render dedicated ClientPortalView */}
        {userRole === 'client' && clientTarget && activeTab === 'dashboard' ? (
          <ClientPortalView
            client={clientTarget}
            packages={packages}
            contentItems={contentItems}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={handleMonthChange}
            onOpenReport={() => setActiveTab('reports')}
            onExitClientMode={() => handleSelectRole('admin')}
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                clients={visibleClients}
                packages={visiblePackages}
                contentItems={visibleContentItems}
                onNavigateTab={handleNavigateTab}
                onOpenReportForClient={handleOpenReportForClient}
              />
            )}

            {activeTab === 'clients' && userRole !== 'client' && (
              <ClientsView
                clients={clients}
                packages={packages}
                contentItems={contentItems}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                currentRole={userRole}
                onAddClient={() => {
                  setClientToEdit(null);
                  setIsClientModalOpen(true);
                }}
                onEditClient={(client) => {
                  setClientToEdit(client);
                  setIsClientModalOpen(true);
                }}
                onDeleteClient={handleDeleteClient}
                onToggleClientStatus={handleToggleClientStatus}
                onNavigateTab={handleNavigateTab}
                onOpenReportForClient={handleOpenReportForClient}
                onLaunchClientPortal={(cId) => handleSelectRole('client', cId)}
              />
            )}

            {activeTab === 'packages' && userRole !== 'client' && (
              <PackagesView
                packages={packages}
                clients={clients}
                contentItems={contentItems}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                currentRole={userRole}
                onAddPackage={() => {
                  setPackageToEdit(null);
                  setIsPackageModalOpen(true);
                }}
                onEditPackage={(pkg) => {
                  setPackageToEdit(pkg);
                  setIsPackageModalOpen(true);
                }}
                onGenerateContentForPackage={generateContentItemsForPackage}
                onNavigateTab={handleNavigateTab}
              />
            )}

            {activeTab === 'tracker' && (
              <ContentTrackerView
                contentItems={visibleContentItems}
                clients={visibleClients}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                initialClientFilter={userRole === 'client' && clientTarget ? clientTarget.id : drilldownClientId}
                currentRole={userRole}
                onAddItem={(cId) => handleOpenAddContent(cId)}
                onEditItem={(item) => {
                  setContentToEdit(item);
                  setIsContentModalOpen(true);
                }}
                onDeleteItem={handleDeleteContentItem}
                onUpdateItemStatus={handleUpdateItemStatus}
                onUpdatePostUrl={handleUpdatePostUrl}
              />
            )}

            {activeTab === 'calendar' && (
              <CalendarView
                contentItems={visibleContentItems}
                clients={visibleClients}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                currentRole={userRole}
                onSelectMonthYear={handleMonthChange}
                onEditItem={(item) => {
                  if (userRole === 'admin') {
                    setContentToEdit(item);
                    setIsContentModalOpen(true);
                  }
                }}
                onAddItemForDate={(dateStr, cId) => handleOpenAddContent(cId, dateStr)}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsView
                clients={visibleClients}
                packages={visiblePackages}
                contentItems={visibleContentItems}
                defaultClientId={userRole === 'client' && clientTarget ? clientTarget.id : drilldownClientId}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                currentRole={userRole}
                restrictedClientId={userRole === 'client' && clientTarget ? clientTarget.id : undefined}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="print:hidden border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">Metaa Craze Productions (Pvt) Ltd.</span>
            <span>•</span>
            <span>Social Media Content Tracker</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsAccessModalOpen(true)}
              className="text-amber-400 hover:underline font-semibold"
            >
              Access Categories ({userRole})
            </button>
            <span>•</span>
            <button
              onClick={handleResetData}
              className="text-slate-500 hover:text-amber-400 transition-colors"
            >
              Reset Sample Data
            </button>
          </div>
        </div>
      </footer>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-2xl text-xs sm:text-sm animate-bounce flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Access Control & Client Portal Modal */}
      <AccessModal
        isOpen={isAccessModalOpen}
        onClose={() => setIsAccessModalOpen(false)}
        currentRole={userRole}
        currentClientId={clientAccessId}
        clients={clients}
        onSelectRole={handleSelectRole}
      />

      {/* Modals */}
      <ClientModal
        isOpen={isClientModalOpen}
        onClose={() => setIsClientModalOpen(false)}
        onSave={handleSaveClient}
        onDelete={handleDeleteClient}
        clientToEdit={clientToEdit}
        existingClientsCount={clients.length}
        currentMonth={selectedMonth}
        currentYear={selectedYear}
      />

      <PackageModal
        isOpen={isPackageModalOpen}
        onClose={() => setIsPackageModalOpen(false)}
        onSave={handleSavePackage}
        packageToEdit={packageToEdit}
        clients={clients}
        defaultMonth={selectedMonth}
        defaultYear={selectedYear}
        existingPackages={packages}
      />

      <ContentItemModal
        isOpen={isContentModalOpen}
        onClose={() => setIsContentModalOpen(false)}
        onSave={handleSaveContentItem}
        itemToEdit={contentToEdit}
        clients={clients}
        packages={packages}
        defaultMonth={selectedMonth}
        defaultYear={selectedYear}
        defaultClientId={contentModalDefaultClientId}
        existingItems={contentItems}
      />
    </div>
  );
}
