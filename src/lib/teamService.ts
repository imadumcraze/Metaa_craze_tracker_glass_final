import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  signOut as secondarySignOut,
  signOut,
  User
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  writeBatch,
  Unsubscribe,
  DocumentData,
  QuerySnapshot
} from 'firebase/firestore';
import { auth, db } from './firebaseAuth';
import firebaseConfig from '../../firebase-applet-config.json';
import { TeamMember, TeamTask } from '../types';
import { getStoredTeamMembers, saveTeamMembers, getStoredTeamTasks, saveTeamTasks } from './storage';
import { IS_LOCAL_DEV } from './adminConfig';

export const TEAM_EMAIL_DOMAIN = 'team.metaacraze.app';
export const TEAM_MEMBERS_COLLECTION = 'teamMembers';

/**
 * Validates a team username:
 * 3-20 characters, lowercase letters, numbers, dot, underscore only.
 */
export const validateUsername = (username: string): { valid: boolean; error?: string } => {
  const clean = username.trim().toLowerCase();
  if (clean.length < 3 || clean.length > 20) {
    return { valid: false, error: 'Username must be between 3 and 20 characters.' };
  }
  const regex = /^[a-z0-9._]+$/;
  if (!regex.test(clean)) {
    return {
      valid: false,
      error: 'Username can only contain lowercase letters, numbers, dots, and underscores.'
    };
  }
  return { valid: true };
};

/**
 * Converts a username to an internal email
 */
export const usernameToEmail = (username: string): string => {
  return `${username.trim().toLowerCase()}@${TEAM_EMAIL_DOMAIN}`;
};

/**
 * Extracts username from an internal email
 */
export const emailToUsername = (email?: string | null): string => {
  if (!email) return '';
  const parts = email.split('@');
  return parts[0] || '';
};

/**
 * Checks if an email belongs to the team domain
 */
export const isTeamEmail = (email?: string | null): boolean => {
  if (!email) return false;
  return email.toLowerCase().endsWith(`@${TEAM_EMAIL_DOMAIN}`);
};

/**
 * Helper to get or initialize the secondary Firebase app used for admin creating member accounts
 * without displacing the admin's active auth session.
 */
const getSecondaryApp = () => {
  const existing = getApps().find((a: any) => a.name === 'secondary');
  if (existing) {
    return existing;
  }
  return initializeApp(firebaseConfig, 'secondary');
};

/**
 * Fetch a team member profile by UID from Firestore, with localStorage fallback for local/offline mode.
 */
export const fetchTeamMemberProfile = async (uid: string): Promise<TeamMember | null> => {
  try {
    const snap = await getDoc(doc(db, TEAM_MEMBERS_COLLECTION, uid));
    if (snap.exists()) {
      return snap.data() as TeamMember;
    }
  } catch (err) {
    console.warn('Failed to fetch team member profile from Firestore, checking local cache:', err);
  }

  // Fallback to local storage
  const localMembers = getStoredTeamMembers();
  return localMembers.find((m) => m.uid === uid) || null;
};

/**
 * Team member login via username and password.
 * Converts username to internal email, authenticates, and validates active profile.
 */
export const teamLogin = async (username: string, password: string): Promise<TeamMember> => {
  const val = validateUsername(username);
  if (!val.valid) {
    throw new Error(val.error || 'Invalid username format.');
  }

  const email = usernameToEmail(username);

  let userCred;
  try {
    userCred = await signInWithEmailAndPassword(auth, email, password);
  } catch (authErr: any) {
    const code = authErr.code || '';
    if (
      IS_LOCAL_DEV &&
      (code === 'auth/network-request-failed' ||
        code === 'auth/operation-not-allowed' ||
        code === 'auth/configuration-not-found')
    ) {
      const local = getStoredTeamMembers();
      const cleanUser = username.trim().toLowerCase();
      const found = local.find((m) => m.username === cleanUser);
      if (found) {
        if (!found.active) {
          throw new Error('Account inactive. Contact admin.');
        }
        return found;
      }
    }
    if (
      code === 'auth/invalid-credential' ||
      code === 'auth/user-not-found' ||
      code === 'auth/wrong-password' ||
      code === 'auth/invalid-email'
    ) {
      throw new Error('Invalid username or password.');
    }
    if (code === 'auth/too-many-requests') {
      throw new Error('Too many failed attempts. Please try again later.');
    }
    throw new Error(authErr.message || 'Authentication failed.');
  }

  // Verify profile in Firestore
  let profile = await fetchTeamMemberProfile(userCred.user.uid);

  // If not found in Firestore yet (e.g. offline fallback matches by username)
  if (!profile) {
    const local = getStoredTeamMembers();
    const cleanUser = username.trim().toLowerCase();
    profile = local.find((m) => m.username === cleanUser) || null;
  }

  if (!profile || profile.active === false) {
    await signOut(auth);
    throw new Error('Account inactive. Contact admin.');
  }

  return profile;
};

