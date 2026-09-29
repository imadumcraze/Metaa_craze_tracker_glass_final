export type ClientStatus = 'Active' | 'Inactive';

export type UserRole = 'admin' | 'viewer' | 'client';

export interface UserAccessSession {
  role: UserRole;
  clientId?: string; // Set when role is 'client'
  clientName?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  roleTitle: string; // e.g. "Director", "Production Lead", "Account Manager"
  addedAt: string;
}

export interface Client {
  id: string;
  clientId: string; // e.g. "MC-CL-001"
  name: string;
  companyName: string;
  contactPerson: string;
  contactNumber: string;
  email: string;
  monthlyPackageFee: string; // e.g. "$650/mo" or "LKR 120,000"
  status: ClientStatus;
  notes: string;
  createdAt: string;
  // Client portal private access code
  accessCode?: string;
  // Standard monthly deliverables agreed for this client
  defaultGraphicPostQty?: number;
  defaultVideoQty?: number;
  defaultSpecialDayPostQty?: number;
  defaultCoverPhotoQty?: number;
  defaultOtherQty?: number;
}

export interface InitialPackageData {
  createPackageNow: boolean;
  month: number;
  year: number;
  graphicPostQty: number;
  videoQty: number;
  specialDayPostQty: number;
  coverPhotoQty: number;
  otherQty: number;
  autoGenerateContent: boolean;
}

export type PackageStatus = 'Active' | 'Completed' | 'In Planning';

export interface MonthlyPackage {
  id: string;
  packageId: string; // e.g. "PKG-202610-001"
  clientId: string;
  month: number; // 1-12
  year: number; // e.g. 2026
  graphicPostQty: number;
  videoQty: number;
  specialDayPostQty: number;
  coverPhotoQty: number;
  otherQty: number;
  totalDeliverables: number; // calculated automatically
  status: PackageStatus;
  notes: string;
  createdAt: string;
}

export type ContentType =
  | 'Graphic Post'
  | 'Video'
  | 'Special Day Post'
  | 'Cover Photo'
  | 'Other';

export type ContentStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Pending Approval'
  | 'Approved'
  | 'Published'
  | 'On Hold';

export interface ContentItem {
  id: string;
  contentId: string; // e.g. "CNT-202610-001"
  clientId: string;
  packageId: string;
  month: number; // 1-12
  year: number; // e.g. 2026
  contentType: ContentType;
  contentNumber: number; // e.g. 1
  displayNumber: string; // e.g. "Graphic Post 01", "Video 02"
  title: string; // Content Title / Description
  plannedDate: string; // YYYY-MM-DD
  actualPublishedDate?: string; // YYYY-MM-DD
  status: ContentStatus;
  postUrl?: string; // live social media link
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export type TabType =
  | 'dashboard'
  | 'clients'
  | 'packages'
  | 'tracker'
  | 'calendar'
  | 'reports';
