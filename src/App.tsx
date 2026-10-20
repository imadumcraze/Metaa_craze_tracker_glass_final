import React, { useState, useEffect, useRef } from 'react';
import {
  Client,
  MonthlyPackage,
  ContentItem,
  TabType,
  ContentStatus,
  ContentType,
  InitialPackageData,
  UserRole,
  TeamTask,
  ContentNote
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
  getStoredTeamMembers,
  saveTeamMembers,
  getStoredTeamTasks,
  saveTeamTasks,
  getStoredContentNotes,
  saveContentNotes,
  initialClients,
  initialPackages,
  initialContent
} from './lib/storage';
import { getSriLankaToday } from './lib/dateUtils';
import { isAssignedTo, getItemAssignees, buildAssigneeFields } from './lib/assignees';
import { isAdminEmail, IS_LOCAL_DEV } from './lib/adminConfig';
import { subscribeToAuthUser, googleSignIn, logout } from './lib/firebaseAuth';
import {
  subscribeToClients,
  subscribeToPackages,
  subscribeToContent,
  subscribeToContentNotes,
  saveClientToFirestore,
  deleteClientFromFirestore,
  savePackageToFirestore,
  deletePackageFromFirestore,
  saveContentItemToFirestore,
  saveContentItemsBatch,
  deleteContentItemFromFirestore,
  addContentNote,
  updateContentNote,
  deleteContentNote,
  deleteNotesForContentItems,
  migrateLocalDataToFirestore,
  resetFirestoreData,
  updateContentStatusFields,
  batchUpdateAssignedContent
} from './lib/firestoreService';
import {
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  fetchTeamMemberProfile,
  subscribeToTeamMembers,
  isTeamEmail,
  saveTeamTask,
  deleteTeamTask,
  setTeamTaskDone,
  deleteTasksForMember,
  subscribeToTeamTasks
} from './lib/teamService';
import { computeCompletion } from './lib/dailyTasks';
import { TeamMember } from './types';
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
import { TeamMembersView } from './components/TeamMembersView';
import { AccessModal } from './components/AccessModal';
import { ClientModal } from './components/ClientModal';
import { PackageModal } from './components/PackageModal';
import { ContentItemModal } from './components/ContentItemModal';
import { TeamLoginModal } from './components/TeamLoginModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { TeamMemberModal } from './components/TeamMemberModal';
import { MyTasksPanel } from './components/MyTasksPanel';
import { TeamTaskModal } from './components/TeamTaskModal';