/**
 * Change the logged-in team member's password.
 * If reauthentication is needed, user will be prompted for current password.
 */
export const changeTeamMemberPassword = async (
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('No user is currently signed in.');
  }

  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters.');
  }

  try {
    await updatePassword(auth.currentUser, newPassword);
  } catch (err: any) {
    if (err.code === 'auth/requires-recent-login') {
      if (!currentPassword) {
        throw new Error('Please enter your current password to confirm this change.');
      }
      if (!auth.currentUser.email) {
        throw new Error('User email not found.');
      }
      const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
    } else {
      throw err;
    }
  }
};

/**
 * Admin: Create a new team member account.
 * Uses a secondary Firebase App instance so the admin's session remains untouched.
 */
export const createTeamMember = async (data: {
  name: string;
  roleTitle: string;
  username: string;
  password: string;
  createdBy?: string;
}): Promise<TeamMember> => {
  const val = validateUsername(data.username);
  if (!val.valid) {
    throw new Error(val.error || 'Invalid username format.');
  }

  if (!data.name.trim()) {
    throw new Error('Please enter the full name.');
  }

  if (!data.roleTitle.trim()) {
    throw new Error('Please enter the job role title.');
  }

  if (!data.password || data.password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  const cleanUsername = data.username.trim().toLowerCase();
  const email = usernameToEmail(cleanUsername);

  const secondary = getSecondaryApp();
  const secondaryAuthInstance = getAuth(secondary);

  let newUid = '';

  try {
    const userCred = await createUserWithEmailAndPassword(
      secondaryAuthInstance,
      email,
      data.password
    );
    newUid = userCred.user.uid;
    // Always sign out of the secondary auth instance immediately
    await secondarySignOut(secondaryAuthInstance);
  } catch (err: any) {
    await secondarySignOut(secondaryAuthInstance).catch(() => {});
    if (err.code === 'auth/email-already-in-use') {
      throw new Error('This username was used before. Choose a different username.');
    }
    if (
      IS_LOCAL_DEV &&
      (err.code === 'auth/network-request-failed' ||
        err.code === 'auth/operation-not-allowed' ||
        err.code === 'auth/configuration-not-found')
    ) {
      newUid = `team-mem-${Date.now()}`;
    } else {
      throw new Error(err.message || 'Failed to create team member account.');
    }
  }

  const newMember: TeamMember = {
    uid: newUid,
    name: data.name.trim(),
    roleTitle: data.roleTitle.trim(),
    username: cleanUsername,
    active: true,
    createdAt: new Date().toISOString(),
    createdBy: data.createdBy || auth.currentUser?.email || 'admin'
  };

  // Write to primary Firestore
  try {
    await setDoc(doc(db, TEAM_MEMBERS_COLLECTION, newMember.uid), newMember);
  } catch (err: any) {
    console.error('Failed to save team member profile to Firestore:', err);
    // Even if cloud write fails, write to local storage as fallback
  }

  // Update local storage
  const currentLocal = getStoredTeamMembers();
  const updated = [newMember, ...currentLocal.filter((m) => m.uid !== newMember.uid)];
  saveTeamMembers(updated);

  return newMember;
};

/**
 * Admin: Update an existing team member's name, role title, or active status.
 */
export const updateTeamMember = async (
  uid: string,
  updates: Partial<Pick<TeamMember, 'name' | 'roleTitle' | 'active'>>
): Promise<void> => {
  const memberRef = doc(db, TEAM_MEMBERS_COLLECTION, uid);
  await updateDoc(memberRef, updates);

  // Update local storage
  const currentLocal = getStoredTeamMembers();
  const updated = currentLocal.map((m) => (m.uid === uid ? { ...m, ...updates } : m));
  saveTeamMembers(updated);
};

/**
 * Admin: Delete a team member document from Firestore.
 * Login will then be blocked by the profile check and Firestore rules.
 */
export const deleteTeamMember = async (uid: string): Promise<void> => {
  const memberRef = doc(db, TEAM_MEMBERS_COLLECTION, uid);
  await deleteDoc(memberRef);

  // Update local storage
  const currentLocal = getStoredTeamMembers();
  const updated = currentLocal.filter((m) => m.uid !== uid);
  saveTeamMembers(updated);
};

/**
 * Realtime subscription to team members (Admin only).
 */
export const subscribeToTeamMembers = (
  onUpdate: (members: TeamMember[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const q = collection(db, TEAM_MEMBERS_COLLECTION);
  return onSnapshot(
    q,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const members: TeamMember[] = [];
      snapshot.forEach((docSnap: any) => {
        members.push(docSnap.data() as TeamMember);
      });
      // Sort alphabetically by name
      members.sort((a, b) => a.name.localeCompare(b.name));
      onUpdate(members);
    },
    (err: any) => {
      console.error('Error listening to teamMembers collection:', err);
      if (onError) onError(err);
    }
  );
};

// ============================================================================
// ADMIN DAILY TEAM TASKS (teamTasks collection)
// ============================================================================

export const TEAM_TASKS_COLLECTION = 'teamTasks';

/**
 * Save / update an admin daily task in Firestore and local storage.
 */
export const saveTeamTask = async (task: TeamTask): Promise<void> => {
  try {
    const cleanData: Record<string, any> = {};
    for (const [key, value] of Object.entries(task)) {
      if (value !== undefined) {
        cleanData[key] = value;
      }
    }
    const taskRef = doc(db, TEAM_TASKS_COLLECTION, task.id);
    await setDoc(taskRef, cleanData, { merge: true });
  } catch (err: any) {
    console.error('Failed to save team task to Firestore:', err);
  }

  // Update local storage
  const local = getStoredTeamTasks();
  const updated = [task, ...local.filter((t) => t.id !== task.id)];
  saveTeamTasks(updated);
};

/**
 * Admin: Delete a daily task from Firestore and local storage.
 */
export const deleteTeamTask = async (taskId: string): Promise<void> => {
  try {
    const taskRef = doc(db, TEAM_TASKS_COLLECTION, taskId);
    await deleteDoc(taskRef);
  } catch (err: any) {
    console.error('Failed to delete team task from Firestore:', err);
  }

  // Update local storage
  const local = getStoredTeamTasks();
  const updated = local.filter((t) => t.id !== taskId);
  saveTeamTasks(updated);
};

/**
 * Mark a team task as done or undone.
 * Affects ONLY keys 'done', 'doneAt', 'updatedAt' to satisfy Firestore rules.
 */
export const setTeamTaskDone = async (taskId: string, done: boolean): Promise<void> => {
  const updates: { done: boolean; doneAt: string; updatedAt: string } = {
    done,
    doneAt: done ? new Date().toISOString() : '',
    updatedAt: new Date().toISOString()
  };

  try {
    const taskRef = doc(db, TEAM_TASKS_COLLECTION, taskId);
    await updateDoc(taskRef, updates);
  } catch (err: any) {
    console.error('Failed to update team task done state in Firestore:', err);
  }

  // Update local storage
  const local = getStoredTeamTasks();
  const updated = local.map((t) => (t.id === taskId ? { ...t, ...updates } : t));
  saveTeamTasks(updated);
};

/**
 * Admin: Delete all tasks assigned to a specific team member (e.g. upon member deletion).
 */
export const deleteTasksForMember = async (memberUid: string): Promise<void> => {
  try {
    const q = query(
      collection(db, TEAM_TASKS_COLLECTION),
      where('assignedToId', '==', memberUid)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
    }
  } catch (err: any) {
    console.error('Failed to delete member tasks from Firestore:', err);
  }

  // Update local storage
  const local = getStoredTeamTasks();
  const updated = local.filter((t) => t.assignedToId !== memberUid);
  saveTeamTasks(updated);
};

/**
 * Real-time subscription to team tasks.
 * If memberUidOrNull is provided, filters by assignedToId to satisfy member read security rules.
 * If null (admin), listens to the entire collection.
 */
export const subscribeToTeamTasks = (
  memberUidOrNull: string | null,
  onUpdate: (tasks: TeamTask[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  const q = memberUidOrNull
    ? query(
        collection(db, TEAM_TASKS_COLLECTION),
        where('assignedToId', '==', memberUidOrNull)
      )
    : collection(db, TEAM_TASKS_COLLECTION);

  return onSnapshot(
    q,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const tasks: TeamTask[] = [];
      snapshot.forEach((docSnap: any) => {
        tasks.push(docSnap.data() as TeamTask);
      });
      // Sort by date, then createdAt
      tasks.sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return (a.createdAt || '').localeCompare(b.createdAt || '');
      });
      onUpdate(tasks);
    },
    (err: any) => {
      console.error('Error listening to teamTasks collection:', err);
      if (onError) onError(err);
    }
  );
};
