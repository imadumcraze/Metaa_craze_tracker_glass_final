// Keep in sync with firestore.rules
export const ADMIN_EMAILS: string[] = ['imadu.mcraze@gmail.com'];

export const isAdminEmail = (email?: string | null): boolean => {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return ADMIN_EMAILS.some((adminEmail) => adminEmail.toLowerCase() === normalized);
};

// true only when running `npm run dev`, always false in a deployed build
export const IS_LOCAL_DEV: boolean = import.meta.env.DEV;
