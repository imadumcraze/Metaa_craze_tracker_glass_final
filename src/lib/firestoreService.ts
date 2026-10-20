import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  query,
  where,
  deleteField,
  Unsubscribe,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';
import { db, auth } from './firebaseAuth';
import { Client, MonthlyPackage, ContentItem, ContentAssignee, ContentNote } from '../types';
import { getItemAssignees, buildAssigneeFields } from './assignees';

export const CLIENTS_COLLECTION = 'clients';
export const PACKAGES_COLLECTION = 'packages';
export const CONTENT_COLLECTION = 'content';
export const CONTENT_NOTES_COLLECTION = 'contentNotes';
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
      snapshot.forEach((docSnap: any) => {
        clients.push(docSnap.data() as Client);
      });
      // Sort clients alphabetically or by createdAt
      clients.sort((a, b) => a.name.localeCompare(b.name));
      onUpdate(clients);
    },
    (err: any) => {
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
      snapshot.forEach((docSnap: any) => {
        packages.push(docSnap.data() as MonthlyPackage);
      });
      onUpdate(packages);
    },
    (err: any) => {
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
      snapshot.forEach((docSnap: any) => {
        items.push(docSnap.data() as ContentItem);
      });
      onUpdate(items);
    },
    (err: any) => {
      console.error('Error listening to content collection:', err);
      if (onError) onError(err);
    }
  );
};

export const subscribeToContentNotes = (
  onUpdate: (notes: ContentNote[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const q = collection(db, CONTENT_NOTES_COLLECTION);
  return onSnapshot(
    q,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const notes: ContentNote[] = [];
      snapshot.forEach((docSnap: any) => {
        notes.push(docSnap.data() as ContentNote);
      });
      onUpdate(notes);
    },
    (err: any) => {
      console.error('Error listening to contentNotes collection:', err);
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

  // Delete notes for deleted content items
  const contentItemIds = contentSnap.docs.map((d) => d.id);
  if (contentItemIds.length > 0) {
    await deleteNotesForContentItems(contentItemIds);
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
    contentSnap.forEach((d: any) => batch.delete(d.ref));
    await batch.commit();

    const pkgItemIds = contentSnap.docs.map((d: any) => d.id);
    await deleteNotesForContentItems(pkgItemIds);
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
  if (item.assignees !== undefined || item.assigneeIds !== undefined) {
    cleanData.assignedToId = deleteField();
    cleanData.assignedToName = deleteField();
    cleanData.assignedToRole = deleteField();
    cleanData.assignedToActive = deleteField();
  }
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
      if (item.assignees !== undefined || item.assigneeIds !== undefined) {
        cleanData.assignedToId = deleteField();
        cleanData.assignedToName = deleteField();
        cleanData.assignedToRole = deleteField();
        cleanData.assignedToActive = deleteField();
      }
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
  await deleteNotesForContentItems([contentId]);
};

// ============================================================================
// CRUD OPERATIONS: CONTENT NOTES
// ============================================================================

export const addContentNote = async (note: ContentNote): Promise<string> => {
  if (!auth.currentUser) {
    throw new Error('You must be signed in to add notes.');
  }
  const noteRef = note.id
    ? doc(db, CONTENT_NOTES_COLLECTION, note.id)
    : doc(collection(db, CONTENT_NOTES_COLLECTION));
  const cleanData = sanitizeForFirestore({
    ...note,
    id: noteRef.id
  });
  await setDoc(noteRef, cleanData);
  return noteRef.id;
};

export const updateContentNote = async (
  id: string,
  updates: {
    text: string;
    updatedAt: string;
    edited?: boolean;
    editedByName?: string;
  }
): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('You must be signed in to update notes.');
  }
  const cleanData = sanitizeForFirestore({
    text: updates.text,
    updatedAt: updates.updatedAt,
    edited: updates.edited !== undefined ? updates.edited : true,
    ...(updates.editedByName !== undefined ? { editedByName: updates.editedByName } : {})
  });
  const noteRef = doc(db, CONTENT_NOTES_COLLECTION, id);
  await updateDoc(noteRef, cleanData);
};

export const deleteContentNote = async (id: string): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('You must be signed in to delete notes.');
  }
  const noteRef = doc(db, CONTENT_NOTES_COLLECTION, id);
  await deleteDoc(noteRef);
};

