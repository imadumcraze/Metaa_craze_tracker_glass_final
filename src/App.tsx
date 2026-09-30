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
  initialClients,
  initialPackages,
  initialContent
} from './lib/storage';
import { isAdminEmail, IS_LOCAL_DEV } from './lib/adminConfig';
import { subscribeToAuthUser, googleSignIn } from './lib/firebaseAuth';
import {
  subscribeToClients,
  subscribeToPackages,
  subscribeToContent,
  saveClientToFirestore,
  deleteClientFromFirestore,
  savePackageToFirestore,
  deletePackageFromFirestore,
  saveContentItemToFirestore,
  saveContentItemsBatch,
  deleteContentItemFromFirestore,
  migrateLocalDataToFirestore,
  resetFirestoreData
} from './lib/firestoreService';
import { User } from 'firebase/auth';
import { Cloud, CloudOff, RefreshCw, AlertCircle } from 'lucide-react';
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

  // Firebase Auth & Cloud Firestore Sync State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState<'connected' | 'offline' | 'syncing' | 'error'>('offline');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isFirestoreLoading, setIsFirestoreLoading] = useState<boolean>(true);

  // Access Category State (3 Categories: 'admin' | 'viewer' | 'client')
  const [userRole, setUserRole] = useState<UserRole>(IS_LOCAL_DEV ? 'admin' : 'viewer');
  const [clientAccessId, setClientAccessId] = useState<string | undefined>(undefined);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState<boolean>(false);

  const isAuthorizedAdmin = IS_LOCAL_DEV || isAdminEmail(currentUser?.email);

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
  const [packageModalDefaultClientId, setPackageModalDefaultClientId] = useState<string | undefined>();

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

  // Load initial data, access session, and subscribe to Firebase Auth + Firestore
  useEffect(() => {
    // 1. Initial cached / offline load from localStorage
    const localClients = getStoredClients();
    const localPackages = getStoredPackages();
    const localContent = getStoredContent();
    setClients(localClients);
    setPackages(localPackages);
    setContentItems(localContent);

    // 2. Check URL parameters for direct client portal access or admin/viewer links
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role') as UserRole;
    const clientParam = params.get('client');

    if (roleParam === 'admin') {
      setUserRole(IS_LOCAL_DEV ? 'admin' : 'viewer');
      setClientAccessId(undefined);
    } else if (roleParam === 'client' && clientParam) {
      setUserRole('client');
      setClientAccessId(clientParam);
      saveAccessSession({ role: 'client', clientId: clientParam });
    } else if (roleParam === 'viewer') {
      setUserRole('viewer');
      saveAccessSession({ role: 'viewer' });
    } else {
      const savedSession = getStoredAccessSession();
      const restoredRole = savedSession.role === 'admin' ? undefined : savedSession.role;
      setUserRole(restoredRole || (IS_LOCAL_DEV ? 'admin' : 'viewer'));
      setClientAccessId(savedSession.clientId);
    }

    // 3. Subscribe to Firebase Auth and Cloud Firestore Realtime Updates
    let unsubClients: (() => void) | null = null;
    let unsubPackages: (() => void) | null = null;
    let unsubContent: (() => void) | null = null;

    const unsubAuth = subscribeToAuthUser(async (user) => {
      setCurrentUser(user);
      const urlRoleParam = new URLSearchParams(window.location.search).get('role');
      if (isAdminEmail(user?.email) && !urlRoleParam) {
        setUserRole('admin');
        setClientAccessId(undefined);
      } else {
        if (!IS_LOCAL_DEV) {
          setUserRole((prev) => (prev === 'admin' ? 'viewer' : prev));
        }
        if (user && !isAdminEmail(user.email)) {
          showToast(`Signed in as ${user.email}. This account is not an admin, so access is view-only.`);
        }
      }
      if (user) {
        setSyncStatus('syncing');
        setIsFirestoreLoading(true);
        setSyncError(null);

        try {
          // Perform one-time migration if needed
          const currentLocalClients = getStoredClients();
          const currentLocalPackages = getStoredPackages();
          const currentLocalContent = getStoredContent();

          const migResult = await migrateLocalDataToFirestore(
            currentLocalClients,
            currentLocalPackages,
            currentLocalContent
          );
          if (migResult.migrated) {
            showToast(`Migrated ${migResult.clientCount} clients & deliverables to Cloud Firestore!`);
          }

          // Realtime listeners
          unsubClients = subscribeToClients(
            (remoteClients) => {
              setClients(remoteClients);
              saveClients(remoteClients);
              setIsFirestoreLoading(false);
              setSyncStatus('connected');
            },
            (err) => {
              console.error('Clients Firestore error:', err);
              setSyncStatus('error');
              setSyncError('Firestore permission or network error reading clients.');
              setIsFirestoreLoading(false);
            }
          );

          unsubPackages = subscribeToPackages(
            (remotePackages) => {
              setPackages(remotePackages);
              savePackages(remotePackages);
              setIsFirestoreLoading(false);
              setSyncStatus('connected');
            },
            (err) => {
              console.error('Packages Firestore error:', err);
              setSyncStatus('error');
              setSyncError('Firestore permission or network error reading packages.');
              setIsFirestoreLoading(false);
            }
          );

          unsubContent = subscribeToContent(
            (remoteContent) => {
              setContentItems(remoteContent);
              saveContent(remoteContent);
              setIsFirestoreLoading(false);
              setSyncStatus('connected');
            },
            (err) => {
              console.error('Content Firestore error:', err);
              setSyncStatus('error');
              setSyncError('Firestore permission or network error reading content.');
              setIsFirestoreLoading(false);
            }
          );
        } catch (err: any) {
          console.error('Firestore init error:', err);
          setSyncStatus('error');
          setSyncError(err.message || 'Error connecting to Cloud Firestore');
          setIsFirestoreLoading(false);
        }
      } else {
        setSyncStatus('offline');
        setIsFirestoreLoading(false);
        if (unsubClients) unsubClients();
        if (unsubPackages) unsubPackages();
        if (unsubContent) unsubContent();
      }
    });

    return () => {
      unsubAuth();
      if (unsubClients) unsubClients();
      if (unsubPackages) unsubPackages();
      if (unsubContent) unsubContent();
    };
  }, []);

  const handleQuickSignIn = async () => {
    try {
      await googleSignIn();
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      showToast(`Sign in error: ${err.message || 'Authentication cancelled'}`);
    }
  };

  // Handle switching between the 3 access roles
  const handleSelectRole = (newRole: UserRole, targetClientId?: string) => {
    if (newRole === 'admin' && !isAuthorizedAdmin) {
      showToast('Admin access needs a Google sign-in with an approved admin account.');
      return;
    }
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
  const handleResetData = async () => {
    if (window.confirm('Reset all data to sample Metaa Craze client campaigns?')) {
      resetToInitialData();
      setClients(initialClients);
      setPackages(initialPackages);
      setContentItems(initialContent);

      if (currentUser) {
        try {
          await resetFirestoreData(initialClients, initialPackages, initialContent);
          showToast('Cloud database reset to default Metaa Craze client campaigns.');
        } catch (err: any) {
          console.error('Failed to reset Firestore:', err);
          showToast(`Error resetting database: ${err.message}`);
        }
      } else {
        showToast('Data reset to default sample records.');
      }
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
  const handleSaveClient = async (client: Client, packageData?: InitialPackageData) => {
    const exists = clients.some(c => c.id === client.id);
    const updatedClients = exists
      ? clients.map(c => (c.id === client.id ? client : c))
      : [client, ...clients];
    setClients(updatedClients);
    saveClients(updatedClients);

    if (currentUser) {
      try {
        await saveClientToFirestore(client);
        showToast(`Client "${client.name}" saved to Cloud Firestore.`);
      } catch (err: any) {
        console.error('Failed to save client to Firestore:', err);
        showToast(`Error saving client to cloud: ${err.message}`);
      }
    } else {
      showToast(`Client "${client.name}" saved locally. Sign in with Google to sync.`);
    }

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
        const updatedPackages = existingPkgIndex >= 0
          ? packages.map((p, idx) => (idx === existingPkgIndex ? newPkg : p))
          : [newPkg, ...packages];
        setPackages(updatedPackages);
        savePackages(updatedPackages);

        if (currentUser) {
          try {
            await savePackageToFirestore(newPkg);
          } catch (err: any) {
            console.error('Failed to save package to Firestore:', err);
          }
        }

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
            const allContent = [...contentItems, ...newItems];
            setContentItems(allContent);
            saveContent(allContent);

            if (currentUser) {
              try {
                await saveContentItemsBatch(newItems);
                showToast(`Created ${client.name} with ${totalDeliverables} deliverables in Cloud Firestore!`);
              } catch (err: any) {
                console.error('Failed to batch save content:', err);
                showToast(`Created locally, error syncing to cloud: ${err.message}`);
              }
            } else {
              showToast(`Created ${client.name} with ${totalDeliverables} deliverables locally.`);
            }
          }
        }
      }
    }
  };

  const handleSaveClientAndSetDeliverables = (client: Client) => {
    handleSaveClient(client);
    setActiveTab('packages');
    setPackageToEdit(null);
    setPackageModalDefaultClientId(client.id);
    setIsPackageModalOpen(true);
  };

  const handleToggleClientStatus = async (clientId: string) => {
    if (userRole !== 'admin') return;
    const target = clients.find(c => c.id === clientId);
    if (!target) return;
    const nextStatus = target.status === 'Active' ? 'Inactive' : 'Active';
    const updatedClient: Client = { ...target, status: nextStatus as 'Active' | 'Inactive' };

    const updated = clients.map(c => (c.id === clientId ? updatedClient : c));
    setClients(updated);
    saveClients(updated);
    showToast(`${target.name} is now ${nextStatus}.`);

    if (currentUser) {
      try {
        await saveClientToFirestore(updatedClient);
      } catch (err: any) {
        console.error('Failed to update status in Firestore:', err);
        showToast(`Error updating cloud status: ${err.message}`);
      }
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (userRole !== 'admin') return;
    const client = clients.find(c => c.id === clientId);
    const clientName = client?.name || 'Client';

    const updatedClients = clients.filter(c => c.id !== clientId);
    const updatedPackages = packages.filter(p => p.clientId !== clientId);
    const updatedContent = contentItems.filter(i => i.clientId !== clientId);

    setClients(updatedClients);
    saveClients(updatedClients);
    setPackages(updatedPackages);
    savePackages(updatedPackages);
    setContentItems(updatedContent);
    saveContent(updatedContent);

    if (drilldownClientId === clientId) {
      setDrilldownClientId('');
    }
    if (clientAccessId === clientId) {
      setClientAccessId(undefined);
      setUserRole('admin');
    }

    if (currentUser) {
      try {
        await deleteClientFromFirestore(clientId);
        showToast(`Client "${clientName}" and associated deliverables deleted from Cloud Firestore.`);
      } catch (err: any) {
        console.error('Failed to delete client from Firestore:', err);
        showToast(`Error deleting client from cloud: ${err.message}`);
      }
    } else {
      showToast(`Client "${clientName}" deleted locally.`);
    }
  };

  // Package Handlers
  const handleSavePackage = async (pkg: MonthlyPackage, autoGenerateItems: boolean) => {
    if (userRole !== 'admin') return;
    const exists = packages.some(p => p.id === pkg.id);
    const updatedPackages = exists
      ? packages.map(p => (p.id === pkg.id ? pkg : p))
      : [pkg, ...packages];
    setPackages(updatedPackages);
    savePackages(updatedPackages);
    showToast(`Package ${pkg.packageId} ${exists ? 'updated' : 'created'}.`);

    if (currentUser) {
      try {
        await savePackageToFirestore(pkg);
      } catch (err: any) {
        console.error('Failed to save package in Firestore:', err);
        showToast(`Error saving package to cloud: ${err.message}`);
      }
    }

    if (autoGenerateItems) {
      await generateContentItemsForPackage(pkg);
    }
  };

  const generateContentItemsForPackage = async (pkg: MonthlyPackage) => {
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
      const allItems = [...contentItems, ...newItems];
      setContentItems(allItems);
      saveContent(allItems);

      if (currentUser) {
        try {
          await saveContentItemsBatch(newItems);
          showToast(`Generated ${newItems.length} numbered deliverables in Cloud Firestore.`);
        } catch (err: any) {
          console.error('Failed to batch save content:', err);
          showToast(`Generated locally, error syncing to cloud: ${err.message}`);
        }
      } else {
        showToast(`Generated ${newItems.length} numbered content items for ${client?.name || 'client'}.`);
      }
    } else {
      showToast('All deliverables for this package already have records in the tracker.');
    }
  };

  // Content Item Handlers
  const handleSaveContentItem = async (item: ContentItem) => {
    if (userRole !== 'admin') return;
    const exists = contentItems.some(i => i.id === item.id);
    const updated = exists
      ? contentItems.map(i => (i.id === item.id ? item : i))
      : [item, ...contentItems];
    setContentItems(updated);
    saveContent(updated);
    showToast(`${exists ? 'Updated' : 'Created'} ${item.displayNumber}.`);

    if (currentUser) {
      try {
        await saveContentItemToFirestore(item);
      } catch (err: any) {
        console.error('Failed to save item in Firestore:', err);
        showToast(`Error saving item to cloud: ${err.message}`);
      }
    }
  };

  const handleDeleteContentItem = async (itemId: string) => {
    if (userRole !== 'admin') return;
    const target = contentItems.find(i => i.id === itemId);
    const updated = contentItems.filter(i => i.id !== itemId);
    setContentItems(updated);
    saveContent(updated);
    showToast(`Deleted ${target?.displayNumber || 'item'}.`);

    if (currentUser) {
      try {
        await deleteContentItemFromFirestore(itemId);
      } catch (err: any) {
        console.error('Failed to delete item from Firestore:', err);
        showToast(`Error deleting item from cloud: ${err.message}`);
      }
    }
  };

  const handleUpdateItemStatus = async (itemId: string, newStatus: ContentStatus, actualPublishedDate?: string) => {
    if (userRole !== 'admin') return;
    const target = contentItems.find(i => i.id === itemId);
    if (!target) return;
    const updatedItem: ContentItem = {
      ...target,
      status: newStatus,
      actualPublishedDate:
        newStatus === 'Published'
          ? actualPublishedDate || target.actualPublishedDate || new Date().toISOString().split('T')[0]
          : target.actualPublishedDate,
      updatedAt: new Date().toISOString()
    };

    const updated = contentItems.map(i => (i.id === itemId ? updatedItem : i));
    setContentItems(updated);
    saveContent(updated);
    showToast(`Status updated to "${newStatus}".`);

    if (currentUser) {
      try {
        await saveContentItemToFirestore(updatedItem);
      } catch (err: any) {
        console.error('Failed to update status in Firestore:', err);
      }
    }
  };

  const handleUpdatePostUrl = async (itemId: string, newUrl: string) => {
    if (userRole !== 'admin') return;
    const target = contentItems.find(i => i.id === itemId);
    if (!target) return;
    const updatedItem: ContentItem = {
      ...target,
      postUrl: newUrl,
      updatedAt: new Date().toISOString()
    };

    const updated = contentItems.map(i => (i.id === itemId ? updatedItem : i));
    setContentItems(updated);
    saveContent(updated);
    showToast('Post URL updated.');

    if (currentUser) {
      try {
        await saveContentItemToFirestore(updatedItem);
      } catch (err: any) {
        console.error('Failed to update URL in Firestore:', err);
      }
    }
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
        syncStatus={syncStatus}
        onMonthChange={handleMonthChange}
        onOpenNewContentModal={() => handleOpenAddContent()}
        onOpenAccessModal={() => setIsAccessModalOpen(true)}
        onResetData={handleResetData}
        onGoogleSignInSuccess={handleQuickSignIn}
      />

      {/* Main Navigation Tabs */}
      <Navigation
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        activeClientsCount={activeClients.length}
        totalProjectsCount={monthPackages.length}
        overdueCount={overdueCount}
        currentRole={userRole}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Firestore Sync Alerts & Local Mode Banner */}
        {!currentUser && (
          <div className="mb-6 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-200">
            <div className="flex items-center gap-2.5">
              <CloudOff className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Cloud Sync Offline:</strong> You are currently in local mode. Sign in with Google to enable real-time <strong>Cloud Firestore</strong> sync across all your devices and team members.
              </span>
            </div>
            <button
              onClick={handleQuickSignIn}
              className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-xs transition-colors shrink-0 self-start sm:self-auto shadow-sm"
            >
              Sign in with Google
            </button>
          </div>
        )}

        {syncError && currentUser && (
          <div className="mb-6 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-between gap-3 text-xs text-red-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>Firestore Sync: {syncError}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-red-400 underline font-semibold hover:text-red-300"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State when initial Firestore data is fetching */}
        {isFirestoreLoading && currentUser && clients.length === 0 ? (
          <div className="p-16 text-center space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
            <p className="text-sm font-semibold text-white">Connecting to Cloud Firestore...</p>
            <p className="text-xs text-slate-400">Loading your shared client campaigns and deliverables</p>
          </div>
        ) : userRole === 'client' && clientTarget && activeTab === 'dashboard' ? (
          <ClientPortalView
            client={clientTarget}
            packages={packages}
            contentItems={contentItems}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={handleMonthChange}
            onOpenReport={() => setActiveTab('reports')}
            onExitClientMode={() => handleSelectRole(isAuthorizedAdmin ? 'admin' : 'viewer')}
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
                  setPackageModalDefaultClientId(undefined);
                  setPackageToEdit(null);
                  setIsPackageModalOpen(true);
                }}
                onEditPackage={(pkg) => {
                  setPackageModalDefaultClientId(undefined);
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
        onSaveAndSetDeliverables={handleSaveClientAndSetDeliverables}
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
        defaultClientId={packageModalDefaultClientId}
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
