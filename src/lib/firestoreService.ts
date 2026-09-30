import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  query,
  where,
  Unsubscribe,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';
import { db, auth } from './firebaseAuth';
import { Client, MonthlyPackage, ContentItem } from '../types';

export const CLIENTS_COLLECTION = 'clients';
export const PACKAGES_COLLECTION = 'packages';
export const CONTENT_COLLECTION = 'content';
export const MIGRATION_FLAG_KEY = 'metaa_craze_firestore_migrated_v1';

// Helper to sanitize undefined values before saving to Firestore
const sanitizeForFirestore = <T extends Record<string, any>>(obj: T): Record<string, any> => {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
};

// ============================================================================
// REAL-TIME FIRESTORE LISTENERS
// ============================================================================

export const subscribeToClients = (
  onUpdate: (clients: Client[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const q = collection(db, CLIENTS_COLLECTION);
  return onSnapshot(
    q,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const clients: Client[] = [];
      snapshot.forEach((docSnap) => {
        clients.push(docSnap.data() as Client);
      });
      // Sort clients alphabetically or by createdAt
      clients.sort((a, b) => a.name.localeCompare(b.name));
      onUpdate(clients);
    },
    (err) => {
      console.error('Error listening to clients collection:', err);
      if (onError) onError(err);
    }
  );
};

export const subscribeToPackages = (
  onUpdate: (packages: MonthlyPackage[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const q = collection(db, PACKAGES_COLLECTION);
  return onSnapshot(
    q,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const packages: MonthlyPackage[] = [];
      snapshot.forEach((docSnap) => {
        packages.push(docSnap.data() as MonthlyPackage);
      });
      onUpdate(packages);
    },
    (err) => {
      console.error('Error listening to packages collection:', err);
      if (onError) onError(err);
    }
  );
};

export const subscribeToContent = (
  onUpdate: (content: ContentItem[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const q = collection(db, CONTENT_COLLECTION);
  return onSnapshot(
    q,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const items: ContentItem[] = [];
      snapshot.forEach((docSnap) => {
        items.push(docSnap.data() as ContentItem);
      });
      onUpdate(items);
    },
    (err) => {
      console.error('Error listening to content collection:', err);
      if (onError) onError(err);
    }
  );
};

// ============================================================================
// CRUD OPERATIONS: CLIENTS
// ============================================================================

export const saveClientToFirestore = async (client: Client): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('You must be signed in with Google to perform cloud database operations.');
  }
  const cleanData = sanitizeForFirestore(client);
  const clientRef = doc(db, CLIENTS_COLLECTION, client.id);
  await setDoc(clientRef, cleanData, { merge: true });
};

export const deleteClientFromFirestore = async (clientId: string): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('You must be signed in with Google to perform cloud database operations.');
  }

  // 1. Delete client document
  const clientRef = doc(db, CLIENTS_COLLECTION, clientId);
  await deleteDoc(clientRef);

  // 2. Query and batch delete all packages belonging to this client
  const pkgsQuery = query(collection(db, PACKAGES_COLLECTION), where('clientId', '==', clientId));
  const pkgsSnap = await getDocs(pkgsQuery);

  // 3. Query and batch delete all content items belonging to this client
  const contentQuery = query(collection(db, CONTENT_COLLECTION), where('clientId', '==', clientId));
  const contentSnap = await getDocs(contentQuery);

  // Delete associated records in chunks of 400
  const docsToDelete = [...pkgsSnap.docs, ...contentSnap.docs];
  const chunkSize = 400;
  for (let i = 0; i < docsToDelete.length; i += chunkSize) {
    const chunk = docsToDelete.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
};

// ============================================================================
// CRUD OPERATIONS: PACKAGES
// ============================================================================

export const savePackageToFirestore = async (pkg: MonthlyPackage): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('You must be signed in with Google to perform cloud database operations.');
  }
  const cleanData = sanitizeForFirestore(pkg);
  const pkgRef = doc(db, PACKAGES_COLLECTION, pkg.id);
  await setDoc(pkgRef, cleanData, { merge: true });
};

export const deletePackageFromFirestore = async (packageId: string): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('You must be signed in with Google to perform cloud database operations.');
  }
  const pkgRef = doc(db, PACKAGES_COLLECTION, packageId);
  await deleteDoc(pkgRef);

  // Delete all content items under this package
  const contentQuery = query(collection(db, CONTENT_COLLECTION), where('packageId', '==', packageId));
  const contentSnap = await getDocs(contentQuery);
  if (!contentSnap.empty) {
    const batch = writeBatch(db);
    contentSnap.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
};

// ============================================================================
// CRUD OPERATIONS: CONTENT ITEMS
// ============================================================================

