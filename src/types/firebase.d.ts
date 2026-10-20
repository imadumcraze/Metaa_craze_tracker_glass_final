declare module 'firebase/app' {
  export interface FirebaseApp {
    name: string;
    options: Record<string, any>;
  }
  export function initializeApp(options: Record<string, any>, name?: string): FirebaseApp;
  export function getApps(): FirebaseApp[];
  export function getApp(name?: string): FirebaseApp;
}

declare module 'firebase/auth' {
  export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    phoneNumber: string | null;
    emailVerified: boolean;
    isAnonymous: boolean;
    tenantId: string | null;
    providerData: any[];
    refreshToken: string;
    metadata: any;
    providerId: string;
    getIdToken(forceRefresh?: boolean): Promise<string>;
    [key: string]: any;
  }

  export interface Auth {
    currentUser: User | null;
    [key: string]: any;
  }

  export interface UserCredential {
    user: User;
    providerId: string | null;
    operationType: string;
  }

  export interface OAuthCredential {
    accessToken?: string;
    idToken?: string;
    secret?: string;
    providerId: string;
    signInMethod: string;
  }

  export class GoogleAuthProvider {
    static credentialFromResult(userCredential: UserCredential): OAuthCredential | null;
    addScope(scope: string): void;
    [key: string]: any;
  }

  export class EmailAuthProvider {
    static credential(email: string, password: string): any;
  }

  export function getAuth(app?: any): Auth;
  export function signInWithPopup(auth: Auth, provider: any): Promise<UserCredential>;
  export function signInWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<UserCredential>;
  export function createUserWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<UserCredential>;
  export function updatePassword(user: User, newPassword: string): Promise<void>;
  export function reauthenticateWithCredential(user: User, credential: any): Promise<UserCredential>;
  export function onAuthStateChanged(auth: Auth, nextOrObserver: (user: User | null) => any, error?: (a: any) => any, completed?: () => any): () => void;
  export function signOut(auth: Auth): Promise<void>;
}

declare module 'firebase/firestore' {
  export interface Firestore {
    type: string;
    [key: string]: any;
  }

  export type Unsubscribe = () => void;

  export interface DocumentData {
    [field: string]: any;
  }

  export interface DocumentSnapshot<T = DocumentData> {
    id: string;
    ref: DocumentReference<T>;
    exists(): boolean;
    data(): T | undefined;
    [key: string]: any;
  }

  export interface QueryDocumentSnapshot<T = DocumentData> extends DocumentSnapshot<T> {
    data(): T;
  }

  export interface QuerySnapshot<T = DocumentData> {
    docs: QueryDocumentSnapshot<T>[];
    empty: boolean;
    size: number;
    forEach(callback: (result: QueryDocumentSnapshot<T>) => void, thisArg?: any): void;
    [key: string]: any;
  }

  export interface DocumentReference<T = DocumentData> {
    id: string;
    path: string;
    [key: string]: any;
  }

  export interface CollectionReference<T = DocumentData> {
    id: string;
    path: string;
    [key: string]: any;
  }

  export interface WriteBatch {
    set(documentRef: DocumentReference<any>, data: any, options?: any): WriteBatch;
    update(documentRef: DocumentReference<any>, data: any): WriteBatch;
    delete(documentRef: DocumentReference<any>): WriteBatch;
    commit(): Promise<void>;
  }

  export function getFirestore(app?: any): Firestore;
  export function collection(firestore: Firestore, path: string, ...pathSegments: string[]): CollectionReference<DocumentData>;
  export function doc(firestore: Firestore, path: string, ...pathSegments: string[]): DocumentReference<DocumentData>;
  export function doc(collection: CollectionReference<any>, path?: string): DocumentReference<DocumentData>;
  export function getDoc(reference: DocumentReference<any>): Promise<DocumentSnapshot<DocumentData>>;
  export function getDocs(query: any): Promise<QuerySnapshot<DocumentData>>;
  export function setDoc(reference: DocumentReference<any>, data: any, options?: any): Promise<void>;
  export function updateDoc(reference: DocumentReference<any>, data: any): Promise<void>;
  export function deleteDoc(reference: DocumentReference<any>): Promise<void>;
  export function writeBatch(firestore: Firestore): WriteBatch;
  export function query(collection: CollectionReference<any>, ...queryConstraints: any[]): any;
  export function where(fieldPath: string, opStr: string, value: any): any;
  export function deleteField(): any;
  export function onSnapshot(reference: any, onNext: (snapshot: any) => void, onError?: (error: any) => void): Unsubscribe;
}