export default function App() {
  // Primary State
  const [clients, setClients] = useState<Client[]>([]);
  const [packages, setPackages] = useState<MonthlyPackage[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [contentNotes, setContentNotes] = useState<ContentNote[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(getStoredTeamMembers());
  const [currentTeamMember, setCurrentTeamMember] = useState<TeamMember | null>(null);
  const [teamTasks, setTeamTasks] = useState<TeamTask[]>(getStoredTeamTasks());
  const [focusItemId, setFocusItemId] = useState<string | undefined>(undefined);
  const [teamTaskModalMember, setTeamTaskModalMember] = useState<TeamMember | null>(null);
  const [isTeamTaskModalOpen, setIsTeamTaskModalOpen] = useState<boolean>(false);

  // Firebase Auth & Cloud Firestore Sync State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState<'connected' | 'offline' | 'syncing' | 'error'>('offline');
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isFirestoreLoading, setIsFirestoreLoading] = useState<boolean>(true);

  // Access Category State (4 Categories: 'admin' | 'viewer' | 'client' | 'moderator')
  const [userRole, setUserRole] = useState<UserRole>(IS_LOCAL_DEV ? 'admin' : 'viewer');
  const [clientAccessId, setClientAccessId] = useState<string | undefined>(undefined);
  const [isAccessModalOpen, setIsAccessModalOpen] = useState<boolean>(false);

  // Team Modals
  const [isTeamLoginModalOpen, setIsTeamLoginModalOpen] = useState<boolean>(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState<boolean>(false);
  const [isTeamMemberModalOpen, setIsTeamMemberModalOpen] = useState<boolean>(false);
  const [teamMemberToEdit, setTeamMemberToEdit] = useState<TeamMember | null>(null);

  const isAuthorizedAdmin =
    !currentTeamMember &&
    userRole !== 'moderator' &&
    (isAdminEmail(currentUser?.email) || (IS_LOCAL_DEV && !currentUser));

  useEffect(() => {
    if (!isAuthorizedAdmin) {
      setIsAccessModalOpen(false);
      setIsTeamMemberModalOpen(false);
    }
  }, [isAuthorizedAdmin]);

  const handleOpenAccessModal = () => {
    if (!isAuthorizedAdmin) return;
    setIsAccessModalOpen(true);
  };

  // Month & Year Filter (defaults to current month and year in Sri Lanka time)
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    const parts = getSriLankaToday().split('-');
    return parseInt(parts[1], 10);
  });
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const parts = getSriLankaToday().split('-');
    return parseInt(parts[0], 10);
  });

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Drilldown filter passed between views (e.g. from Dashboard to Tracker or Reports)
  const [drilldownClientId, setDrilldownClientId] = useState<string>('');

  // Topbar scroll shrink state and height measurement
  const [compact, setCompact] = useState(false);
  const topbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let rafId: number | null = null;

    const handleScroll = () => {
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        const y = window.scrollY;
        if (y > 100) {
          setCompact((prev) => (prev ? prev : true));
        } else if (y < 16) {
          setCompact((prev) => (!prev ? prev : false));
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
    };
  }, []);

  useEffect(() => {
    const el = topbarRef.current;
    if (!el) return;

    const updateHeight = () => {
      const h = el.getBoundingClientRect().height;
      if (h > 0) {
        document.documentElement.style.setProperty('--topbar-h', `${Math.round(h)}px`);
      }
    };

    updateHeight();

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height ?? el.getBoundingClientRect().height;
        if (h > 0) {
          document.documentElement.style.setProperty('--topbar-h', `${Math.round(h)}px`);
        }
      }
    });

    resizeObserver.observe(el);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

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
    // 1. Initial cached / offline load from localStorage (dev only) or start empty for visitors
    if (IS_LOCAL_DEV) {
      const localClients = getStoredClients();
      const localPackages = getStoredPackages();
      const localContent = getStoredContent();
      const localNotes = getStoredContentNotes();
      setClients(localClients);
      setPackages(localPackages);
      setContentItems(localContent);
      setContentNotes(localNotes);
    } else {
      setClients([]);
      setPackages([]);
      setContentItems([]);
      setContentNotes([]);
    }

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
    } else if (roleParam === 'moderator') {
      setUserRole('moderator');
      saveAccessSession({ role: 'moderator' });
    } else {
      const savedSession = getStoredAccessSession();
      const restoredRole = savedSession.role === 'admin' ? undefined : savedSession.role;
      setUserRole(restoredRole || (IS_LOCAL_DEV ? 'admin' : 'viewer'));
      setClientAccessId(savedSession.clientId);
    }

    // 3. Start Firestore realtime listeners immediately upon app load (no auth required for reading)
    setSyncStatus('syncing');
    setIsFirestoreLoading(true);
    setSyncError(null);

    const unsubClients = subscribeToClients(
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

    const unsubPackages = subscribeToPackages(
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

    const unsubContent = subscribeToContent(
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

    const unsubContentNotes = subscribeToContentNotes(
      (remoteNotes) => {
        setContentNotes(remoteNotes);
        saveContentNotes(remoteNotes);
      },
      (err) => {
        console.error('Content notes Firestore error:', err);
      }
    );

    // 4. Subscribe to Firebase Auth for role handling and admin migration
    const unsubAuth = subscribeToAuthUser(async (user) => {
      setCurrentUser(user);
      const urlRoleParam = new URLSearchParams(window.location.search).get('role');

      if (!user) {
        setCurrentTeamMember(null);
        setUserRole((prev) => (prev === 'moderator' ? 'viewer' : prev));
        return;
      }

      // Check if logged-in user is a Team Member (moderator)
      if (isTeamEmail(user.email)) {
        try {
          const profile = await fetchTeamMemberProfile(user.uid);
          if (!profile || !profile.active) {
            showToast('Team member account has been deactivated or not found.');
            await logout();
            setCurrentTeamMember(null);
            setUserRole('viewer');
            saveAccessSession({ role: 'viewer' });
            return;
          }
          setCurrentTeamMember(profile);
          setUserRole('moderator');
          saveAccessSession({ role: 'moderator' });
          showToast(`Signed in as ${profile.name} (${profile.roleTitle})`);
        } catch (err: any) {
          console.error('Failed to load team member profile:', err);
        }
        return;
      }

      // Check for Admin
      if (isAdminEmail(user?.email) && !urlRoleParam) {
        setCurrentTeamMember(null);
        setUserRole('admin');
        setClientAccessId(undefined);
      } else {
        setCurrentTeamMember(null);
        if (!IS_LOCAL_DEV) {
          setUserRole((prev) => (prev === 'admin' ? 'viewer' : prev));
        }
        if (user && !isAdminEmail(user.email)) {
          showToast(`Signed in as ${user.email}. This account is not an admin, so access is view-only.`);
        }
      }

      // Only run migrateLocalDataToFirestore when the signed-in user is an admin or in local dev
      if (user && (isAdminEmail(user.email) || IS_LOCAL_DEV)) {
        try {
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
        } catch (err: any) {
          console.error('Firestore migration error:', err);
        }
      }
    });

    return () => {
      unsubAuth();
      unsubClients();
      unsubPackages();
      unsubContent();
      unsubContentNotes();
    };
  }, []);

  // Synchronize team members with Firestore when admin is active
  useEffect(() => {
    if (!isAuthorizedAdmin) {
      setTeamMembers(getStoredTeamMembers());
      return;
    }

    const unsub = subscribeToTeamMembers(
      (remoteMembers) => {
        if (remoteMembers.length > 0) {
          setTeamMembers(remoteMembers);
          saveTeamMembers(remoteMembers);
        } else {
          setTeamMembers(getStoredTeamMembers());
        }
      },
      (err) => {
        console.warn('Team members subscription error:', err);
        setTeamMembers(getStoredTeamMembers());
      }
    );

    return () => unsub();
  }, [isAuthorizedAdmin]);

  // Synchronize team tasks with Firestore
  useEffect(() => {
    if (userRole === 'admin' && isAuthorizedAdmin) {
      const unsub = subscribeToTeamTasks(
        null,
        (remoteTasks) => {
          setTeamTasks(remoteTasks);
          saveTeamTasks(remoteTasks);
        },
        (err) => {
          console.warn('Admin team tasks subscription error:', err);
          setTeamTasks(getStoredTeamTasks());
        }
      );
      return () => unsub();
    } else if (userRole === 'moderator' && currentTeamMember) {
      const unsub = subscribeToTeamTasks(
        currentTeamMember.uid,
        (remoteTasks) => {
          setTeamTasks(remoteTasks);
        },
        (err) => {
          console.warn('Member team tasks subscription error:', err);
          const local = getStoredTeamTasks().filter((t) => t.assignedToId === currentTeamMember.uid);
          setTeamTasks(local);
        }
      );
      return () => unsub();
    } else if (userRole === 'admin') {
      setTeamTasks(getStoredTeamTasks());
    } else {
      setTeamTasks([]);
    }
  }, [userRole, isAuthorizedAdmin, currentTeamMember?.uid]);

  // Ensure non-admin cannot stay on team tab
  useEffect(() => {
    if (activeTab === 'team' && userRole !== 'admin') {
      setActiveTab('dashboard');
    }
  }, [activeTab, userRole]);

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
    if (!isAuthorizedAdmin) {
      return;
    }
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
      setContentNotes([]);
      setTeamMembers(getStoredTeamMembers());
      setTeamTasks([]);

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
    const msg =
      nextStatus === 'Inactive'
        ? `${target.name} is now Inactive. Their content is hidden and their packages are greyed out.`
        : `${target.name} is now Active.`;
    showToast(msg);

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
    const clientItemIds = contentItems.filter(i => i.clientId === clientId).map(i => i.id);
    const updatedNotes = contentNotes.filter(
      n => n.clientId !== clientId && !clientItemIds.includes(n.contentItemId)
    );

    setClients(updatedClients);
    saveClients(updatedClients);
    setPackages(updatedPackages);
    savePackages(updatedPackages);
    setContentItems(updatedContent);
    saveContent(updatedContent);
    setContentNotes(updatedNotes);
    saveContentNotes(updatedNotes);

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
        if (clientItemIds.length > 0) {
          await deleteNotesForContentItems(clientItemIds);
        }
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
    const existing = contentItems.find(i => i.id === item.id);
    const { completedAt, completedById } = computeCompletion(
      existing || { status: undefined, completedAt: item.completedAt, completedById: item.completedById },
      item.status,
      ''
    );
    const itemWithCompletedAt: ContentItem = {
      ...item,
      completedAt,
      completedById
    };
    const exists = !!existing;
    const updated = exists
      ? contentItems.map(i => (i.id === item.id ? itemWithCompletedAt : i))
      : [itemWithCompletedAt, ...contentItems];
    setContentItems(updated);
    saveContent(updated);
    showToast(`${exists ? 'Updated' : 'Created'} ${item.displayNumber}.`);

    if (currentUser) {
      try {
        await saveContentItemToFirestore(itemWithCompletedAt);
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

    const updatedNotes = contentNotes.filter(n => n.contentItemId !== itemId);
    setContentNotes(updatedNotes);
    saveContentNotes(updatedNotes);

    showToast(`Deleted ${target?.displayNumber || 'item'}.`);

    if (currentUser) {
      try {
        await deleteContentItemFromFirestore(itemId);
        await deleteNotesForContentItems([itemId]);
      } catch (err: any) {
        console.error('Failed to delete item from Firestore:', err);
        showToast(`Error deleting item from cloud: ${err.message}`);
      }
    }
  };

  const handleUpdateItemStatus = async (itemId: string, newStatus: ContentStatus, actualPublishedDate?: string) => {
    if (userRole !== 'admin' && userRole !== 'moderator') return;
    const target = contentItems.find(i => i.id === itemId);
    if (!target) return;
    const publishedDate =
      newStatus === 'Published'
        ? actualPublishedDate || target.actualPublishedDate || getSriLankaToday()
        : target.actualPublishedDate;

    const actorUid = userRole === 'moderator' ? currentTeamMember?.uid || '' : '';
    const { completedAt, completedById } = computeCompletion(target, newStatus, actorUid);

    const updatedItem: ContentItem = {
      ...target,
      status: newStatus,
      completedAt,
      completedById,
      actualPublishedDate: publishedDate,
      updatedAt: new Date().toISOString()
    };

    const updated = contentItems.map(i => (i.id === itemId ? updatedItem : i));
    setContentItems(updated);
    saveContent(updated);
    showToast(`Status updated to "${newStatus}".`);

    if (currentUser) {
      try {
        if (userRole === 'moderator') {
          await updateContentStatusFields(itemId, {
            status: newStatus,
            actualPublishedDate: publishedDate,
            completedAt,
            completedById
          });
        } else {
          await saveContentItemToFirestore(updatedItem);
        }
      } catch (err: any) {
        console.error('Failed to update status in Firestore:', err);
      }
    }
  };

  const handleUpdatePostUrl = async (itemId: string, newUrl: string) => {
    if (userRole !== 'admin' && userRole !== 'moderator') return;
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
        if (userRole === 'moderator') {
          await updateContentStatusFields(itemId, { postUrl: newUrl });
        } else {
          await saveContentItemToFirestore(updatedItem);
        }
      } catch (err: any) {
        console.error('Failed to update URL in Firestore:', err);
      }
    }
  };

  const handleUpdateContentStatusFields = async (
    itemId: string,
    fields: {
      status?: ContentStatus;
      actualPublishedDate?: string;
      postUrl?: string;
      remarks?: string;
      completedAt?: string;
      completedById?: string;
    }
  ) => {
    if (userRole !== 'admin' && userRole !== 'moderator') return;
    const target = contentItems.find(i => i.id === itemId);
    if (!target) return;

    const actorUid = userRole === 'moderator' ? currentTeamMember?.uid || '' : '';
    const completion = fields.status !== undefined
      ? computeCompletion(target, fields.status, actorUid)
      : {
          completedAt: fields.completedAt !== undefined ? fields.completedAt : target.completedAt,
          completedById: fields.completedById !== undefined ? fields.completedById : target.completedById
        };

    const fieldsWithCompletion = {
      ...fields,
      ...(fields.status !== undefined
        ? { completedAt: completion.completedAt, completedById: completion.completedById }
        : {})
    };

    const updatedItem: ContentItem = {
      ...target,
      ...fieldsWithCompletion,
      updatedAt: new Date().toISOString()
    };

    const updated = contentItems.map(i => (i.id === itemId ? updatedItem : i));
    setContentItems(updated);
    saveContent(updated);
    showToast('Deliverable status updated.');

    if (currentUser) {
      try {
        if (userRole === 'moderator') {
          await updateContentStatusFields(itemId, fieldsWithCompletion);
        } else {
          await saveContentItemToFirestore(updatedItem);
        }
      } catch (err: any) {
        console.error('Failed to update status fields in Firestore:', err);
        showToast(`Error updating cloud: ${err.message}`);
      }
    }
  };

  // Content Note Handlers
  const handleAddNote = async (itemId: string, text: string) => {
    if (userRole !== 'admin' && userRole !== 'moderator') {
      showToast('You do not have permission to add notes.');
      return;
    }
    if (userRole === 'moderator' && !currentTeamMember) {
      showToast('Team member profile not found.');
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > 2000) {
      showToast('Note cannot exceed 2000 characters.');
      return;
    }

    const item = contentItems.find(i => i.id === itemId);
    const clientId = item?.clientId;
    const noteId = `note-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

    let authorId = '';
    let authorName = '';
    let authorRole: 'admin' | 'team' = 'admin';
    let authorTitle: string | undefined = undefined;

    if (userRole === 'admin') {
      authorId = currentUser?.uid || 'local-admin';
      authorName = 'Admin';
      authorRole = 'admin';
    } else if (userRole === 'moderator' && currentTeamMember) {
      authorId = currentTeamMember.uid;
      authorName = currentTeamMember.name;
      authorTitle = currentTeamMember.roleTitle;
      authorRole = 'team';
    }

    const newNote: ContentNote = {
      id: noteId,
      contentItemId: itemId,
      ...(clientId ? { clientId } : {}),
      text: trimmed,
      authorId,
      authorName,
      authorRole,
      ...(authorTitle ? { authorTitle } : {}),
      createdAt: new Date().toISOString()
    };

    const updatedNotes = [...contentNotes, newNote];
    setContentNotes(updatedNotes);
    saveContentNotes(updatedNotes);
    showToast('Note added.');

    if (currentUser) {
      try {
        await addContentNote(newNote);
      } catch (err: any) {
        console.error('Failed to save note to Firestore:', err);
        showToast(`Error saving note to cloud: ${err.message}`);
      }
    }
  };

  const handleUpdateNote = async (noteId: string, text: string) => {
    const note = contentNotes.find(n => n.id === noteId);
    if (!note) return;

    const canModify =
      userRole === 'admin' ||
      (userRole === 'moderator' && currentTeamMember && note.authorId === currentTeamMember.uid);

    if (!canModify) {
      showToast('You do not have permission to edit this note.');
      return;
    }

    const trimmed = text.trim();
    if (!trimmed) return;
    if (trimmed.length > 2000) {
      showToast('Note cannot exceed 2000 characters.');
      return;
    }

    const updatedAt = new Date().toISOString();
    const editedByName = userRole === 'admin' ? 'Admin' : currentTeamMember?.name || 'Moderator';

    const updatedNotes = contentNotes.map(n =>
      n.id === noteId
        ? {
            ...n,
            text: trimmed,
            updatedAt,
            edited: true,
            editedByName
          }
        : n
    );
    setContentNotes(updatedNotes);
    saveContentNotes(updatedNotes);
    showToast('Note updated.');

    if (currentUser) {
      try {
        await updateContentNote(noteId, {
          text: trimmed,
          updatedAt,
          edited: true,
          editedByName
        });
      } catch (err: any) {
        console.error('Failed to update note in Firestore:', err);
        showToast(`Error updating note in cloud: ${err.message}`);
      }
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const note = contentNotes.find(n => n.id === noteId);
    if (!note) return;

    const canModify =
      userRole === 'admin' ||
      (userRole === 'moderator' && currentTeamMember && note.authorId === currentTeamMember.uid);

    if (!canModify) {
      showToast('You do not have permission to delete this note.');
      return;
    }

    const updatedNotes = contentNotes.filter(n => n.id !== noteId);
    setContentNotes(updatedNotes);
    saveContentNotes(updatedNotes);
    showToast('Note deleted.');

    if (currentUser) {
      try {
        await deleteContentNote(noteId);
      } catch (err: any) {
        console.error('Failed to delete note from Firestore:', err);
        showToast(`Error deleting note from cloud: ${err.message}`);
      }
    }
  };

  // Team Member CRUD & Auth Handlers
  const handleSaveTeamMember = async (data: {
    uid?: string;
    name: string;
    roleTitle: string;
    username: string;
    password?: string;
  }) => {
    try {
      if (data.uid) {
        await updateTeamMember(data.uid, {
          name: data.name,
          roleTitle: data.roleTitle
        });
        const currentMember = teamMembers.find(m => m.uid === data.uid);
        const updated: TeamMember = {
          ...currentMember!,
          name: data.name,
          roleTitle: data.roleTitle
        };
        const newMembers = teamMembers.map(m => (m.uid === data.uid ? updated : m));
        setTeamMembers(newMembers);
        saveTeamMembers(newMembers);

        // Synchronize denormalized assignee info across assigned content items
        const updatedContent = contentItems.map(item => {
          if (isAssignedTo(item, data.uid)) {
            const currentAssignees = getItemAssignees(item);
            const newAssignees = currentAssignees.map(a =>
              a.uid === data.uid
                ? { ...a, name: updated.name, roleTitle: updated.roleTitle }
                : a
            );
            return {
              ...item,
              ...buildAssigneeFields(newAssignees),
              updatedAt: new Date().toISOString()
            };
          }
          return item;
        });
        setContentItems(updatedContent);
        saveContent(updatedContent);

        if (currentUser) {
          await batchUpdateAssignedContent(data.uid, {
            name: updated.name,
            roleTitle: updated.roleTitle,
            active: updated.active
          });
        }
        showToast(`Team member "${data.name}" updated.`);
      } else {
        if (!data.password) throw new Error('Password is required for new team member.');
        const created = await createTeamMember({
          name: data.name,
          roleTitle: data.roleTitle,
          username: data.username,
          password: data.password,
          createdBy: currentUser?.email || 'admin'
        });
        const newMembers = [...teamMembers, created];
        setTeamMembers(newMembers);
        saveTeamMembers(newMembers);
        showToast(`Team member "${data.name}" (@${created.username}) created.`);
      }
      setIsTeamMemberModalOpen(false);
      setTeamMemberToEdit(null);
    } catch (err: any) {
      console.error('Failed to save team member:', err);
      showToast(`Error: ${err.message || 'Failed to save team member'}`);
      throw err;
    }
  };

  const handleToggleTeamMemberActive = async (memberId: string) => {
    const member = teamMembers.find(m => m.uid === memberId);
    if (!member) return;
    const nextActive = !member.active;
    try {
      await updateTeamMember(memberId, { active: nextActive });
      const updated: TeamMember = { ...member, active: nextActive };
      const newMembers = teamMembers.map(m => (m.uid === memberId ? updated : m));
      setTeamMembers(newMembers);
      saveTeamMembers(newMembers);

      // Reflect in content items
      const updatedContent = contentItems.map(item => {
        if (isAssignedTo(item, memberId)) {
          const currentAssignees = getItemAssignees(item);
          const newAssignees = currentAssignees.map(a =>
            a.uid === memberId ? { ...a, active: nextActive } : a
          );
          return {
            ...item,
            ...buildAssigneeFields(newAssignees),
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      });
      setContentItems(updatedContent);
      saveContent(updatedContent);

      if (currentUser) {
        await batchUpdateAssignedContent(memberId, {
          name: member.name,
          roleTitle: member.roleTitle,
          active: nextActive
        });
      }
      showToast(`${member.name} is now ${nextActive ? 'Active' : 'Inactive'}.`);
    } catch (err: any) {
      console.error('Failed to toggle active state:', err);
      showToast(`Error updating team member: ${err.message}`);
    }
  };

  const handleDeleteTeamMember = async (memberId: string) => {
    const member = teamMembers.find(m => m.uid === memberId);
    const memberName = member?.name || 'Member';
    try {
      await deleteTeamMember(memberId);
      await deleteTasksForMember(memberId);
      const newMembers = teamMembers.filter(m => m.uid !== memberId);
      setTeamMembers(newMembers);
      saveTeamMembers(newMembers);
      const remainingTasks = teamTasks.filter(t => t.assignedToId !== memberId);
      setTeamTasks(remainingTasks);
      saveTeamTasks(remainingTasks);

      // Unassign content items (remove member from assignees)
      const updatedContent = contentItems.map(item => {
        if (isAssignedTo(item, memberId)) {
          const currentAssignees = getItemAssignees(item);
          const newAssignees = currentAssignees.filter(a => a.uid !== memberId);
          return {
            ...item,
            ...buildAssigneeFields(newAssignees),
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      });
      setContentItems(updatedContent);
      saveContent(updatedContent);

      if (currentUser) {
        await batchUpdateAssignedContent(memberId, {
          deleted: true
        });
      }
      showToast(`Team member "${memberName}" removed. Assigned deliverables are now unassigned.`);
    } catch (err: any) {
      console.error('Failed to delete team member:', err);
      showToast(`Error deleting member: ${err.message}`);
    }
  };

  // Team Daily Tasks Handlers
  const handleAddTeamTask = async (taskData: {
    assignedToId: string;
    assignedToName: string;
    title: string;
    notes?: string;
    date: string;
  }) => {
    const newTask: TeamTask = {
      id: `task-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      assignedToId: taskData.assignedToId,
      assignedToName: taskData.assignedToName,
      title: taskData.title,
      notes: taskData.notes,
      date: taskData.date,
      done: false,
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.email || 'admin'
    };

    const updated = [newTask, ...teamTasks];
    setTeamTasks(updated);
    saveTeamTasks(updated);
    showToast(`Task assigned to ${taskData.assignedToName}.`);

    if (currentUser) {
      try {
        await saveTeamTask(newTask);
      } catch (err: any) {
        console.error('Failed to save team task to cloud:', err);
        showToast(`Error saving task to cloud: ${err.message}`);
      }
    }
  };

  const handleDeleteTeamTask = async (taskId: string) => {
    const updated = teamTasks.filter(t => t.id !== taskId);
    setTeamTasks(updated);
    saveTeamTasks(updated);
    showToast('Daily task removed.');

    if (currentUser) {
      try {
        await deleteTeamTask(taskId);
      } catch (err: any) {
        console.error('Failed to delete task from cloud:', err);
        showToast(`Error deleting task: ${err.message}`);
      }
    }
  };

  const handleToggleTaskDone = async (taskId: string, done: boolean) => {
    const task = teamTasks.find(t => t.id === taskId);
    if (!task) return;

    if (userRole === 'moderator' && currentTeamMember && task.assignedToId !== currentTeamMember.uid) {
      return;
    }

    const nowIso = new Date().toISOString();
    const updatedTask: TeamTask = {
      ...task,
      done,
      doneAt: done ? nowIso : undefined,
      updatedAt: nowIso
    };

    const updated = teamTasks.map(t => (t.id === taskId ? updatedTask : t));
    setTeamTasks(updated);
    saveTeamTasks(updated);
    showToast(done ? 'Task marked as done.' : 'Task marked as incomplete.');

    try {
      await setTeamTaskDone(taskId, done);
    } catch (err: any) {
      console.error('Failed to update task done state:', err);
      showToast(`Error updating task: ${err.message}`);
    }
  };

  // Jump to specific deliverable in Content Tracker
  const handleOpenTask = (item: ContentItem) => {
    handleMonthChange(item.month, item.year);
    setActiveTab('tracker');
    setFocusItemId(item.id);
  };

  const handleTeamLogout = async () => {
    try {
      await logout();
      setCurrentTeamMember(null);
      setUserRole('viewer');
      saveAccessSession({ role: 'viewer' });
      showToast('Logged out from team member session.');
    } catch (err: any) {
      console.error('Team logout error:', err);
    }
  };

  const handleTeamLoginSuccess = (member: TeamMember) => {
    setCurrentTeamMember(member);
    setUserRole('moderator');
    setIsTeamLoginModalOpen(false);
    saveAccessSession({ role: 'moderator' });
    showToast(`Welcome, ${member.name}! Moderator permissions enabled.`);
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

  // Deactivated client handling
  const inactiveClientIds = new Set(
    clients.filter(c => c.status === 'Inactive').map(c => c.id)
  );

  const activeClientList = visibleClients.filter(c => c.status === 'Active');

  const hiddenFilteredContentItems =
    userRole === 'client'
      ? visibleContentItems
      : visibleContentItems.filter(item => !inactiveClientIds.has(item.clientId));

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
    <div className="min-h-screen flex flex-col text-slate-100">
      {/* Pinned Top Bar: Header and Navigation */}
      <div
        id="app-topbar"
        ref={topbarRef}
        className="sticky top-0 z-40"
        data-compact={compact ? 'true' : 'false'}
      >
        <Header
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          currentRole={userRole}
          activeClientName={clientTarget?.name}
          currentTeamMember={currentTeamMember}
          syncStatus={syncStatus}
          canSwitchRole={isAuthorizedAdmin}
          onMonthChange={handleMonthChange}
          onOpenNewContentModal={() => handleOpenAddContent()}
          onOpenAccessModal={handleOpenAccessModal}
          onResetData={handleResetData}
          onGoogleSignInSuccess={handleQuickSignIn}
          onTeamLoginClick={() => setIsTeamLoginModalOpen(true)}
          onTeamLogout={handleTeamLogout}
          onChangePasswordClick={() => setIsChangePasswordModalOpen(true)}
        />

        <Navigation
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          activeClientsCount={activeClients.length}
          totalProjectsCount={
            userRole === 'client'
              ? monthPackages.length
              : monthPackages.filter(p => !inactiveClientIds.has(p.clientId)).length
          }
          overdueCount={overdueCount}
          activeTeamMembersCount={teamMembers.filter((m) => m.active).length}
          currentRole={userRole}
        />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 2xl:px-12 py-6 sm:py-8">
        {/* Firestore Sync Banner for Visitors & Error Banner */}
        {!currentUser && (
          <div className="mb-6 px-4 py-2.5 rounded-xl glass flex items-center justify-between gap-3 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  syncStatus === 'connected'
                    ? 'bg-emerald-400'
                    : syncStatus === 'syncing'
                    ? 'bg-amber-400 animate-pulse'
                    : syncStatus === 'error'
                    ? 'bg-red-400'
                    : 'bg-slate-500'
                }`}
              />
              <span className="text-slate-300 font-medium">Live data · View only</span>
            </div>
            <button
              onClick={handleQuickSignIn}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium rounded-lg text-xs transition-colors shrink-0 border border-slate-700"
            >
              Admin sign in
            </button>
          </div>
        )}

        {syncError && (
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
        {isFirestoreLoading && clients.length === 0 && !syncError ? (
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
          />
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <>
                {userRole === 'moderator' && currentTeamMember && (
                  <MyTasksPanel
                    currentTeamMember={currentTeamMember}
                    contentItems={hiddenFilteredContentItems}
                    clients={clients}
                    teamTasks={teamTasks}
                    onOpenTask={handleOpenTask}
                    onToggleTaskDone={handleToggleTaskDone}
                  />
                )}
                <DashboardView
                  selectedMonth={selectedMonth}
                  selectedYear={selectedYear}
                  clients={visibleClients}
                  packages={visiblePackages}
                  contentItems={visibleContentItems}
                  onNavigateTab={handleNavigateTab}
                  onOpenReportForClient={handleOpenReportForClient}
                />
              </>
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
                onLaunchClientPortal={isAuthorizedAdmin ? (cId) => handleSelectRole('client', cId) : undefined}
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
                contentItems={hiddenFilteredContentItems}
                clients={activeClientList}
                teamMembers={teamMembers}
                currentTeamMember={currentTeamMember}
                selectedMonth={selectedMonth}
                selectedYear={selectedYear}
                initialClientFilter={userRole === 'client' && clientTarget ? clientTarget.id : drilldownClientId}
                currentRole={userRole}
                contentNotes={contentNotes}
                onAddNote={handleAddNote}
                onUpdateNote={handleUpdateNote}
                onDeleteNote={handleDeleteNote}
                currentUserId={
                  userRole === 'admin'
                    ? currentUser?.uid || 'local-admin'
                    : userRole === 'moderator'
                    ? currentTeamMember?.uid || ''
                    : ''
                }
                onAddItem={(cId) => handleOpenAddContent(cId)}
                onEditItem={(item) => {
                  setContentToEdit(item);
                  setIsContentModalOpen(true);
                }}
                onDeleteItem={handleDeleteContentItem}
                onUpdateItemStatus={handleUpdateItemStatus}
                onUpdatePostUrl={handleUpdatePostUrl}
                onUpdateStatusFields={handleUpdateContentStatusFields}
                focusItemId={focusItemId}
                onFocusHandled={() => setFocusItemId(undefined)}
              />
            )}

            {activeTab === 'calendar' && (
              <CalendarView
                contentItems={hiddenFilteredContentItems}
                clients={activeClientList}
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

            {activeTab === 'team' && userRole === 'admin' && (
              <TeamMembersView
                teamMembers={teamMembers}
                contentItems={contentItems}
                onAddMember={() => {
                  setTeamMemberToEdit(null);
                  setIsTeamMemberModalOpen(true);
                }}
                onEditMember={(member) => {
                  setTeamMemberToEdit(member);
                  setIsTeamMemberModalOpen(true);
                }}
                onToggleActive={handleToggleTeamMemberActive}
                onDeleteMember={handleDeleteTeamMember}
                onResetAccess={() => {}}
                onManageTasks={(member) => {
                  setTeamTaskModalMember(member);
                  setIsTeamTaskModalOpen(true);
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="print:hidden border-t border-white/10 py-6 text-center text-xs text-slate-500">
        <div className="w-full px-4 sm:px-6 lg:px-8 2xl:px-12 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">Metaa Craze Productions (Pvt) Ltd.</span>
            <span>•</span>
            <span>Social Media Content Tracker</span>
          </div>

          {isAuthorizedAdmin && (
            <div className="flex items-center gap-4">
              <button
                onClick={handleOpenAccessModal}
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
          )}
        </div>
      </footer>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-2xl text-xs sm:text-sm animate-bounce flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Access Control & Client Portal Modal */}
      {isAuthorizedAdmin && (
        <AccessModal
          isOpen={isAccessModalOpen}
          onClose={() => setIsAccessModalOpen(false)}
          currentRole={userRole}
          currentClientId={clientAccessId}
          clients={clients}
          onSelectRole={handleSelectRole}
        />
      )}

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
        teamMembers={teamMembers}
        defaultMonth={selectedMonth}
        defaultYear={selectedYear}
        defaultClientId={contentModalDefaultClientId}
        existingItems={contentItems}
      />

      {/* Team Login Modal */}
      <TeamLoginModal
        isOpen={isTeamLoginModalOpen}
        onClose={() => setIsTeamLoginModalOpen(false)}
        onLoginSuccess={handleTeamLoginSuccess}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        onSuccess={() => {
          setIsChangePasswordModalOpen(false);
          showToast('Password updated successfully.');
        }}
      />

      {/* Team Member Add/Edit Modal (Admin only) */}
      {isAuthorizedAdmin && (
        <TeamMemberModal
          isOpen={isTeamMemberModalOpen}
          onClose={() => {
            setIsTeamMemberModalOpen(false);
            setTeamMemberToEdit(null);
          }}
          onSave={handleSaveTeamMember}
          memberToEdit={teamMemberToEdit}
        />
      )}

      {/* Team Member Daily Tasks Modal (Admin only) */}
      {isAuthorizedAdmin && (
        <TeamTaskModal
          isOpen={isTeamTaskModalOpen}
          onClose={() => {
            setIsTeamTaskModalOpen(false);
            setTeamTaskModalMember(null);
          }}
          member={teamTaskModalMember}
          tasks={teamTasks}
          onAddTask={handleAddTeamTask}
          onDeleteTask={handleDeleteTeamTask}
        />
      )}
    </div>
  );
}