export const saveContentItemToFirestore = async (item: ContentItem): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('You must be signed in with Google to perform cloud database operations.');
  }
  const cleanData = sanitizeForFirestore(item);
  const contentRef = doc(db, CONTENT_COLLECTION, item.id);
  await setDoc(contentRef, cleanData, { merge: true });
};

export const saveContentItemsBatch = async (items: ContentItem[]): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('You must be signed in with Google to perform cloud database operations.');
  }
  if (items.length === 0) return;

  const chunkSize = 400;
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach((item) => {
      const cleanData = sanitizeForFirestore(item);
      const contentRef = doc(db, CONTENT_COLLECTION, item.id);
      batch.set(contentRef, cleanData, { merge: true });
    });
    await batch.commit();
  }
};

export const deleteContentItemFromFirestore = async (contentId: string): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('You must be signed in with Google to perform cloud database operations.');
  }
  const contentRef = doc(db, CONTENT_COLLECTION, contentId);
  await deleteDoc(contentRef);
};

// ============================================================================
// SAFE ONE-TIME MIGRATION FROM LOCALSTORAGE TO FIRESTORE
// ============================================================================

export const checkIfFirestoreHasData = async (): Promise<boolean> => {
  try {
    const clientsSnap = await getDocs(collection(db, CLIENTS_COLLECTION));
    return !clientsSnap.empty;
  } catch (err) {
    console.error('Error checking Firestore data:', err);
    return false;
  }
};

export const migrateLocalDataToFirestore = async (
  localClients: Client[],
  localPackages: MonthlyPackage[],
  localContent: ContentItem[]
): Promise<{
  migrated: boolean;
  clientCount: number;
  packageCount: number;
  contentCount: number;
}> => {
  if (!auth.currentUser) {
    return { migrated: false, clientCount: 0, packageCount: 0, contentCount: 0 };
  }

  // 1. Check if Firestore already has clients
  const hasExistingData = await checkIfFirestoreHasData();
  if (hasExistingData) {
    // Already populated in cloud, skip migration to avoid overwriting newer cloud data
    localStorage.setItem(MIGRATION_FLAG_KEY, 'true');
    return { migrated: false, clientCount: 0, packageCount: 0, contentCount: 0 };
  }

  // 2. Prepare batches for Clients
  const batch1 = writeBatch(db);
  localClients.forEach((client) => {
    const ref = doc(db, CLIENTS_COLLECTION, client.id);
    batch1.set(ref, sanitizeForFirestore(client), { merge: true });
  });
  await batch1.commit();

  // 3. Prepare batches for Packages
  const batch2 = writeBatch(db);
  localPackages.forEach((pkg) => {
    const ref = doc(db, PACKAGES_COLLECTION, pkg.id);
    batch2.set(ref, sanitizeForFirestore(pkg), { merge: true });
  });
  await batch2.commit();

  // 4. Prepare batches for Content in chunks of 400
  const chunkSize = 400;
  for (let i = 0; i < localContent.length; i += chunkSize) {
    const chunk = localContent.slice(i, i + chunkSize);
    const contentBatch = writeBatch(db);
    chunk.forEach((item) => {
      const ref = doc(db, CONTENT_COLLECTION, item.id);
      contentBatch.set(ref, sanitizeForFirestore(item), { merge: true });
    });
    await contentBatch.commit();
  }

  // Set the migration completion flag only after all writes have succeeded
  localStorage.setItem(MIGRATION_FLAG_KEY, 'true');

  return {
    migrated: true,
    clientCount: localClients.length,
    packageCount: localPackages.length,
    contentCount: localContent.length
  };
};

// Helper to reset Firestore to default sample data
export const resetFirestoreData = async (
  initialClients: Client[],
  initialPackages: MonthlyPackage[],
  initialContent: ContentItem[]
): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('You must be signed in with Google to reset cloud database.');
  }

  // Fetch all existing documents
  const [clientsSnap, pkgsSnap, contentSnap] = await Promise.all([
    getDocs(collection(db, CLIENTS_COLLECTION)),
    getDocs(collection(db, PACKAGES_COLLECTION)),
    getDocs(collection(db, CONTENT_COLLECTION))
  ]);

  const allDocs = [...clientsSnap.docs, ...pkgsSnap.docs, ...contentSnap.docs];
  const chunkSize = 400;
  for (let i = 0; i < allDocs.length; i += chunkSize) {
    const chunk = allDocs.slice(i, i + chunkSize);
    const batch = writeBatch(db);
    chunk.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }

  // Write new sample data
  await migrateLocalDataToFirestore(initialClients, initialPackages, initialContent);
};