export const deleteNotesForContentItems = async (itemIds: string[]): Promise<void> => {
  if (!auth.currentUser) return;
  if (!itemIds || itemIds.length === 0) return;

  try {
    const chunkSize = 30;
    const docsToDelete: any[] = [];
    for (let i = 0; i < itemIds.length; i += chunkSize) {
      const chunk = itemIds.slice(i, i + chunkSize);
      const q = query(
        collection(db, CONTENT_NOTES_COLLECTION),
        where('contentItemId', 'in', chunk)
      );
      const snap = await getDocs(q);
      docsToDelete.push(...snap.docs);
    }

    if (docsToDelete.length === 0) return;

    const batchChunkSize = 400;
    for (let i = 0; i < docsToDelete.length; i += batchChunkSize) {
      const chunk = docsToDelete.slice(i, i + batchChunkSize);
      const batch = writeBatch(db);
      chunk.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  } catch (err) {
    console.error('Failed to delete notes for content items:', err);
  }
};

/**
 * Dedicated function to update status-related fields of a content item.
 * Writes ONLY allowed keys ('status', 'actualPublishedDate', 'postUrl', 'remarks', 'updatedAt')
 * so that both Admins and Moderators (Team Members) satisfy Firestore security rules.
 */
export const updateContentStatusFields = async (
  itemId: string,
  partialFields: {
    status?: ContentItem['status'];
    actualPublishedDate?: string;
    postUrl?: string;
    remarks?: string;
    completedAt?: string;
    completedById?: string;
  }
): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('You must be signed in to update content items.');
  }

  const cleanData: Record<string, any> = {
    updatedAt: new Date().toISOString()
  };

  if (partialFields.status !== undefined) {
    cleanData.status = partialFields.status;
  }
  if (partialFields.actualPublishedDate !== undefined) {
    cleanData.actualPublishedDate = partialFields.actualPublishedDate;
  }
  if (partialFields.postUrl !== undefined) {
    cleanData.postUrl = partialFields.postUrl;
  }
  if (partialFields.remarks !== undefined) {
    cleanData.remarks = partialFields.remarks;
  }
  if (partialFields.completedAt !== undefined) {
    cleanData.completedAt = partialFields.completedAt;
  }
  if (partialFields.completedById !== undefined) {
    cleanData.completedById = partialFields.completedById;
  }

  const contentRef = doc(db, CONTENT_COLLECTION, itemId);
  await updateDoc(contentRef, cleanData);
};

/**
 * Batch update content items assigned to a team member when the member is
 * renamed, role is changed, deactivated/reactivated, or removed.
 */
export const batchUpdateAssignedContent = async (
  memberId: string,
  updates: {
    name?: string;
    roleTitle?: string;
    active?: boolean;
    deleted?: boolean;
  }
): Promise<void> => {
  if (!auth.currentUser) return;

  try {
    const q1 = query(collection(db, CONTENT_COLLECTION), where('assigneeIds', 'array-contains', memberId));
    const q2 = query(collection(db, CONTENT_COLLECTION), where('assignedToId', '==', memberId));
    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);

    const docMap = new Map<string, any>();
    snap1.docs.forEach((d) => docMap.set(d.id, d));
    snap2.docs.forEach((d) => docMap.set(d.id, d));
    const allDocs = Array.from(docMap.values());
    if (allDocs.length === 0) return;

    const chunkSize = 400;
    for (let i = 0; i < allDocs.length; i += chunkSize) {
      const chunk = allDocs.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((d: any) => {
        const itemData = d.data() as ContentItem;
        const currentAssignees = getItemAssignees(itemData);
        let newAssignees: ContentAssignee[];
        if (updates.deleted) {
          newAssignees = currentAssignees.filter((a) => a.uid !== memberId);
        } else {
          newAssignees = currentAssignees.map((a) => {
            if (a.uid === memberId) {
              return {
                ...a,
                ...(updates.name !== undefined ? { name: updates.name } : {}),
                ...(updates.roleTitle !== undefined ? { roleTitle: updates.roleTitle } : {}),
                ...(updates.active !== undefined ? { active: updates.active } : {})
              };
            }
            return a;
          });
        }
        const fields = buildAssigneeFields(newAssignees);
        const itemUpdate: Record<string, any> = {
          assignees: fields.assignees,
          assigneeIds: fields.assigneeIds,
          assignedToId: deleteField(),
          assignedToName: deleteField(),
          assignedToRole: deleteField(),
          assignedToActive: deleteField(),
          updatedAt: new Date().toISOString()
        };
        batch.update(d.ref, itemUpdate);
      });
      await batch.commit();
    }
  } catch (err) {
    console.error('Failed to batch update assigned content items:', err);
  }
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
